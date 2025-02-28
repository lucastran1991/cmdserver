from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from .db import Target, get_db

# Pydantic models for request validation and response serialization
class TargetBase(BaseModel):
  name: str
  description: Optional[str] = None
  url: str
  is_active: bool = True

class TargetCreate(TargetBase):
  pass

class TargetUpdate(BaseModel):
  name: Optional[str] = None
  description: Optional[str] = None
  url: Optional[str] = None
  is_active: Optional[bool] = None

class TargetResponse(TargetBase):
  id: int
  created_at: datetime
  updated_at: datetime

  class Config:
    orm_mode = True

router = APIRouter(
  prefix="/targets",
  tags=["targets"],
  responses={404: {"description": "Target not found"}},
)

# Create a new target
@router.post("/", response_model=TargetResponse)
def create_target(target: TargetCreate, db: Session = Depends(get_db)):
  db_target = Target(**target.dict())
  db.add(db_target)
  db.commit()
  db.refresh(db_target)
  return db_target

# Get all targets
@router.get("/", response_model=List[TargetResponse])
def read_targets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
  targets = db.query(Target).offset(skip).limit(limit).all()
  return targets

# Get a specific target by ID
@router.get("/{target_id}", response_model=TargetResponse)
def read_target(target_id: int, db: Session = Depends(get_db)):
  db_target = db.query(Target).filter(Target.id == target_id).first()
  if db_target is None:
    raise HTTPException(status_code=404, detail="Target not found")
  return db_target

# Update a target
@router.put("/{target_id}", response_model=TargetResponse)
def update_target(target_id: int, target: TargetUpdate, db: Session = Depends(get_db)):
  db_target = db.query(Target).filter(Target.id == target_id).first()
  if db_target is None:
    raise HTTPException(status_code=404, detail="Target not found")
  
  for key, value in target.dict(exclude_unset=True).items():
    setattr(db_target, key, value)
  
  db.commit()
  db.refresh(db_target)
  return db_target

# Delete a target
@router.delete("/{target_id}", response_model=TargetResponse)
def delete_target(target_id: int, db: Session = Depends(get_db)):
  db_target = db.query(Target).filter(Target.id == target_id).first()
  if db_target is None:
    raise HTTPException(status_code=404, detail="Target not found")
  
  db.delete(db_target)
  db.commit()
  return db_target