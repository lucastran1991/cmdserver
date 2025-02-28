from collections.abc import AsyncGenerator
import json
import os

from fastapi import Depends
from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, String, Boolean, UUID, ForeignKey
import uuid

config_path = os.path.join(os.path.dirname(__file__), "../../config.json")
with open(config_path) as config_file:
    config = json.load(config_file)
    
DATABASE_URL = f"sqlite+aiosqlite:///./backend/db/{config['db']['name']}.db"


class Base(DeclarativeBase):
    pass


class User(SQLAlchemyBaseUserTableUUID, Base):
    pass

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