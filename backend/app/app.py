from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, UUID4
from typing import Optional, Dict, Any, AsyncGenerator
from datetime import datetime
from contextlib import asynccontextmanager
from app.db import User, create_db_and_tables
from app.schemas import UserCreate, UserRead, UserUpdate
from app.users import auth_backend, current_active_user, fastapi_users
from app import cmd
from app import target
from sqlalchemy import select
from app.db import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.target import Target, get_target_db
from uuid import UUID

import subprocess
import asyncio
import os
import json
import logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Not needed if you setup a migration system like Alembic
    await create_db_and_tables()
    yield


app = FastAPI(
    title="CMD Server API",
    version="1.0.0",
    description="API for managing server deployments and monitoring",
    docs_url="/docs",  # Swagger UI (default)
    redoc_url="/redoc",  # ReDoc alternative
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://veoliaint.atomiton.com:8888",  # Add your frontend port
        "http://veoliaint.atomiton.com:3000",
        "http://veoliaint.atomiton.com",
    ],
    allow_credentials=True,  # This requires specific origins, not "*"
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(
    fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"]
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)
app.include_router(
    cmd.router, tags=["commands"], dependencies=[Depends(current_active_user)]
)
app.include_router(
    target.router, tags=["targets"], dependencies=[Depends(current_active_user)]
)


@app.get("/authenticated-route")
async def authenticated_route(user: User = Depends(current_active_user)):
    return {"message": f"Hello {user.email}!"}


# Models for API requests
class DeploymentRequest(BaseModel):
    commit_id: Optional[str] = None


class EnvironmentChangeRequest(BaseModel):
    environment: str  # "development" or "production"


class LogStreamRequest(BaseModel):
    log_type: str  # "engine", "nohup", "co_engine", "error"


@app.get("/api/deployment/config")
async def get_deployment_config(
    target_id: UUID, db: AsyncSession = Depends(get_async_session)
):
    stmt = select(Target).where(Target.id == target_id)
    result = await db.execute(stmt)
    db_target = result.scalar_one_or_none()
    if db_target is None:
        raise HTTPException(status_code=404, detail="Target not found")
    print(f"Using server path: {db_target.server_path}")
    try:
        config_file_path = db_target.server_path + "/atomiton.env"
        if not os.path.exists(config_file_path):
            config_file_path = "./atomiton.env"
        with open(config_file_path, "r") as f:
            lines = f.readlines()
            print("Config Env:   ", lines[1].strip())
            print("Config Port:  ", lines[3].strip())
            print("Config Source:", lines[5].strip())
            return {
                "Target": {
                    "server_name": db_target.name,
                    "server_tag": db_target.server_tag,
                    "server_alias": db_target.server_alias,
                    "server_path": db_target.server_path,
                    "server_port": db_target.server_port,
                    "server_role": db_target.server_role,
                },
                "env": lines[1].strip(),
                "port": lines[3].strip(),
                "source": lines[11].strip(),
                "database": lines[5].strip(),
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read config: {str(e)}")


# Utility function to execute shell commands
async def execute_command(
    command: str, execute: bool = True, cwd: Optional[str] = None
) -> Dict[str, Any]:
    print(f"[CMD]: {command} in {cwd if cwd else 'current directory'}")
    if not execute:
        return {
            "success": True,
            "message": "Command execution is disabled",
            "command": command,
        }
    try:
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd,
        )
        stdout, stderr = await process.communicate()
        print(f"[CMD Status]: {process.returncode}")
        if stdout:
            print(f"[CMD Output]: {stdout.decode()}")
        return {
            "success": process.returncode == 0,
            "stdout": stdout.decode(),
            "stderr": stderr.decode(),
            "return_code": process.returncode,
        }
    except Exception as e:
        print(f"[CMD Error]: {str(e)}")
        return {"success": False, "error": str(e), "return_code": -1}


# 1. Pull Backend Source
@app.get("/api/deployment/pull-be-source")
async def pull_be_source(
    target_id: UUID,
    background_tasks: BackgroundTasks,
    execute: bool = False,
    asynchronous: bool = False,
    current_user=Depends(current_active_user),
):
    print("Deploy the latest Backend commit")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            commands = [
                f"cd {source_path}/source_code/atprofveolia/",
                "git checkout dev",
                "sleep 2",
                "git pull",
                f"cd {source_path}",
            ]
            command = " && ".join(commands)
            pull_result = await execute_command(command, execute=execute)

            if pull_result["success"]:
                if asynchronous:
                    background_tasks.add_task(restart_server_task, target_id)
                    return {
                        "message": "Backend source updated successfully",
                        "status": "restarting",
                    }
                else:
                    restart_result = await restart_server_task(
                        target_id, execute=execute, current_user=current_user
                    )

            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update backend source: {pull_result.get('stderr', pull_result.get('error'))}",
                )

            return {
                "message": "Backend source updated successfully",
                "path": source_path,
                "success": True,
                "details": {"pull": pull_result, "restart": restart_result},
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# 2. Pull Specific Backend Source
@app.get("/api/deployment/pull-specific-be-source")
async def pull_specific_be_source(
    target_id: UUID,
    background_tasks: BackgroundTasks,
    execute: bool = False,
    commit_id: Optional[str] = None,
    current_user=Depends(current_active_user),
):
    print("Deploy a specific Backend commit")
    if not commit_id:
        raise HTTPException(status_code=400, detail="Commit ID is required")

    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            commands = [
                f"cd {source_path}/source_code/atprofveolia/",
                "git fetch",
                f"git checkout {commit_id}",
                f"cd {source_path}",
            ]
            command = " && ".join(commands)
            result = await execute_command(command, execute)

            if result["success"]:
                background_tasks.add_task(restart_server_task, target_id)
                return {
                    "message": f"Backend source updated to commit {commit_id}",
                    "status": "restarting",
                }
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update to commit {commit_id}: {result.get('stderr', result.get('error'))}",
                )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# 3. Pull UI Source
@app.get("/api/deployment/pull-ui-source")
async def pull_ui_source(
    target_id: UUID, execute: bool = False, current_user=Depends(current_active_user)
):
    print("Deploy the latest UI commit")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            commands = [
                f"cd {source_path}/source_code/atprofveoliaui/",
                "git checkout build",
                "sleep 2",
                "git pull",
                f"rm -rf {source_path}/server/ui/*",
                f"rsync -av {source_path}/source_code/atprofveoliaui/api-1.0/ {source_path}/server/ui/",
                f"cd {source_path}",
            ]
            command = " && ".join(commands)
            result = await execute_command(command, execute)

            if result["success"]:
                return {"message": "UI source updated successfully"}
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update UI source: {result.get('stderr', result.get('error'))}",
                )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# 4. Pull Specific UI Source
@app.get("/api/deployment/pull-specific-ui-source")
async def pull_specific_ui_source(
    target_id: UUID,
    execute: bool = False,
    commit_id: Optional[str] = None,
    current_user=Depends(current_active_user),
):
    print("Deploy a specific UI commit")
    if not commit_id:
        raise HTTPException(status_code=400, detail="Commit ID is required")

    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            commands = [
                f"cd {source_path}/source_code/atprofveoliaui/",
                "git fetch",
                f"git checkout {commit_id}",
                f"rm -rf {source_path}/server/ui/*",
                f"rsync -av {source_path}/source_code/atprofveoliaui/api-1.0/ {source_path}/server/ui/",
                f"cd {source_path}",
            ]

            command = " && ".join(commands)
            result = await execute_command(command, execute)

            if result["success"]:
                return {"message": f"UI source updated to commit {commit_id}"}
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update UI to commit {commit_id}: {result.get('stderr', result.get('error'))}",
                )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# 5. Re-Schema
@app.get("/api/deployment/re-schema")
async def re_schema(
    target_id: UUID,
    background_tasks: BackgroundTasks,
    current_user=Depends(current_active_user),
):
    print("Execute re-schema process")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            # This is a complex operation that should run in background
            background_tasks.add_task(execute_reschema_process, source_path)
            return {"message": "Re-schema process started", "status": "processing"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


async def execute_reschema_process(source_path: str, execute: bool = False):
    print("Background task for re-schema process")
    commands = [
        f"sed -i '5s/production/development/' {source_path}/server/sff.auto.config.cdm",
        f"sleep 15",
        f"cd {source_path}",
        f"python3 {source_path}/scripts/Reschema.py",
        f"sed -i '5s/development/production/' {source_path}/server/sff.auto.config.cdm",
        f"cd {source_path}",
    ]

    for command in commands:
        await execute_command(command, execute)


# 6. Change Environment and Restart
@app.get("/api/deployment/change-environment")
async def change_environment_and_restart(
    target_id: UUID,
    background_tasks: BackgroundTasks,
    execute: bool = False,
    environment: Optional[str] = None,
    current_user=Depends(current_active_user),
):
    print("Change environment (development/production) and restart server")
    if environment not in ["development", "production"]:
        raise HTTPException(
            status_code=400, detail="Environment must be 'development' or 'production'"
        )

    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            # Get current environment
            current_env_command = f"sed -n '5s/.*:[[:space:]]*//p' {source_path}/server/sff.auto.config.cdm | sed 's/ *#.*//'"
            current_env_result = await execute_command(current_env_command, execute)
            current_env = current_env_result["stdout"].strip()

            if current_env == environment:
                return {"message": f"Already in {environment} environment"}

            # Change environment
            if environment == "production":
                change_cmd = f"sed -i '5s/development/production/' {source_path}/server/sff.auto.config.cdm"
            else:
                change_cmd = f"sed -i '5s/production/development/' {source_path}/server/sff.auto.config.cdm"

            result = await execute_command(change_cmd, execute)

            if result["success"]:
                background_tasks.add_task(restart_server_task, target_id)
                return {
                    "message": f"Environment changed to {environment}",
                    "status": "restarting",
                }
            else:
                raise HTTPException(
                    status_code=500, detail="Failed to change environment"
                )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# 7. Restart Server
@app.get("/api/deployment/restart-server")
async def restart_server_endpoint(
    target_id: UUID,
    background_tasks: BackgroundTasks,
    execute: bool = False,
    asynchronous: bool = False,
    current_user=Depends(current_active_user),
):
    print("Restart the server")
    if asynchronous:
        background_tasks.add_task(restart_server_task, target_id, execute=execute)
        return {"message": "Server restart initiated", "status": "restarting"}
    else:
        return await restart_server_task(
            target_id, execute=execute, current_user=current_user
        )


# Background task to restart server
async def restart_server_task(
    target_id: UUID, execute: bool = False, current_user=Depends(current_active_user)
):
    print("Background task to restart server")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            # Kill existing process
            kill_cmd = f"pkill -f 'java.*{source_path}/server'"
            kill_be_result = await execute_command(kill_cmd, execute)

            # Start server
            start_cmd = f"nohup java @{source_path}/server/java-options.txt -jar {source_path}/server/tql.engine2.4.jar > {source_path}/server/nohup.out 2>&1 &"
            start_be_result = await execute_command(start_cmd, execute)

            # Wait and start co_engine
            await asyncio.sleep(5)
            co_engine_cmd = f"nohup python {source_path}/pyastackcore/pyastackcore/co_engine.py > {source_path}/pyastackcore/output.log 2>&1 &"
            start_co_result = await execute_command(co_engine_cmd, execute)

            return {
                "message": "Engine restarted successfully",
                "path": source_path,
                "success": True,
                "details": {
                    "kill_be": kill_be_result,
                    "start_be": start_be_result,
                    "start_co": start_co_result,
                },
            }

    except Exception as e:
        print(f"Error in restart_server_task: {str(e)}")

    print("Server restart task completed")


# 8. View Error Logs
@app.get("/api/logs/engine")
async def view_engine_logs(
    target_id: UUID, execute: bool = False, current_user=Depends(current_active_user)
):
    print("Stream engine.log file")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]
            log_file = f"{source_path}/server/logs/engine.log"

            async def generate():
                try:
                    process = await asyncio.create_subprocess_exec(
                        "tail",
                        "-f",
                        log_file,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    )

                    while True:
                        line = await process.stdout.readline()
                        if line:
                            yield f"data: {line.decode()}\n\n"
                        else:
                            break
                except Exception as e:
                    yield f"data: Error reading log: {str(e)}\n\n"

            return StreamingResponse(generate(), media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# 9. Clear Cache
@app.get("/api/deployment/clear-cache")
async def clear_cache(
    target_id: UUID, execute: bool = False, current_user=Depends(current_active_user)
):
    print("Clear cached files")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            command = f"rm -rf {source_path}/server/application/spaces/caches/*"
            result = await execute_command(command, execute)

            if result["success"]:
                return {"message": "Cache cleared successfully"}
            else:
                raise HTTPException(status_code=500, detail="Failed to clear cache")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# 10. Debug Mode (View nohup.out)
@app.get("/api/logs/nohup")
async def view_nohup_logs(
    target_id: UUID, execute: bool = False, current_user=Depends(current_active_user)
):
    print("Stream nohup.out file")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]
            log_file = f"{source_path}/server/nohup.out"

            async def generate():
                try:
                    process = await asyncio.create_subprocess_exec(
                        "tail", "-f", log_file, stdout=asyncio.subprocess.PIPE
                    )

                    while True:
                        line = await process.stdout.readline()
                        if line:
                            yield f"data: {line.decode()}\n\n"
                        else:
                            break
                except Exception as e:
                    yield f"data: Error reading log: {str(e)}\n\n"

            return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# 11. Co Engine Logs
@app.get("/api/logs/co-engine")
async def view_co_engine_logs(
    target_id: UUID, execute: bool = False, current_user=Depends(current_active_user)
):
    print("Stream co_engine output.log file")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]
            log_file = f"{source_path}/server/output.log"

            async def generate():
                try:
                    process = await asyncio.create_subprocess_exec(
                        "tail", "-f", log_file, stdout=asyncio.subprocess.PIPE
                    )

                    while True:
                        line = await process.stdout.readline()
                        if line:
                            yield f"data: {line.decode()}\n\n"
                        else:
                            break
                except Exception as e:
                    yield f"data: Error reading log: {str(e)}\n\n"

            return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# 12. Pull Veolia Plugin
@app.get("/api/deployment/pull-veolia-plugin")
async def pull_veolia_plugin(
    target_id: UUID, execute: bool = False, current_user=Depends(current_active_user)
):
    print("Deploy the latest Veolia Plugin commit")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            commands = [
                f"cd {source_path}/source_code/veoliaplugin/",
                "git checkout build",
                "sleep 2",
                "git pull",
                f"mkdir -p {source_path}/server/extensions",
                f"rm -rf {source_path}/server/extensions/*",
                f"rsync -av {source_path}/source_code/veoliaplugin/widget/ {source_path}/server/extensions/",
                f"cd {source_path}",
            ]

            command = " && ".join(commands)
            result = await execute_command(command, execute)

            if result["success"]:
                return {"message": "Veolia plugin updated successfully"}
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update Veolia plugin: {result.get('stderr', result.get('error'))}",
                )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# 13. Kill All Engine
@app.get("/api/deployment/kill-engines")
async def kill_all_engines(
    target_id: UUID, execute: bool = False, current_user=Depends(current_active_user)
):
    print("Kill all running engines")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            command = f"pkill -f 'java.*{source_path}/server'"
            result = await execute_command(command, execute)

            return {
                "message": "All engines killed",
                "path": source_path,
                "success": True,
                "details": result,
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# 14. View Error Logs Only
@app.get("/api/logs/errors")
async def view_error_logs_only(
    target_id: UUID, execute: bool = False, current_user=Depends(current_active_user)
):
    print("Stream only error logs from nohup.out")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]
            log_file = f"{source_path}/server/nohup.out"

            async def generate():
                try:
                    process = await asyncio.create_subprocess_shell(
                        f"tail -f {log_file} | grep --line-buffered 'error'",
                        stdout=asyncio.subprocess.PIPE,
                    )

                    while True:
                        line = await process.stdout.readline()
                        if line:
                            yield f"data: {line.decode()}\n\n"
                        else:
                            break
                except Exception as e:
                    yield f"data: Error reading log: {str(e)}\n\n"

            return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# Status endpoint
@app.get("/api/deployment/status")
async def get_deployment_status(
    target_id: UUID, execute: bool = False, current_user=Depends(current_active_user)
):
    print("Get current deployment status")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            # Check if server is running
            check_cmd = f"pgrep -f 'java.*{source_path}/server'"
            result = await execute_command(check_cmd, execute)
            is_running = result["success"] and result["stdout"].strip()

            # Get current commits
            be_commit_cmd = f"cd {source_path}/source_code/atprofveolia/ && git rev-parse --short HEAD"
            ui_commit_cmd = f"cd {source_path}/source_code/atprofveoliaui/ && git rev-parse --short HEAD"

            be_commit_result = await execute_command(be_commit_cmd, execute)
            ui_commit_result = await execute_command(ui_commit_cmd, execute)

            # Get current environment
            env_cmd = f"sed -n '5s/.*:[[:space:]]*//p' {source_path}/server/sff.auto.config.cdm | sed 's/ *#.*//'"
            env_result = await execute_command(env_cmd, execute)

            return {
                "environment": config["env"],
                "port": config["port"],
                "server_running": bool(is_running),
                "server_pid": result["stdout"].strip() if is_running else None,
                "current_be_commit": (
                    be_commit_result["stdout"].strip()
                    if be_commit_result["success"]
                    else "unknown"
                ),
                "current_ui_commit": (
                    ui_commit_result["stdout"].strip()
                    if ui_commit_result["success"]
                    else "unknown"
                ),
                "server_environment": (
                    env_result["stdout"].strip() if env_result["success"] else "unknown"
                ),
                "last_updated": datetime.now().isoformat(),
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/")
async def root():
    print("Root endpoint with API documentation links")
    return {
        "message": "CMD Server API",
        "version": "1.0.0",
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/openapi.json",
        },
        "endpoints": {
            "auth": "/auth",
            "deployment": "/api/deployment",
            "logs": "/api/logs",
            "status": "/api/deployment/status",
        },
    }
