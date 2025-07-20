import uuid
from typing import Optional

from fastapi_users import schemas


class UserRead(schemas.BaseUser[uuid.UUID]):
    full_name: str = "user"
    avatar: Optional[str] = None
    role: str = "user"


class UserCreate(schemas.BaseUserCreate):
    full_name: str = "user"
    avatar: Optional[str] = None
    role: str = "user"


class UserUpdate(schemas.BaseUserUpdate):
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = None
