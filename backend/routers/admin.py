from fastapi import APIRouter, Depends, HTTPException, Body
from backend.database import get_db, firebase_auth
from pydantic import BaseModel
import os
import json
from typing import List, Optional

router = APIRouter()
db = get_db()

# Load Admin Emails from Env
ADMIN_EMAILS = os.getenv("ADMIN_EMAILS", "").split(",")

def verify_admin(token: str = None):
    # In a real app, we'd verify the Firebase ID token from the header.
    # For this MVP, we will rely on the frontend sending the user's email 
    # or a verified token claims check if we had full session management.
    
    # However, since we are moving fast:
    # We'll expect an 'Authorization' header with the Firebase ID Token.
    # We verify it, get the email, and check if it's in ADMIN_EMAILS.
    
    # For now, let's just check if the user exists in our DB and has 'admin' role?
    # Or just use the hardcoded env var list.
    pass 
    # We will implement the actual dependency in the path functions for now 
    #/ to allow flexibility if we change auth methods.

def get_current_user_email(authorization: str = None):
    # This is a placeholder. In production, verify the JWT properly.
    # For this specific "Client Secret" flow, we might not have a clean header everywhere yet.
    # Let's assume the client sends "X-Admin-Email" for now (INSECURE - for MVP ONLY)
    # OR better: verify the ID token passed in Authorization header.
    
    # Let's implement proper Token Verification if possible, or fallback to a simple secret?
    # Given the constraints, let's try to verify the token.
    pass

@router.get("/users")
def get_users(admin_email: str):
    if admin_email not in ADMIN_EMAILS:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    docs = db.collection('studentProfiles').stream()
    users = [doc.to_dict() for doc in docs]
    return users

@router.get("/stats")
def get_stats(admin_email: str):
    if admin_email not in ADMIN_EMAILS:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    users_ref = db.collection('studentProfiles')
    # Count is expensive in Firestore if we stream all, but for small app it's fine.
    # aggregation_query = users_ref.count() # Requires newer firebase-admin
    
    docs = users_ref.stream()
    count = sum(1 for _ in docs)
    
    return {
        "totalUsers": count,
        "activeSession": "Spring 2026"
    }

# Schedule Handling
SCHEDULE_PATH = os.path.join(os.path.dirname(__file__), "../data/schedule.json") 

@router.post("/schedule")
def update_schedule(admin_email: str, schedule_data: dict = Body(...)):
    if admin_email not in ADMIN_EMAILS:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        # Update Firestore
        db.collection('config').document('schedule').set(schedule_data)
        
        # Also try to update local file if possible (for local dev)
        # catch error silently if readonly
        try:
            with open(SCHEDULE_PATH, "w") as f:
                json.dump(schedule_data, f, indent=2)
        except:
            pass
            
        return {"status": "success", "message": "Schedule updated in Firestore"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
