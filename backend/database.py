import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()


try:
    # Check if app is already initialized to avoid errors during hot reload
    app = firebase_admin.get_app()
except ValueError:
    # If using a specific service account file:
    # cred = credentials.Certificate("path/to/serviceAccountKey.json")
    # firebase_admin.initialize_app(cred)
    
    # Or rely on GOOGLE_APPLICATION_CREDENTIALS env var
    firebase_admin.initialize_app()

db = firestore.client()

def get_db():
    return db
