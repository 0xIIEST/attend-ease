from fastapi import APIRouter
import json
import os

router = APIRouter()

# Load schedule data once
# Assuming data is in ../src/data/schedule.json (relative to backend/)
# We might need to adjust this path after moving files.
SCHEDULE_PATH = os.path.join(os.path.dirname(__file__), "../../../frontend/src/data/schedule.json") 
# NOTE: This path will break when we move src to frontend. We'll fix it then.

@router.get("/")
def get_schedule():
    try:
        with open(SCHEDULE_PATH, "r") as f:
            data = json.load(f)
            return data
    except FileNotFoundError:
        return {"error": "Schedule file not found"}
