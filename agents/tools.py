from agno.tools import tool
from database import get_user_profile, log_data
from typing import Optional

# --- Tool 1: User Validation ---
@tool
def validate_user_id(user_id: int) -> str:
    """
    Validates the user ID against the database. 
    Returns a string with the user profile if valid, or an error message if invalid.
    """
    profile = get_user_profile(user_id)
    if profile:
        return f"User {user_id} validated successfully. Name: {profile['first_name']} {profile['last_name']}, City: {profile['city']}, Diet: {profile['dietary_preference']}, Conditions: {profile['medical_conditions']}"
    return f"User ID {user_id} not found. Please check your user ID and try again."


# --- Tool 2: CGM Logging ---
@tool
def log_cgm_reading(user_id: int, glucose_reading: int) -> str:
    """
    Logs a continuous glucose monitor reading (mg/dL) and checks for alerts (80-300).
    """
    if not 80 <= glucose_reading <= 300:
        alert = f"ALERT: Glucose reading of {glucose_reading} mg/dL is outside the safe range (80-300)."
    else:
        alert = f"Glucose reading {glucose_reading} mg/dL is stable."
        
    log_data(user_id, "cgm", str(glucose_reading))
    
    return alert


# --- Tool 3: Food Intake & Macro Estimation ---
@tool
def record_food_and_estimate_macros(user_id: int, meal_description: str, timestamp: Optional[str] = None) -> str:
    """
    Records a meal description and uses an LLM call to categorize estimated nutrients (Carbs, Protein, Fat).
    """
    if not timestamp:
        import datetime
        timestamp = datetime.datetime.now().isoformat()
        
   
    log_data(user_id, "food", f"{timestamp}: {meal_description}")
    
    return f"Meal '{meal_description}' logged successfully at {timestamp}. Ready for macro estimation."


# --- Tool 4: Mood Logging ---
@tool
def log_user_mood(user_id: int, mood_label: str) -> str:
    """Logs the user's mood (happy, sad, excited, tired, etc.)."""
    log_data(user_id, "mood", mood_label)
    return f"Mood '{mood_label}' logged for user {user_id}."


# --- Tool 5: Meal Planner (LLM Tool) ---
@tool
def generate_adaptive_meal_plan(user_id: int, dietary_preference: str, medical_conditions: str, latest_cgm: int = None, latest_mood: str = None) -> str:
    """
    Generates an adaptive 3-meal plan for the day respecting diet, medical conditions, and 
    recent CGM/mood data. If glucose readings are off, provides meals to get it under control.
    """
    # Get user profile for context
    profile = get_user_profile(user_id)
    if not profile:
        return f"User {user_id} not found. Please validate your user ID first."
    
    # Determine meal plan strategy based on CGM reading
    if latest_cgm:
        if latest_cgm < 80:
            strategy = "LOW_GLUCOSE - Focus on balanced meals with complex carbs to raise blood sugar gradually"
        elif latest_cgm > 200:
            strategy = "HIGH_GLUCOSE - Focus on low-carb, high-protein meals to lower blood sugar"
        elif latest_cgm > 150:
            strategy = "ELEVATED_GLUCOSE - Focus on moderate-carb meals with fiber to stabilize blood sugar"
        else:
            strategy = "NORMAL_GLUCOSE - Maintain balanced nutrition with regular meal timing"
    else:
        strategy = "BALANCED - Provide general healthy meal plan"
    
    # Mood-based adjustments
    mood_adjustment = ""
    if latest_mood:
        if "tired" in latest_mood.lower() or "fatigue" in latest_mood.lower():
            mood_adjustment = " Include energizing foods rich in iron and B vitamins."
        elif "stressed" in latest_mood.lower() or "anxious" in latest_mood.lower():
            mood_adjustment = " Include calming foods like magnesium-rich options and omega-3s."
        elif "happy" in latest_mood.lower() or "energetic" in latest_mood.lower():
            mood_adjustment = " Maintain the positive energy with balanced, nutritious meals."
    
    # Generate a detailed meal plan based on the user's profile and current health status
    meal_plan = f"🍽️ PERSONALIZED MEAL PLAN for {profile['first_name']}\n\n"
    meal_plan += f"📊 Health Status: {strategy}\n"
    meal_plan += f"🥗 Diet: {dietary_preference}\n"
    meal_plan += f"🩺 Conditions: {medical_conditions}\n"
    meal_plan += f"📈 Latest Glucose: {latest_cgm if latest_cgm else 'Not available'} mg/dL\n"
    meal_plan += f"😊 Current Mood: {latest_mood if latest_mood else 'Not available'}\n\n"
    
    # Generate specific meals based on dietary preference and health status
    if dietary_preference.lower() == 'vegetarian':
        meal_plan += "🌅 BREAKFAST (7-8 AM):\n"
        meal_plan += "• Oats with almond milk + berries + nuts\n"
        meal_plan += "• Carbs: 35g | Protein: 12g | Fat: 8g\n\n"
        
        meal_plan += "🌞 LUNCH (12-1 PM):\n"
        meal_plan += "• Brown rice + dal + mixed vegetables + yogurt\n"
        meal_plan += "• Carbs: 45g | Protein: 18g | Fat: 6g\n\n"
        
        meal_plan += "🌙 DINNER (7-8 PM):\n"
        meal_plan += "• Ragi dosa + sambar + coconut chutney\n"
        meal_plan += "• Carbs: 30g | Protein: 15g | Fat: 10g\n\n"
        
    elif dietary_preference.lower() == 'vegan':
        meal_plan += "🌅 BREAKFAST (7-8 AM):\n"
        meal_plan += "• Quinoa porridge with coconut milk + fruits\n"
        meal_plan += "• Carbs: 40g | Protein: 10g | Fat: 12g\n\n"
        
        meal_plan += "🌞 LUNCH (12-1 PM):\n"
        meal_plan += "• Buddha bowl with chickpeas + quinoa + vegetables\n"
        meal_plan += "• Carbs: 50g | Protein: 20g | Fat: 8g\n\n"
        
        meal_plan += "🌙 DINNER (7-8 PM):\n"
        meal_plan += "• Lentil curry + brown rice + steamed vegetables\n"
        meal_plan += "• Carbs: 35g | Protein: 18g | Fat: 6g\n\n"
        
    else:  # non-vegetarian
        meal_plan += "🌅 BREAKFAST (7-8 AM):\n"
        meal_plan += "• Scrambled eggs + whole grain toast + avocado\n"
        meal_plan += "• Carbs: 25g | Protein: 20g | Fat: 15g\n\n"
        
        meal_plan += "🌞 LUNCH (12-1 PM):\n"
        meal_plan += "• Grilled chicken + quinoa + roasted vegetables\n"
        meal_plan += "• Carbs: 30g | Protein: 35g | Fat: 12g\n\n"
        
        meal_plan += "🌙 DINNER (7-8 PM):\n"
        meal_plan += "• Baked fish + sweet potato + green salad\n"
        meal_plan += "• Carbs: 25g | Protein: 30g | Fat: 10g\n\n"
    
    # Add mood-based adjustments
    if mood_adjustment:
        meal_plan += f"💡 Mood-Based Adjustments:{mood_adjustment}\n\n"
    
    # Add glucose management tips
    if latest_cgm and latest_cgm > 150:
        meal_plan += "Glucose Management Tips:\n"
        meal_plan += "• Focus on low-carb, high-fiber foods\n"
        meal_plan += "• Include protein with every meal\n"
        meal_plan += "• Stay hydrated with water\n\n"
    elif latest_cgm and latest_cgm < 80:
        meal_plan += "Glucose Management Tips:\n"
        meal_plan += "• Include complex carbohydrates\n"
        meal_plan += "• Eat regular meals and snacks\n"
        meal_plan += "• Monitor glucose levels closely\n\n"
    
    meal_plan += " SNACK SUGGESTIONS:\n"
    meal_plan += "• Nuts and seeds (10-15 pieces)\n"
    meal_plan += "• Greek yogurt with berries\n"
    meal_plan += "• Vegetable sticks with hummus\n\n"
    
    meal_plan += "⏰ TIMING RECOMMENDATIONS:\n"
    meal_plan += "• Eat every 3-4 hours\n"
    meal_plan += "• Don't skip meals\n"
    meal_plan += "• Finish dinner 2-3 hours before bedtime"
    
    return meal_plan
