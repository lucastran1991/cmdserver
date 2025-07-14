from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, AsyncGenerator
import subprocess
import asyncio
import os
import json
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from app.db import User, create_db_and_tables
from app.schemas import UserCreate, UserRead, UserUpdate
from app.users import auth_backend, current_active_user, fastapi_users
from app import cmd
from app import target

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Not needed if you setup a migration system like Alembic
    await create_db_and_tables()
    yield

app = FastAPI(title="CMD Server API", version="1.0.0", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
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
    cmd.router,
    tags=["commands"],
    dependencies=[Depends(current_active_user)]
)
app.include_router(
    target.router,
    tags=["targets"],
    dependencies=[Depends(current_active_user)]
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

# Utility function to read config
def get_deployment_config():
    try:
        with open("/path/to/atomiton.env", "r") as f:
            lines = f.readlines()
            return {
                "env": lines[1].strip(),
                "port": lines[3].strip(),
                "source": lines[11].strip(),
                "database": lines[5].strip(),
                # Add other config values as needed
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read config: {str(e)}")

# Utility function to execute shell commands
async def execute_command(command: str, cwd: Optional[str] = None) -> Dict[str, Any]:
    try:
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd
        )
        stdout, stderr = await process.communicate()
        
        return {
            "success": process.returncode == 0,
            "stdout": stdout.decode(),
            "stderr": stderr.decode(),
            "return_code": process.returncode
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "return_code": -1
        }

# 1. Pull Backend Source
@app.post("/api/deployment/pull-be-source")
async def pull_be_source(background_tasks: BackgroundTasks, current_user=Depends(current_active_user)):
    """Deploy the latest Backend commit"""
    config = get_deployment_config()
    source_path = config["source"]
    
    commands = [
        f"cd {source_path}/source_code/atprofveolia/",
        "git checkout dev",
        "sleep 2",
        "git pull"
    ]
    
    command = " && ".join(commands)
    result = await execute_command(command)
    
    if result["success"]:
        # Trigger server restart in background
        background_tasks.add_task(restart_server_with_be_update)
        return {"message": "Backend source updated successfully", "status": "restarting"}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to update backend source: {result.get('stderr', result.get('error'))}")

# 2. Pull Specific Backend Source
@app.post("/api/deployment/pull-specific-be-source")
async def pull_specific_be_source(request: DeploymentRequest, background_tasks: BackgroundTasks, current_user=Depends(current_active_user)):
    """Deploy a specific Backend commit"""
    if not request.commit_id:
        raise HTTPException(status_code=400, detail="Commit ID is required")
    
    config = get_deployment_config()
    source_path = config["source"]
    
    commands = [
        f"cd {source_path}/source_code/atprofveolia/",
        "git fetch",
        f"git checkout {request.commit_id}"
    ]
    
    command = " && ".join(commands)
    result = await execute_command(command)
    
    if result["success"]:
        background_tasks.add_task(restart_server_with_be_update)
        return {"message": f"Backend source updated to commit {request.commit_id}", "status": "restarting"}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to update to commit {request.commit_id}: {result.get('stderr', result.get('error'))}")

# 3. Pull UI Source
@app.post("/api/deployment/pull-ui-source")
async def pull_ui_source(current_user=Depends(current_active_user)):
    """Deploy the latest UI commit"""
    config = get_deployment_config()
    source_path = config["source"]
    
    commands = [
        f"cd {source_path}/source_code/atprofveoliaui/",
        "git checkout build",
        "sleep 2",
        "git pull",
        f"rm -rf {source_path}/server/ui/*",
        f"rsync -av {source_path}/source_code/atprofveoliaui/api-1.0/ {source_path}/server/ui/"
    ]
    
    command = " && ".join(commands)
    result = await execute_command(command)
    
    if result["success"]:
        return {"message": "UI source updated successfully"}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to update UI source: {result.get('stderr', result.get('error'))}")

# 4. Pull Specific UI Source
@app.post("/api/deployment/pull-specific-ui-source")
async def pull_specific_ui_source(request: DeploymentRequest, current_user=Depends(current_active_user)):
    """Deploy a specific UI commit"""
    if not request.commit_id:
        raise HTTPException(status_code=400, detail="Commit ID is required")
    
    config = get_deployment_config()
    source_path = config["source"]
    
    commands = [
        f"cd {source_path}/source_code/atprofveoliaui/",
        "git fetch",
        f"git checkout {request.commit_id}",
        f"rm -rf {source_path}/server/ui/*",
        f"rsync -av {source_path}/source_code/atprofveoliaui/api-1.0/ {source_path}/server/ui/"
    ]
    
    command = " && ".join(commands)
    result = await execute_command(command)
    
    if result["success"]:
        return {"message": f"UI source updated to commit {request.commit_id}"}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to update UI to commit {request.commit_id}: {result.get('stderr', result.get('error'))}")

# 5. Re-Schema
@app.post("/api/deployment/re-schema")
async def re_schema(background_tasks: BackgroundTasks, current_user=Depends(current_active_user)):
    """Execute re-schema process"""
    config = get_deployment_config()
    source_path = config["source"]
    
    # This is a complex operation that should run in background
    background_tasks.add_task(execute_reschema_process, source_path)
    return {"message": "Re-schema process started", "status": "processing"}

async def execute_reschema_process(source_path: str):
    """Background task for re-schema process"""
    commands = [
        f"sed -i '5s/production/development/' {source_path}/server/sff.auto.config.cdm",
        # Add restart server commands
        f"sleep 15",
        f"cd {source_path}",
        f"python3 {source_path}/scripts/Reschema.py",
        f"sed -i '5s/development/production/' {source_path}/server/sff.auto.config.cdm",
        # Add restart server commands again
    ]
    
    for command in commands:
        await execute_command(command)

# 6. Change Environment and Restart
@app.post("/api/deployment/change-environment")
async def change_environment_and_restart(request: EnvironmentChangeRequest, background_tasks: BackgroundTasks, current_user=Depends(current_active_user)):
    """Change environment (development/production) and restart server"""
    if request.environment not in ["development", "production"]:
        raise HTTPException(status_code=400, detail="Environment must be 'development' or 'production'")
    
    config = get_deployment_config()
    source_path = config["source"]
    
    # Get current environment
    current_env_command = f"sed -n '5s/.*:[[:space:]]*//p' {source_path}/server/sff.auto.config.cdm | sed 's/ *#.*//'"
    current_env_result = await execute_command(current_env_command)
    current_env = current_env_result["stdout"].strip()
    
    if current_env == request.environment:
        return {"message": f"Already in {request.environment} environment"}
    
    # Change environment
    if request.environment == "production":
        change_cmd = f"sed -i '5s/development/production/' {source_path}/server/sff.auto.config.cdm"
    else:
        change_cmd = f"sed -i '5s/production/development/' {source_path}/server/sff.auto.config.cdm"
    
    result = await execute_command(change_cmd)
    
    if result["success"]:
        background_tasks.add_task(restart_server_task)
        return {"message": f"Environment changed to {request.environment}", "status": "restarting"}
    else:
        raise HTTPException(status_code=500, detail="Failed to change environment")

# 7. Restart Server
@app.post("/api/deployment/restart-server")
async def restart_server_endpoint(background_tasks: BackgroundTasks, current_user=Depends(current_active_user)):
    """Restart the server"""
    background_tasks.add_task(restart_server_task)
    return {"message": "Server restart initiated", "status": "restarting"}

async def restart_server_task():
    """Background task to restart server"""
    config = get_deployment_config()
    source_path = config["source"]
    
    # Kill existing process
    kill_cmd = f"pkill -f 'java.*{source_path}/server'"
    await execute_command(kill_cmd)
    
    # Start server
    start_cmd = f"cd {source_path}/server/ && nohup java @java-options.txt -jar tql.engine2.4.jar &> nohup.out &"
    await execute_command(start_cmd)
    
    # Wait and start co_engine
    await asyncio.sleep(10)
    co_engine_cmd = "nohup python /data2/Atomiton/WaterTRN/QA/pyastackcore/pyastackcore/co_engine.py > output.log &"
    await execute_command(co_engine_cmd)

async def restart_server_with_be_update():
    """Background task to restart server with backend update"""
    # Implementation similar to restart_server_pullBe function
    pass

# 8. View Error Logs
@app.get("/api/logs/engine")
async def view_engine_logs(current_user=Depends(current_active_user)):
    """Stream engine.log file"""
    config = get_deployment_config()
    source_path = config["source"]
    log_file = f"{source_path}/server/logs/engine.log"
    
    async def generate():
        try:
            process = await asyncio.create_subprocess_exec(
                "tail", "-f", log_file,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
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

# 9. Clear Cache
@app.post("/api/deployment/clear-cache")
async def clear_cache(current_user=Depends(current_active_user)):
    """Clear cached files"""
    config = get_deployment_config()
    source_path = config["source"]
    
    command = f"rm -rf {source_path}/server/application/spaces/caches/*"
    result = await execute_command(command)
    
    if result["success"]:
        return {"message": "Cache cleared successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to clear cache")

# 10. Debug Mode (View nohup.out)
@app.get("/api/logs/nohup")
async def view_nohup_logs(current_user=Depends(current_active_user)):
    """Stream nohup.out file"""
    config = get_deployment_config()
    source_path = config["source"]
    log_file = f"{source_path}/server/nohup.out"
    
    async def generate():
        try:
            process = await asyncio.create_subprocess_exec(
                "tail", "-f", log_file,
                stdout=asyncio.subprocess.PIPE
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

# 11. Co Engine Logs
@app.get("/api/logs/co-engine")
async def view_co_engine_logs(current_user=Depends(current_active_user)):
    """Stream co_engine output.log file"""
    config = get_deployment_config()
    source_path = config["source"]
    log_file = f"{source_path}/server/output.log"
    
    async def generate():
        try:
            process = await asyncio.create_subprocess_exec(
                "tail", "-f", log_file,
                stdout=asyncio.subprocess.PIPE
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

# 12. Pull Veolia Plugin
@app.post("/api/deployment/pull-veolia-plugin")
async def pull_veolia_plugin(current_user=Depends(current_active_user)):
    """Deploy the latest Veolia Plugin commit"""
    config = get_deployment_config()
    source_path = config["source"]
    
    commands = [
        f"cd {source_path}/source_code/veoliaplugin/",
        "git checkout build",
        "sleep 2",
        "git pull",
        f"mkdir -p {source_path}/server/extensions",
        f"rm -rf {source_path}/server/extensions/*",
        f"rsync -av {source_path}/source_code/veoliaplugin/widget/ {source_path}/server/extensions/"
    ]
    
    command = " && ".join(commands)
    result = await execute_command(command)
    
    if result["success"]:
        return {"message": "Veolia plugin updated successfully"}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to update Veolia plugin: {result.get('stderr', result.get('error'))}")

# 13. Kill All Engine
@app.post("/api/deployment/kill-engines")
async def kill_all_engines(current_user=Depends(current_active_user)):
    """Kill all running engines"""
    config = get_deployment_config()
    source_path = config["source"]
    
    command = f"pkill -f 'java.*{source_path}/server'"
    result = await execute_command(command)
    
    return {"message": "All engines killed", "success": True}

# 14. View Error Logs Only
@app.get("/api/logs/errors")
async def view_error_logs_only(current_user=Depends(current_active_user)):
    """Stream only error logs from nohup.out"""
    config = get_deployment_config()
    source_path = config["source"]
    log_file = f"{source_path}/server/nohup.out"
    
    async def generate():
        try:
            process = await asyncio.create_subprocess_shell(
                f"tail -f {log_file} | grep --line-buffered 'error'",
                stdout=asyncio.subprocess.PIPE
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

# Status endpoint
@app.get("/api/deployment/status")
async def get_deployment_status(current_user=Depends(current_active_user)):
    """Get current deployment status"""
    config = get_deployment_config()
    source_path = config["source"]
    
    # Check if server is running
    check_cmd = f"pgrep -f 'java.*{source_path}/server'"
    result = await execute_command(check_cmd)
    is_running = result["success"] and result["stdout"].strip()
    
    # Get current commits
    be_commit_cmd = f"cd {source_path}/source_code/atprofveolia/ && git rev-parse --short HEAD"
    ui_commit_cmd = f"cd {source_path}/source_code/atprofveoliaui/ && git rev-parse --short HEAD"
    
    be_commit_result = await execute_command(be_commit_cmd)
    ui_commit_result = await execute_command(ui_commit_cmd)
    
    # Get current environment
    env_cmd = f"sed -n '5s/.*:[[:space:]]*//p' {source_path}/server/sff.auto.config.cdm | sed 's/ *#.*//'"
    env_result = await execute_command(env_cmd)
    
    return {
        "environment": config["env"],
        "port": config["port"],
        "server_running": bool(is_running),
        "server_pid": result["stdout"].strip() if is_running else None,
        "current_be_commit": be_commit_result["stdout"].strip() if be_commit_result["success"] else "unknown",
        "current_ui_commit": ui_commit_result["stdout"].strip() if ui_commit_result["success"] else "unknown",
        "server_environment": env_result["stdout"].strip() if env_result["success"] else "unknown",
        "last_updated": datetime.now().isoformat()
    }