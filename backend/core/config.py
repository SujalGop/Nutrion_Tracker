import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Indian Nutrition Tracker API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/nutrition_db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FATSECRET_CLIENT_ID: str = os.getenv("FATSECRET_CLIENT_ID", "")
    FATSECRET_CLIENT_SECRET: str = os.getenv("FATSECRET_CLIENT_SECRET", "")

settings = Settings()
