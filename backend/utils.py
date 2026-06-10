def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Calculate BMR using the Mifflin-St Jeor Equation."""
    if gender.lower() == 'male':
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    else:
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161

def calculate_macros(tdee: float, goal: str, weight_kg: float) -> dict:
    # Adjust TDEE based on goal
    if goal.lower() == 'cutting':
        target_calories = tdee - 500
    elif goal.lower() == 'bulking':
        target_calories = tdee + 500
    else:
        target_calories = tdee

    # High protein standard: ~2.2g per kg of body weight for active individuals
    protein_g = weight_kg * 2.2
    
    # Fat standard: ~25% of total calories
    fat_calories = target_calories * 0.25
    fat_g = fat_calories / 9
    
    # Carbs: Remaining calories
    protein_calories = protein_g * 4
    carb_calories = target_calories - protein_calories - fat_calories
    carbs_g = carb_calories / 4

    return {
        "target_calories": int(target_calories),
        "target_protein_g": int(protein_g),
        "target_carbs_g": int(carbs_g),
        "target_fat_g": int(fat_g)
    }
