from fastapi import APIRouter, HTTPException, Body
from database import get_db
from pydantic import BaseModel
from typing import Optional, List

from firebase_admin import firestore

router = APIRouter()
db = get_db()

class StudentProfile(BaseModel):
    collegeId: str
    name: str
    year: str
    branch: str
    rollNumber: str
    group: str
    currentSemester: int = 2

@router.post("/profile/{uid}")
def create_profile(uid: str, profile: StudentProfile):
    """Creates a new student profile in Firestore."""
    try:
        # We might want to verify headers here to ensure the requester is `uid`
        doc_ref = db.collection('studentProfiles').document(uid)
        doc_ref.set({
            **profile.dict(),
            "id": uid,
            "authEmail": "", # Should be populated from auth context
            "createdAt": firestore.SERVER_TIMESTAMP
        }, merge=True)
        return {"status": "success", "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{uid}")
def get_profile(uid: str):
    doc_ref = db.collection('studentProfiles').document(uid)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    else:
        raise HTTPException(status_code=404, detail="Profile not found")

@router.get("/{uid}/attendance")
def get_attendance(uid: str):
    """Fetches all attendance records for a student."""
    docs = db.collection('studentProfiles').document(uid).collection('attendanceRecords').stream()
    records = [doc.to_dict() for doc in docs]
    return records

class AttendanceUpdate(BaseModel):
    subjectCode: str
    status: Optional[str] # 'present', 'absent', 'cancelled', or None
    classDate: str # YYYY-MM-DD
    timestamp: Optional[str] = None # ISO format

@router.post("/{uid}/attendance")
def mark_attendance(uid: str, update: AttendanceUpdate):
    """Marks attendance for a specific class."""
    try:
        record_id = f"{update.subjectCode}_{update.classDate}"
        doc_ref = db.collection('studentProfiles').document(uid).collection('attendanceRecords').document(record_id)
        
        data = {
            "studentId": uid,
            "subjectCode": update.subjectCode,
            "status": update.status,
            "classDate": update.classDate,
            "markedAt": firestore.SERVER_TIMESTAMP
        }
        
        doc_ref.set(data, merge=True)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
