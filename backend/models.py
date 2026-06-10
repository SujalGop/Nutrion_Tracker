import uuid
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True)
    age = Column(Integer)
    gender = Column(String(10))
    height_cm = Column(Float)
    weight_kg = Column(Float)
    body_fat_pct = Column(Float, nullable=True)
    activity_multiplier = Column(Float)
    goal = Column(String(20)) # 'cutting', 'bulking', 'maintenance'
    target_calories = Column(Integer)
    target_protein_g = Column(Integer)
    target_carbs_g = Column(Integer)
    target_fat_g = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    daily_logs = relationship("DailyLog", back_populates="user")

class DailyLog(Base):
    __tablename__ = "daily_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(50), ForeignKey("users.id"))
    log_date = Column(Date)
    total_calories = Column(Integer, default=0)
    total_protein = Column(Float, default=0)
    total_carbs = Column(Float, default=0)
    total_fat = Column(Float, default=0)

    user = relationship("User", back_populates="daily_logs")
    meals = relationship("Meal", back_populates="daily_log")

class Meal(Base):
    __tablename__ = "meals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    daily_log_id = Column(UUID(as_uuid=True), ForeignKey("daily_logs.id"))
    meal_type = Column(String(20))
    dish_name = Column(String(100))
    image_url = Column(String(255), nullable=True)
    is_user_verified = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    daily_log = relationship("DailyLog", back_populates="meals")
    ingredients = relationship("Ingredient", back_populates="meal")

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meal_id = Column(UUID(as_uuid=True), ForeignKey("meals.id"))
    name = Column(String(100))
    quantity = Column(Float)
    unit = Column(String(20))
    calories = Column(Float)
    protein = Column(Float)
    carbs = Column(Float)
    fat = Column(Float)
    micros = Column(JSON, nullable=True)

    meal = relationship("Meal", back_populates="ingredients")

class DishIngredientCache(Base):
    __tablename__ = "dish_ingredient_cache"

    dish_name = Column(String(100), primary_key=True)
    base_ingredients = Column(JSON)
    confidence_score = Column(Float)
    verified_count = Column(Integer, default=1)
