from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel, UUID4
from app.db import Target, get_target_db
import uuid

# Pydantic models for request validation and response serialization
class TargetBase(BaseModel):
  name: str = "QA"
  description: Optional[str] = None
  server_tag: str = "QA.APP"
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
  server_tag: str
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
    try:
      db_target = Target(**target.model_dump())
      db.add(db_target)
      await db.commit()
      await db.refresh(db_target)
      return db_target
    except Exception as e:
      await db.rollback()
      raise HTTPException(status_code=500, detail=f"Failed to create target: {str(e)}")

@router.get("/", response_model=List[TargetResponse])
async def read_targets(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_target_db)):
    stmt = select(Target).offset(skip).limit(limit)
    result = await db.execute(stmt)
    targets = result.scalars().all()
    return targets

# Get a specific target by ID
@router.get("/{target_id}", response_model=TargetResponse)
async def read_target(target_id: uuid.UUID, db: AsyncSession = Depends(get_target_db)):
    stmt = select(Target).where(Target.id == target_id)
    result = await db.execute(stmt)
    db_target = result.scalar_one_or_none()
    if db_target is None:
        raise HTTPException(status_code=404, detail="Target not found")
    return db_target

# Update a target
@router.put("/{target_id}", response_model=TargetResponse)
async def update_target(target_id: uuid.UUID, target: TargetUpdate, db: AsyncSession = Depends(get_target_db)):
    stmt = select(Target).where(Target.id == target_id)
    result = await db.execute(stmt)
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
    stmt = select(Target).where(Target.id == target_id)
    result = await db.execute(stmt)
    db_target = result.scalar_one_or_none()
    if db_target is None:
        raise HTTPException(status_code=404, detail="Target not found")
    
    await db.delete(db_target)
    await db.commit()
    return db_target

# Delete all targets
@router.delete("/", response_model=dict)
async def delete_all_targets(db: AsyncSession = Depends(get_target_db)):
    """Delete all targets from the database."""
    stmt = select(Target)
    result = await db.execute(stmt)
    targets = result.scalars().all()
    
    count = 0
    for target in targets:
        await db.delete(target)
        count += 1
    
    await db.commit()
    return {"deleted": count, "message": f"Successfully deleted {count} targets"}