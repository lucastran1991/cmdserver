from fastapi import APIRouter
from app.models import User

router = APIRouter()

# In-memory user storage for demonstration purposes
users_db = []

@router.get("/users", response_model=list[User])
async def get_users():
    return users_db

@router.post("/users", response_model=User)
async def create_user(user: User):
    users_db.append(user)
    return user