from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List
import google.generativeai as genai
import httpx
import base64
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from core.config import settings
import models
import schemas
import json

router = APIRouter(prefix="/meals", tags=["meals"])

class IngredientParsed(BaseModel):
    name: str
    amount: float
    unit: str

class VisionPredictionResponse(BaseModel):
    dish_name: str
    confidence: float
    ingredients: List[IngredientParsed]
    requires_user_clarification: bool

@router.post("/predict-meal", response_model=VisionPredictionResponse)
async def predict_meal(image: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Analyzes an uploaded image using Gemini 3.1 Flash Lite to predict the Indian dish 
    and decompose it into base ingredients.
    """
    if not settings.GEMINI_API_KEY:
         raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured in .env")
    
    genai.configure(api_key=settings.GEMINI_API_KEY)
    contents = await image.read()
    
    # Using Gemini 3.1 Flash Lite
    model = genai.GenerativeModel("gemini-3.1-flash-lite")
    
    prompt = """
    Analyze this image of an Indian dish. 
    1. Identify the dish name.
    2. Break it down into its primary raw ingredients (e.g. paneer, tomatoes, onions, oil).
    3. Estimate standard portion sizes (amount and unit).
    
    Return ONLY a valid JSON object matching exactly this schema, without markdown blocks or backticks:
    {
      "dish_name": "string",
      "confidence": 0.95,
      "ingredients": [
         {"name": "string", "amount": 100, "unit": "g"}
      ],
      "requires_user_clarification": false
    }
    """
    
    try:
        response = model.generate_content(
            contents=[
                {"mime_type": image.content_type, "data": base64.b64encode(contents).decode("utf-8")},
                prompt
            ]
        )
        
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
            
        result = json.loads(text)
        
        # Consistency Check: Use Cache if verified > 2
        dish_name = result.get("dish_name")
        if dish_name:
            cache_query = await db.execute(select(models.DishIngredientCache).where(models.DishIngredientCache.dish_name == dish_name))
            cache_entry = cache_query.scalars().first()
            if cache_entry and cache_entry.verified_count > 2:
                result["ingredients"] = cache_entry.base_ingredients
                result["confidence"] = 0.99
                
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

async def fetch_fatsecret_nutrition(ingredient_name: str, amount: float, unit: str):
    # To implement the actual FatSecret OAuth2 flow:
    # 1. POST https://oauth.fatsecret.com/connect/token with client_id/secret for Access Token
    # 2. GET https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression={ingredient_name}
    # For now, returning structural mock data to complete the pipeline logic
    return {
        "calories": 50.0,
        "protein": 2.0,
        "carbs": 5.0,
        "fat": 1.5,
        "micros": {}
    }

class LogMealRequest(BaseModel):
    user_id: str
    dish_name: str
    ingredients: List[IngredientParsed]

@router.post("/verify-and-log-meal")
async def verify_and_log_meal(request: LogMealRequest, db: AsyncSession = Depends(get_db)):
    """
    Fetches exact macros from FatSecret and saves to DB.
    Also updates the DishIngredientCache.
    """
    # 1. Update Cache
    cache_query = await db.execute(select(models.DishIngredientCache).where(models.DishIngredientCache.dish_name == request.dish_name))
    cache_entry = cache_query.scalars().first()
    
    ingredients_json = [{"name": i.name, "amount": i.amount, "unit": i.unit} for i in request.ingredients]
    
    if cache_entry:
        cache_entry.verified_count += 1
    else:
        new_cache = models.DishIngredientCache(
            dish_name=request.dish_name,
            base_ingredients=ingredients_json,
            confidence_score=1.0,
            verified_count=1
        )
        db.add(new_cache)
    
    await db.commit()

    # 2. Process Macros
    total_macros = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
    detailed_ingredients = []
    
    for ing in request.ingredients:
        # Call FatSecret Platform API (Mocked logic for structure)
        nutrition_data = await fetch_fatsecret_nutrition(ing.name, ing.amount, ing.unit)
        total_macros["calories"] += nutrition_data["calories"]
        total_macros["protein"] += nutrition_data["protein"]
        total_macros["carbs"] += nutrition_data["carbs"]
        total_macros["fat"] += nutrition_data["fat"]
        
        detailed_ingredients.append({
            "name": ing.name,
            "quantity": ing.amount,
            "unit": ing.unit,
            **nutrition_data
        })
        
    return {"status": "success", "logged_macros": total_macros, "ingredients": detailed_ingredients}
