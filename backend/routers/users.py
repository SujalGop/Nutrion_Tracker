from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

from database import get_db
import models
import schemas
import utils

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=schemas.UserResponse)
async def create_user(user_in: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    bmr = utils.calculate_bmr(user_in.weight_kg, user_in.height_cm, user_in.age, user_in.gender)
    tdee = bmr * user_in.activity_multiplier
    macros = utils.calculate_macros(tdee, user_in.goal, user_in.weight_kg)
    
    db_user = models.User(
        **user_in.model_dump(),
        **macros
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.get("/{user_id}", response_model=schemas.UserResponse)
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

from datetime import date

@router.get("/{user_id}/daily-log")
async def get_daily_log(user_id: UUID, date_req: date = date.today(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.DailyLog).where(
        models.DailyLog.user_id == user_id, 
        models.DailyLog.log_date == date_req
    ))
    daily_log = result.scalars().first()
    if not daily_log:
        return {"total_calories": 0, "total_protein": 0, "total_carbs": 0, "total_fat": 0}
    return daily_log
