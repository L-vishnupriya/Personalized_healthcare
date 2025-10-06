#!/usr/bin/env python3
"""
Simple launcher script for the healthcare multi-agent server.
This avoids the relative import issues.
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Now we can import our modules
import agents_config
import database
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json

app = FastAPI(title="Healthcare Multi-Agent API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

# Request/Response models
class AgentRequest(BaseModel):
    message: str
    user_id: Optional[int] = None
    session_id: Optional[str] = None

class AgentResponse(BaseModel):
    response: str
    status: str
    data: Optional[Dict[str, Any]] = None

# Run database setup on server startup
@app.on_event("startup")
def on_startup():
    """Initializes the database and populates synthetic data."""
    print("Initializing Synthetic Healthcare Database...")
    database.create_and_populate_db()
    print("Database initialization complete.")

# Health check endpoint
@app.get("/")
async def serve_frontend():
    """Serve the frontend HTML file"""
    return FileResponse("static/index.html")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "healthcare-multi-agent"}

# Main agent endpoint
@app.post("/ag-ui-agent", response_model=AgentResponse)
async def handle_agent_request(request: AgentRequest):
    """
    Receives requests and processes them through the multi-agent system.
    """
    try:
        # Create a message with user context
        message_with_context = request.message
        
        # If user_id is provided, add it to the message context
        if request.user_id:
            message_with_context = f"[User ID: {request.user_id}] {request.message}"
        
        # Process the request through the main router agent
        response = await agents_config.main_router_agent.arun(message_with_context)
        
        # Extract clean response content from RunResponse object
        if hasattr(response, 'content'):
            clean_content = response.content
        else:
            clean_content = str(response)
        
        return AgentResponse(
            response=clean_content,
            status="success",
            data={"user_id": request.user_id, "session_id": request.session_id}
        )
    except Exception as e:
        print(f"Agent Execution Error: {e}")
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")

# User profile endpoint
@app.get("/users/{user_id}")
async def get_user_profile(user_id: int):
    """Get user profile by ID."""
    profile = database.get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile

# Log data endpoint
@app.post("/logs")
async def log_user_data(user_id: int, log_type: str, value: str):
    """Log user data (CGM, mood, food)."""
    database.log_data(user_id, log_type, value)
    return {"status": "success", "message": f"{log_type} logged for user {user_id}"}

@app.get("/users/{user_id}/logs")
async def get_user_logs(user_id: int):
    """Get all logs for a specific user"""
    import sqlite3
    import os
    
    db_path = os.path.join(os.path.dirname(__file__), "users.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT log_id, user_id, timestamp, log_type, value 
        FROM logs 
        WHERE user_id = ? 
        ORDER BY timestamp DESC
    """, (user_id,))
    
    logs = cursor.fetchall()
    conn.close()
    
    # Convert to list of dictionaries
    log_list = []
    for log in logs:
        log_list.append({
            "log_id": log[0],
            "user_id": log[1],
            "timestamp": log[2],
            "log_type": log[3],
            "value": log[4]
        })
    
    return log_list

if __name__ == "__main__":
    print("Starting Healthcare Multi-Agent Server...")
    
    # Get port from environment (Railway sets this)
    port = int(os.getenv("PORT", 8000))
    
    print(f"Backend API will be available at: http://0.0.0.0:{port}")
    print(f"API Documentation: http://0.0.0.0:{port}/docs")
    print("Make sure to add your GROQ_API_KEY to the environment variables!")
    print()
    
    uvicorn.run(app, host="0.0.0.0", port=port)
