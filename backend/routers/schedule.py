from fastapi import APIRouter, HTTPException
import json
import os

from backend.database import get_db

router = APIRouter()
db = get_db()

# Load schedule data once
# Assuming data is in ../data/schedule.json (relative to backend/)
SCHEDULE_PATH = os.path.join(os.path.dirname(__file__), "../data/schedule.json")

@router.get("/")
def get_schedule():
    try:
        # Fetch from Firestore instead of local file
        doc = db.collection('config').document('schedule').get()
        
        if not doc.exists:
             # Fallback to local file for initial setup or if migration hasn't happened? 
             # Or just return 404? 
             # Let's try fallback to local file if Firestore is empty to be nice
             if os.path.exists(SCHEDULE_PATH):
                 with open(SCHEDULE_PATH, "r") as f:
                     return json.load(f)
             raise HTTPException(status_code=404, detail="Schedule configuration not found")
             
        return doc.to_dict()
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))
