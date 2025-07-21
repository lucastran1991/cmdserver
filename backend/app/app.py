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
from time import time

import subprocess
import asyncio
import os
import json
import logging

logging.basicConfig(
    format='[%(asctime)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    level=logging.INFO,
)

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
        "http://localhost:8888",
        "http://localhost:8000",
        "http://127.0.0.1:8888",
        "http://127.0.0.1:8000",
        "http://veoliaint.atomiton.com:8888",  # Add your frontend port
        "http://veoliaint.atomiton.com:8000",
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
    logging.info(f"Using server path: {db_target.server_path}")
    try:
        config_file_path = db_target.server_path + "/atomiton.env"
        if not os.path.exists(config_file_path):
            config_file_path = "./atomiton.env"
        with open(config_file_path, "r") as f:
            lines = f.readlines()
            logging.info("Config Env:   ", lines[1].strip())
            logging.info("Config Port:  ", lines[3].strip())
            logging.info("Config Source:", lines[5].strip())
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
    logging.info(f"[CMD]: {command} in {cwd if cwd else 'current directory'}")
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
        logging.info(f"[CMD Status]: {process.returncode}")
        if stdout:
            logging.info(f"[CMD Output]: {stdout.decode()}")
        return {
            "success": process.returncode == 0,
            "stdout": stdout.decode(),
            "stderr": stderr.decode(),
            "return_code": process.returncode,
        }
    except Exception as e:
        logging.info(f"[CMD Error]: {str(e)}")
        return {"success": False, "error": str(e), "return_code": -1}


# 1. Pull Backend Source
@app.get("/api/deployment/pull-be-source")
async def pull_be_source(
    target_id: UUID,
    background_tasks: BackgroundTasks,
    commit_id: Optional[str] = None,
    execute: bool = False,
    asynchronous: bool = False,
    current_user=Depends(current_active_user),
):
    logging.info("Deploy the latest Backend commit")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            logging.info(f"Source Path: {source_path}, Commit ID: {commit_id}, Execute: {execute}, asynchronous: {asynchronous}")

            if not commit_id:
                commit_id = "dev"  # Default to dev branch if no commit ID is provided

            commands = [
                f"cd {source_path}/source_code/atprofveolia/",
                "git reset --hard",  # Reset to the latest commit
                "git fetch",
                f"git checkout {commit_id}",
                "sleep 2",
                "git pull",
                f"cd {source_path}",
                "mkdir -p source_code/temp_backend",
                f"rsync -av {source_path}/source_code/atprofveolia/server/ {source_path}/source_code/temp_backend/",
                "rm -rf source_code/temp_backend/sff.sqldb.data/*",
                "rm -rf source_code/temp_backend/sff.auto.launch/*",
                "rm -rf source_code/temp_backend/spaces/reports/*",
                "rm -rf source_code/temp_backend/ui/*",
                "rm -rf source_code/temp_backend/config/*",
                "rm -rf source_code/temp_backend/spaces/*",
                f"cd {source_path}/source_code/temp_backend",
                "rm -f *.log *.out *.sh *.cdm, *.py *.jar *.xml *.txt",
                "rm -f sff.auto.config.cdm sff.auto.config.DEBUG.cdm sff.auto.config.docker.cdm",
                f"rsync -av {source_path}/source_code/temp_backend/ {source_path}/server/",
                f"cd {source_path}",
            ]
            command = " && ".join(commands)
            pull_result = await execute_command(command, execute=execute)

            if pull_result["success"]:
                if asynchronous:
                    background_tasks.add_task(
                        restart_server_task,
                        source_path=source_path,
                        execute=execute,
                        current_user=current_user,
                    )
                    return {
                        "message": "Backend source updated successfully",
                        "path": source_path,
                        "success": True,
                        "details": {
                            "pull": pull_result,
                            "restart": "waiting for background task",
                        },
                    }
                else:
                    restart_result = await restart_server_task(
                        source_path=source_path,
                        execute=execute,
                        current_user=current_user,
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


# 3. Pull UI Source
@app.get("/api/deployment/pull-ui-source")
async def pull_ui_source(
    target_id: UUID,
    commit_id: Optional[str] = None,
    execute: bool = False,
    current_user=Depends(current_active_user),
):
    logging.info("Deploy the latest UI commit")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            if not commit_id:
                commit_id = (
                    "build"  # Default to build branch if no commit ID is provided
                )

            commands = [
                f"cd {source_path}/source_code/atprofveoliaui/",
                "git reset --hard",  # Reset to the latest commit
                "git fetch",
                f"git checkout {commit_id}",
                "sleep 2",
                "git pull",
                f"cd {source_path}",
                "mkdir -p source_code/temp_frontend",
                f"cp -R {source_path}/server/ui/config {source_path}/source_code/temp_frontend/",
                f"rm -rf {source_path}/server/ui/*",
                f"rsync -av --exclude='config' {source_path}/source_code/atprofveoliaui/api-1.0/ {source_path}/server/ui/",
                f"rsync -av {source_path}/source_code/temp_frontend/config/ {source_path}/server/ui/config/",
                f"cd {source_path}",
            ]
            command = " && ".join(commands)
            result = await execute_command(command, execute)

            if result["success"]:
                return {
                    "message": "Frontend source updated successfully",
                    "path": source_path,
                    "success": True,
                    "details": {"pull": command},
                }
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update Frontend source: {result.get('stderr', result.get('error'))}",
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
    logging.info("Execute re-schema process")
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
    logging.info("Background task for re-schema process")
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
    logging.info("Change environment (development/production) and restart server")
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
                background_tasks.add_task(
                    restart_server_task,
                    source_path=source_path,
                    execute=execute,
                    current_user=current_user,
                )
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
    logging.info("Restart the server")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            if asynchronous:
                background_tasks.add_task(
                    restart_server_task,
                    source_path=source_path,
                    execute=execute,
                    current_user=current_user,
                )
                return {"message": "Server restart initiated", "status": "restarting"}
            else:
                restart_result = await restart_server_task(
                    source_path=source_path, execute=execute, current_user=current_user
                )

    except Exception as e:
        logging.info(f"Error in restart_server_task: {str(e)}")

    return {
        "message": "Backend source updated successfully",
        "target_id": target_id,
        "success": True,
        "details": {"restart": restart_result},
    }


# Background task to restart server
async def restart_server_task(
    source_path: str = "",
    execute: bool = False,
    current_user=Depends(current_active_user),
):
    logging.info("Background task to restart server")

    # Kill existing process
    kill_astack_cmd = f"pwdx $(pidof java) 2>/dev/null | grep '{source_path}/server' | cut -d: -f1 | xargs -r kill"
    kill_astack_result = await execute_command(kill_astack_cmd, execute)

    # Kill co_engine process
    kill_coengine_cmd = f"ps aux | grep '[p]ython.*{source_path}/pyastackcore' | awk '{{print $2}}' | xargs -r kill"
    kill_coengine_result = await execute_command(kill_coengine_cmd, execute)

    # Start server
    start_astack_cmd = f"cd {source_path}/server/ && nohup java @java-options.txt -jar tql.engine2.4.jar > nohup.out 2>&1 &"
    start_astack_result = await execute_command(start_astack_cmd, execute)

    # Wait and start coengine
    await asyncio.sleep(15)

    coengine_cmd = f"cd {source_path} && nohup python {source_path}/pyastackcore/pyastackcore/co_engine.py > output.log &"
    start_coengine_result = await execute_command(coengine_cmd, execute)

    logging.info("Server restart task completed")

    return {
        "message": "Engine restarted successfully",
        "path": source_path,
        "success": True,
        "details": {
            "kill_astack": kill_astack_result,
            "kill_coengine": kill_coengine_result,
            "start_astack": start_astack_result,
            "start_coengine": start_coengine_result,
        },
    }


# 8. View Error Logs
@app.get("/api/logs/engine")
async def view_engine_logs(
    target_id: UUID, execute: bool = False, current_user=Depends(current_active_user)
):
    logging.info("Stream engine.log file")
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
    logging.info("Clear cached files")
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
    logging.info("Stream nohup.out file")
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
    logging.info("Stream co_engine output.log file")
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
    logging.info("Deploy the latest Veolia Plugin commit")
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
    logging.info("Kill all running engines")
    try:
        async for db in get_async_session():
            config = await get_deployment_config(target_id, db)
            source_path = config["source"]

            kill_astack_cmd = f"pwdx $(pidof java) 2>/dev/null | grep '{source_path}/server' | cut -d: -f1 | xargs -r kill"
            kill_astack_result = await execute_command(kill_astack_cmd, execute)

            # Kill co_engine process
            kill_coengine_cmd = f"ps aux | grep '[p]ython.*{source_path}/pyastackcore' | awk '{{print $2}}' | xargs -r kill"
            kill_coengine_result = await execute_command(kill_coengine_cmd, execute)

            return {
                "message": "All engines killed",
                "path": source_path,
                "success": True,
                "details": {
                    "kill_astack_cmd": kill_astack_result,
                    "kill_coengine_cmd": kill_coengine_result,
                },
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# 14. View Error Logs Only
@app.get("/api/logs/errors")
async def view_error_logs_only(
    target_id: UUID, execute: bool = False, current_user=Depends(current_active_user)
):
    logging.info("Stream only error logs from nohup.out")
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
    logging.info("Get current deployment status")
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
    logging.info("Root endpoint with API documentation links")
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
