from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import subprocess
import paramiko
import os

router = APIRouter()

class CMDString(BaseModel):
    server: str
    mode: str
    commands: List[str]  # Change to a list of commands

class SSHClient:
    def __init__(self, hostname):
        self.hostname = hostname
        self.client = paramiko.SSHClient()
        
        try:
            self.client.load_system_host_keys()
            known_hosts = os.path.expanduser('~/.ssh/known_hosts')
            if os.path.exists(known_hosts):
                self.client.load_host_keys(known_hosts)
        except Exception as e:
            print(f"Warning: Could not load host keys: {str(e)}")
        
        self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    def connect(self):
        try:
            ssh_config = paramiko.SSHConfig()
            user_config_file = os.path.expanduser("~/.ssh/config")
            if os.path.exists(user_config_file):
                with open(user_config_file) as f:
                    ssh_config.parse(f)
                
                host_config = ssh_config.lookup(self.hostname)
                print(f"Found SSH config for {self.hostname}: {host_config}")
                
                hostname = host_config.get('hostname', self.hostname)
                username = host_config.get('user')
                key_filename = host_config.get('identityfile')
                if isinstance(key_filename, list):
                    key_filename = key_filename[0]
                
                self.client.connect(
                    hostname=hostname,
                    username=username,
                    key_filename=key_filename,
                    look_for_keys=True
                )
            else:
                print("No SSH config file found, trying direct connection")
                self.client.connect(self.hostname)
                
            return True
            
        except Exception as e:
            print(f"SSH connection error for {self.hostname}: {str(e)}")
            print(f"Make sure your SSH config (~/.ssh/config) contains proper configuration for '{self.hostname}'")
            return False
        
    def execute(self, command):
        stdin, stdout, stderr = self.client.exec_command(command)
        return {
            'output': stdout.read().decode('utf-8'),
            'error': stderr.read().decode('utf-8'),
            'exit_code': stdout.channel.recv_exit_status()
        }

    def close(self):
        self.client.close()

@router.post("/command")
async def cmd(request: CMDString):
    response = await execute_command(request.server, request.mode, request.commands)
    if response['status'] == 'error':
        raise HTTPException(status_code=500, detail=response['message'])
    return response

async def execute_command(server: str, mode: str, commands: List[str]):
    print(f"Commands '{commands}' executed on server '{server}'")
    if server and commands:
        print(f"Executing commands: {commands}")
        request_mode = mode if mode else "local"
        print(f"Request mode: {request_mode}")

        try:
            if request_mode == "remote":
                ssh = SSHClient(server)
                if not ssh.connect():
                    return {
                        "status": "error",
                        "message": "Failed to establish SSH connection",
                        "commands": commands,
                        "server": server
                    }

                results = []
                for command in commands:
                    result = ssh.execute(command)
                    results.append(result)
                    if result['exit_code'] != 0:
                        print(f"Command exited with status code {result['exit_code']}")
                        print(f"Error: {result['error']}")
                        ssh.close()
                        return {
                            "status": "error",
                            "exit_code": result['exit_code'],
                            "message": result['error'],
                            "command": command,
                            "server": server
                        }

                ssh.close()
                return {
                    "status": "success",
                    "results": results,
                    "commands": commands,
                    "server": server
                }
            else:
                results = []
                for command in commands:
                    result = subprocess.run(
                        command,
                        shell=True,
                        check=False,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                    )
                    results.append({
                        "output": result.stdout,
                        "error": result.stderr,
                        "exit_code": result.returncode
                    })
                    if result.returncode != 0:
                        print(f"Command exited with status code {result.returncode}")
                        print(f"Error: {result.stderr}")
                        return {
                            "status": "error",
                            "exit_code": result.returncode,
                            "message": result.stderr,
                            "command": command,
                            "server": server
                        }

                return {
                    "status": "success",
                    "results": results,
                    "commands": commands,
                    "server": server
                }

        except Exception as e:
            print(f"Exception: {str(e)}")
            return {
                "status": "error",
                "message": f"Command execution failed: {str(e)}",
                "commands": commands,
                "server": server
            }

    return {
        "status": "error",
        "message": "Invalid server or commands",
        "commands": commands,
        "server": server
    }