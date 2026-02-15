from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import RedirectResponse
import os
import requests
from dotenv import load_dotenv
from database import get_db
from firebase_admin import auth as firebase_auth
from datetime import datetime, timedelta

load_dotenv()

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# Frontend URL to redirect back to after successful login
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:9002")
# This backend's callback URL
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:8000/auth/callback")

@router.get("/login")
def login_google():
    """Redirects the user to the Google Consent Screen."""
    scope = "openid email profile"
    return RedirectResponse(
        f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope={scope}&access_type=offline"
    )

@router.get("/callback")
def auth_callback(code: str, response: Response):
    """Exchanges code for tokens, verifies user, and sets a session cookie."""
    
    # 1. Exchange code for access token
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    
    res = requests.post(token_url, data=data)
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to retrieve token from Google")
    
    tokens = res.json()
    id_token = tokens.get("id_token")
    
    # 2. Get user info from Google
    user_info_res = requests.get(f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={tokens['access_token']}")
    user_info = user_info_res.json()
    
    email = user_info.get("email")
    name = user_info.get("name")
    google_uid = user_info.get("id")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    # 3. Create or Update Firebase User
    try:
        # check if user exists in firebase auth
        user = firebase_auth.get_user_by_email(email)
        uid = user.uid
    except firebase_auth.UserNotFoundError:
        # Create new user
        user = firebase_auth.create_user(
            email=email,
            display_name=name,
            uid=google_uid # Optionally use Google's UID or let Firebase generate one
        )
        uid = user.uid

    # 4. Create a Session Cookie (Custom implementation or Firebase Session Cookies)
    # For simplicity, we will mint a Custom Token and pass it to the frontend via a cookie, 
    # OR we can use HTTP-only cookies for session management.
    # Here, let's set a simple cookie with the custom token so the frontend can retrieve it 
    # and sign in with `signInWithCustomToken` (if we want to keep using Firebase SDK on client for auth state),
    # OR better: manage the session purely here.
    
    # Let's try the Firebase Custom Token approach for smooth migration:
    # We pass the token in a query param to the frontend or a cookie. 
    # Security note: Passing in URL hash/param is less secure than HTTP-only cookie, 
    # but required if we want the Client SDK to take over.
    
    custom_token = firebase_auth.create_custom_token(uid)
    custom_token_str = custom_token.decode('utf-8')
    
    # Redirect to frontend with token
    return RedirectResponse(f"{FRONTEND_URL}/?token={custom_token_str}")

@router.get("/me")
def get_current_user(request: Request):
    # This would require middleware to verify the Authorization header or Cookie
    # implementing a simple check here if we were using purely backend sessions.
    pass
