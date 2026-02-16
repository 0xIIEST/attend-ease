import firebase_admin
from firebase_admin import credentials, firestore, auth

firebase_auth = auth
import os
from dotenv import load_dotenv

load_dotenv()


init_error = None
firebase_app = None
db = None

try:
    # Check if app is already initialized to avoid errors during hot reload
    try:
        firebase_app = firebase_admin.get_app()
    except ValueError:
        # Vercel: Load from ENV variable string
        firebase_sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")
        
        if firebase_sa_json:
            import json
            cred_dict = json.loads(firebase_sa_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            firebase_app = firebase_admin.get_app()
        
        # Local: Load from file if exists
        elif os.path.exists("backend/serviceAccountKey.json"):
            cred = credentials.Certificate("backend/serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
            firebase_app = firebase_admin.get_app()
            
        # Fallback to default (Google Cloud Run / Local with Auth set)
        else:
            # Only try this if we think we are in an environment that supports it
            # otherwise it raises an error that crashes the module
            firebase_admin.initialize_app()
            firebase_app = firebase_admin.get_app()

    db = firestore.client()
except Exception as e:
    # Capture error to show in health check or auth endpoint instead of crashing app
    init_error = f"Firebase Init Error: {str(e)}"
    print(init_error)

def get_db():
    return db
