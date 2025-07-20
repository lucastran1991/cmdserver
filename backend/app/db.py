from collections.abc import AsyncGenerator
import json
import os

from fastapi import Depends
from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, String, Boolean, UUID, ForeignKey
import uuid

current_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.abspath(os.path.join(current_dir, "../../config.json"))

with open(config_path) as config_file:
    config = json.load(config_file)

db_name = config["backend"]["db"]["name"]
db_path = os.path.abspath(os.path.join(current_dir, f"../db/{db_name}.db"))
print("Resolved DB path:", db_path)

DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"
    
class Base(DeclarativeBase):
    pass


class User(SQLAlchemyBaseUserTableUUID, Base):
    avatar = Column(String, nullable=True)  # URL or path to avatar image
    role = Column(String, nullable=False, default="user")  # User role (e.g., "admin", "user", "moderator")


class Target(Base):
    __tablename__ = "target"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, default="QA")
    description = Column(String, nullable=True)
    server_tag = Column(String, nullable=False, default="QA.APP", unique=True)
    server_alias = Column(String, nullable=False, default="veodev")
    server_path = Column(String, nullable=False, default="/data2/Atomiton/WaterTRN/QA")
    server_port = Column(String, nullable=False, default="8686")
    server_role = Column(String, nullable=False, default="APP")
    server_status = Column(Boolean, default=True)


engine = create_async_engine(DATABASE_URL)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


async def get_target_db(session: AsyncSession = Depends(get_async_session)):
    yield session
