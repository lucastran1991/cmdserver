from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel, UUID4
from app.db import Target, get_target_db
import uuid

# Pydantic models for request validation and response serialization
class TargetBase(BaseModel):
  name: str = "QA"
  description: Optional[str] = None
  server_alias: str = "veodev"
  server_path: str = "/data2/Atomiton/WaterTRN/QA"
  server_port: str = "8686"
  server_role: str = "APP"
  server_status: bool = True

class TargetCreate(TargetBase):
  pass

class TargetUpdate(BaseModel):
  name: Optional[str] = None
  description: Optional[str] = None
  server_alias: Optional[str] = None
  server_path: Optional[str] = None
  server_port: Optional[str] = None
  server_role: Optional[str] = None
  server_status: Optional[bool] = None

class TargetResponse(TargetBase):
  id: UUID4

  class Config:
    orm_mode = True
    from_attributes = True
    
router = APIRouter(
  prefix="/targets",
  tags=["targets"],
  responses={404: {"description": "Target not found"}},
)

# Create a new target
@router.post("/", response_model=TargetResponse)
async def create_target(target: TargetCreate, db: AsyncSession = Depends(get_target_db)):
    db_target = Target(**target.model_dump())
    db.add(db_target)
    await db.commit()
    await db.refresh(db_target)
    return db_target

# Get all targets
@router.get("/", response_model=List[TargetResponse])
async def read_targets(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_target_db)):
    result = await db.execute(db.query(Target).offset(skip).limit(limit))
    targets = result.scalars().all()
    return targets

# Get a specific target by ID
@router.get("/{target_id}", response_model=TargetResponse)
async def read_target(target_id: uuid.UUID, db: AsyncSession = Depends(get_target_db)):
    result = await db.execute(db.query(Target).filter(Target.id == target_id))
    db_target = result.scalar_one_or_none()
    if db_target is None:
        raise HTTPException(status_code=404, detail="Target not found")
    return db_target

# Update a target
@router.put("/{target_id}", response_model=TargetResponse)
async def update_target(target_id: uuid.UUID, target: TargetUpdate, db: AsyncSession = Depends(get_target_db)):
    result = await db.execute(db.query(Target).filter(Target.id == target_id))
    db_target = result.scalar_one_or_none()
    if db_target is None:
        raise HTTPException(status_code=404, detail="Target not found")
    
    for key, value in target.model_dump(exclude_unset=True).items():
        setattr(db_target, key, value)
    
    await db.commit()
    await db.refresh(db_target)
    return db_target

# Delete a target
@router.delete("/{target_id}", response_model=TargetResponse)
async def delete_target(target_id: uuid.UUID, db: AsyncSession = Depends(get_target_db)):
    result = await db.execute(db.query(Target).filter(Target.id == target_id))
    db_target = result.scalar_one_or_none()
    if db_target is None:
        raise HTTPException(status_code=404, detail="Target not found")
    
    await db.delete(db_target)
    await db.commit()
    return db_target