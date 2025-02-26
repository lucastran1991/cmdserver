from fastapi import FastAPI, Depends
from fastapi_users import FastAPIUsers, schemas
from fastapi_users.authentication import JWTStrategy, AuthenticationBackend, BearerTransport
from fastapi_users.manager import BaseUserManager
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, Boolean
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable, SQLAlchemyUserDatabase
from typing import Optional
import uuid
from fastapi_users.db import SQLAlchemyUserDatabase
from pydantic import EmailStr

DATABASE_URL = "sqlite+aiosqlite:///./test.db"
engine = create_async_engine(DATABASE_URL)
Base = declarative_base()
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Define User model with explicit primary key
class User(SQLAlchemyBaseUserTable[uuid.UUID], Base):
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(320), unique=True, index=True, nullable=False)
    hashed_password = Column(String(1024), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

# Define schema classes for fastapi-users
class UserRead(schemas.BaseUser[uuid.UUID]):
    id: uuid.UUID
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False
    is_verified: bool = False

class UserCreate(schemas.BaseUserCreate):
    email: EmailStr
    password: str
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False
    is_verified: Optional[bool] = False

class UserUpdate(schemas.BaseUserUpdate):
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_verified: Optional[bool] = None

async def get_user_db(session: AsyncSession = Depends(SessionLocal)):
    yield SQLAlchemyUserDatabase(session, User)

# Define a secret key
SECRET = "YOUR_SECRET_KEY"  # In production, use a proper secret key management

# Implement BaseUserManager
class UserManager(BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def on_after_register(self, user, request=None):
        print(f"User {user.id} has registered.")

    async def on_after_forgot_password(self, user, token, request=None):
        print(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(self, user, token, request=None):
        print(f"Verification requested for user {user.id}. Verification token: {token}")

async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)

# Define auth backend
bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")
auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=lambda: JWTStrategy(secret=SECRET, lifetime_seconds=3600),
)

# Create FastAPIUsers instance
fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

# Create router for exporting
router = fastapi_users.get_auth_router(auth_backend)
users_router = fastapi_users.get_users_router(UserRead, UserCreate, UserUpdate)

# Create a FastAPI app
app = FastAPI()
app.include_router(router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Command Server API"}

# Table creation
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)