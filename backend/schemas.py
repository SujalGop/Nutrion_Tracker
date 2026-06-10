from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserCreate(BaseModel):
    age: int
    gender: str # 'male' or 'female'
    height_cm: float
    weight_kg: float
    body_fat_pct: Optional[float] = None
    activity_multiplier: float # e.g. 1.2 for sedentary, 1.55 for moderate
    goal: str # 'cutting', 'bulking', 'maintenance'

class UserResponse(UserCreate):
    id: UUID
    target_calories: int
    target_protein_g: int
    target_carbs_g: int
    target_fat_g: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
