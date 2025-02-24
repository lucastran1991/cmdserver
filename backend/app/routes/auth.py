from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import secrets

router = APIRouter()

class User(BaseModel):
    id: int
    username: str
    firstname: str
    lastname: str
    dateOfBirth: str
    token: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class LogoutRequest(BaseModel):
    token: str

class CMDString(BaseModel):
    server: str
    command: str

class Token(BaseModel):
    token: str

# In-memory user storage for demonstration purposes
users_db = {
    "user1": {"username": "user1", "firstname": "John", "lastname": "Doe", "id": 1, "dateOfBirth": "1990-01-01", "password": "password123"},
    "user2": {"username": "user2", "firstname": "Jane", "lastname": "Doe", "id": 2, "dateOfBirth": "1992-02-02", "password": "password456"},
}

tokens_db = {}

@router.post("/login", response_model=Token)
async def login(request: LoginRequest):
    user = users_db.get(request.username)
    if user and user["password"] == request.password:
        for token, username in tokens_db.items():
            if username == user["username"]:
                return {"token": token}
        token = secrets.token_hex(16)
        tokens_db[token] = user["username"]
        return {"token": token}
    raise HTTPException(status_code=400, detail="Invalid username or password")

@router.post("/logout")
async def logout(request: LogoutRequest):
    if request.token in tokens_db:
        del tokens_db[request.token]
        return {"message": "Logout successful"}
    raise HTTPException(status_code=400, detail="Invalid token")

@router.get("/users", response_model=List[User])
async def get_users():
    return [User(**user) for user in users_db.values()]

@router.post("/command")
async def cmd(request: CMDString):
    if request.server and request.command:
        return {"message": f"Command '{request.command}' executed on server '{request.server}'"}
    raise HTTPException(status_code=400, detail="Invalid server")

