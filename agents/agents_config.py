from agno.agent import Agent
from agno.models.groq import Groq
from tools import (
    validate_user_id, log_cgm_reading, record_food_and_estimate_macros, 
    log_user_mood, generate_adaptive_meal_plan
)
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- LLM Setup: Use GROQ for speed ---
# GROQ_API_KEY must be set in the environment
LLM = Groq(
    id="llama-3.1-8b-instant",  # Using a smaller, faster model to avoid rate limits
    api_key=os.getenv("GROQ_API_KEY"),  # Load from environment
    temperature=0.3
)

# --- Agent Definitions ---

# 1. Greeting Agent - Validates user ID and greets personally
greeting_agent = Agent(
    name="GreetingAgent",
    model=LLM,
    instructions=(
        "You are the Greeting Agent. Your role is to:\n"
        "1. Validate user ID against the dataset using validate_user_id tool\n"
        "2. If invalid, prompt user to re-enter a valid ID (1-100)\n"
        "3. If valid, retrieve name/city and greet personally\n"
        "4. Always call validate_user_id tool first before greeting"
    ),
    tools=[validate_user_id]
)

# 2. Mood Tracker Agent - Captures and stores user mood
mood_tracker_agent = Agent(
    name="MoodTrackerAgent",
    model=LLM,
    instructions=(
        "You are the Mood Tracker Agent. Your role is to:\n"
        "1. Capture user mood labels (happy, sad, excited, tired, etc.)\n"
        "2. Store mood in memory using log_user_mood tool\n"
        "3. Compute rolling average of mood scores\n"
        "4. Provide mood insights and trends\n"
        "5. MUST use log_user_mood tool for all mood logging"
    ),
    tools=[log_user_mood]
)

# 3. CGM Agent - Logs glucose readings with alerts
cgm_agent = Agent(
    name="CGMAgent",
    model=LLM,
    instructions=(
        "You are the CGM Agent. Your role is to:\n"
        "1. Log Continuous Glucose Monitor readings using log_cgm_reading tool\n"
        "2. Validate range: 80-300 mg/dL\n"
        "3. Flag alerts if outside safe range\n"
        "4. Provide glucose trend analysis\n"
        "5. MUST use log_cgm_reading tool and strictly enforce the 80-300 mg/dL range"
    ),
    tools=[log_cgm_reading]
)

# 4. Food Intake Agent - Records meals with nutrient estimation
food_intake_agent = Agent(
    name="FoodIntakeAgent",
    model=LLM,
    instructions=(
        "You are the Food Intake Agent. Your role is to:\n"
        "1. Record meals/snacks with timestamps using record_food_and_estimate_macros tool\n"
        "2. Categorize nutrients (carbs/protein/fat) via LLM analysis\n"
        "3. Provide macro estimates for logged meals\n"
        "4. Track eating patterns and timing\n"
        "5. MUST call record_food_and_estimate_macros tool for all food logging"
    ),
    tools=[record_food_and_estimate_macros]
)

# 5. Meal Planner Agent - Generates adaptive meal plans
meal_planner_agent = Agent(
    name="MealPlannerAgent",
    model=LLM,
    instructions=(
        "You are the Meal Planner Agent. Your role is to:\n"
        "1. Generate adaptive 3-meal plans per day using generate_adaptive_meal_plan tool\n"
        "2. Consider dietary preferences and medical constraints\n"
        "3. Adapt based on latest mood/CGM data\n"
        "4. If glucose readings are off, provide meals to get it under control\n"
        "5. Include macro content (Carbs, Protein, Fat) for each meal\n"
        "6. MUST use generate_adaptive_meal_plan tool for all meal planning"
    ),
    tools=[generate_adaptive_meal_plan]
)

# 6. Interrupt Agent - General Q&A Assistant (Always listening)
interrupt_agent = Agent(
    name="InterruptAgent",
    model=LLM,
    instructions=(
        "You are the Interrupt Agent - a General Q&A Assistant. Your role is to:\n"
        "1. Always listen for general queries from users\n"
        "2. Handle unrelated questions (trivia, news, general knowledge)\n"
        "3. Provide answers using LLM-based general knowledge\n"
        "4. Gracefully route users back to main interaction flow without losing context\n"
        "5. If query is about health, mood, food, or CGM, respond with 'ROUTETO_HEALTH_FLOW'\n"
        "6. Maintain conversation context and help users return to their previous task"
    )
)

# --- Multi-Agent Orchestration ---
# Main Router Agent that coordinates all 6 specialized agents
main_router_agent = Agent(
    name="HealthcareCoordinator",
    model=LLM,
    tools=[
        validate_user_id,
        log_cgm_reading, 
        record_food_and_estimate_macros,
        log_user_mood,
        generate_adaptive_meal_plan
    ],
    instructions=(
        "You are the Healthcare Coordinator - the central orchestrator for a multi-agent healthcare system. "
        "You coordinate 6 specialized agents:\n\n"
        "1. GREETING AGENT: Validates user IDs and greets personally\n"
        "2. MOOD TRACKER AGENT: Captures and logs user mood with rolling averages\n"
        "3. CGM AGENT: Logs glucose readings (80-300 mg/dL) with alerts\n"
        "4. FOOD INTAKE AGENT: Records meals with nutrient estimation\n"
        "5. MEAL PLANNER AGENT: Generates adaptive 3-meal plans based on health data\n"
        "6. INTERRUPT AGENT: Handles general Q&A and routes back to health flow\n\n"
        "CRITICAL USER CONTEXT RULES:\n"
        "1. ALWAYS use the user_id from the request context when calling tools\n"
        "2. If user mentions their ID (like 'I am id 35' or 'my id is 35'), remember it for the conversation\n"
        "3. Once you know the user's ID, use it for ALL subsequent tool calls in that conversation\n"
        "4. Do NOT ask for user ID again if you already have it from the request context or previous messages\n\n"
        "ROUTING LOGIC:\n"
        "- User ID validation → Greeting Agent (use validate_user_id tool)\n"
        "- Mood mentions (tired, happy, sad, etc.) → Mood Tracker Agent (use log_user_mood tool with correct user_id)\n"
        "- Glucose readings → CGM Agent (use log_cgm_reading tool with correct user_id)\n"
        "- Food/meals → Food Intake Agent (use record_food_and_estimate_macros tool with correct user_id)\n"
        "- Meal planning → Meal Planner Agent (use generate_adaptive_meal_plan tool with correct user_id)\n"
        "- General questions → Interrupt Agent\n\n"
        "CONVERSATION FLOW:\n"
        "- Be conversational and remember context from previous messages\n"
        "- If user says 'I am tired' after providing their ID, use that ID to log the mood\n"
        "- If user says 'my glucose is 140' after providing their ID, use that ID to log the CGM reading\n"
        "- Always use the user_id parameter in tool calls - never use 'unknown' or ask for ID again\n\n"
        "Provide friendly, conversational responses like a healthcare assistant who remembers the conversation context."
    )
)
