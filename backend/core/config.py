import os
from dotenv import load_dotenv

load_dotenv()

def get_database_url() -> str:
    url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/nutrition_db")
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

class Settings:
    PROJECT_NAME: str = "Indian Nutrition Tracker API"
    DATABASE_URL: str = get_database_url()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FATSECRET_CLIENT_ID: str = os.getenv("FATSECRET_CLIENT_ID", "")
    FATSECRET_CLIENT_SECRET: str = os.getenv("FATSECRET_CLIENT_SECRET", "")

settings = Settings()
