import uuid
from typing import Optional

from fastapi_users import schemas


class UserRead(schemas.BaseUser[uuid.UUID]):
    avatar: Optional[str] = None
    role: str = "user"


class UserCreate(schemas.BaseUserCreate):
    avatar: Optional[str] = None
    role: str = "user"


class UserUpdate(schemas.BaseUserUpdate):
    avatar: Optional[str] = None
    role: Optional[str] = None
