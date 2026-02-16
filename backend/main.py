from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import students, schedule, auth
import os
from dotenv import load_dotenv

load_dotenv()

# Check if running on Vercel to set root_path
# Removed root_path manipulation as it might cause redirect loops if Vercel strips path
# root_path = "/api" if os.getenv("VERCEL") else ""
app = FastAPI(title="AttendEase Backend")

# Allow CORS for the frontend
allow_origins = os.getenv("ALLOW_ORIGINS", "http://localhost:3000,http://localhost:9002,http://127.0.0.1:3000,http://127.0.0.1:9002").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/students", tags=["Students"])
app.include_router(schedule.router, prefix="/schedule", tags=["Schedule"])
from backend.routers import admin
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

@app.get("/")
def read_root():
    from backend.database import init_error
    if init_error:
        return {"message": "AttendEase API is running, but Backend Error: " + init_error}
    return {"message": "AttendEase API is running"}
