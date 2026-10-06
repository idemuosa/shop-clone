import firebase_admin
from firebase_admin import auth, credentials
from fastapi import Header, HTTPException, status
import os
import json

# Try to get credentials from environment variables:
# 1. Individual env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
# 2. FIREBASE_SERVICE_ACCOUNT_JSON string
# 3. FIREBASE_SERVICE_ACCOUNT_KEY path or fallback file path
project_id = os.getenv("FIREBASE_PROJECT_ID")
client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
private_key = os.getenv("FIREBASE_PRIVATE_KEY")
firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")

def initialize_firebase():
    try:
        # Check if already initialized
        firebase_admin.get_app()
        print("Firebase Admin already initialized.")
        return
    except ValueError:
        pass

    if project_id and client_email and private_key:
        try:
            cert_dict = {
                "type": "service_account",
                "project_id": project_id,
                "client_email": client_email,
                "private_key": private_key.replace("\\n", "\n")
            }
            cred = credentials.Certificate(cert_dict)
            firebase_admin.initialize_app(cred)
            print("Successfully initialized Firebase Admin using individual environment variables.")
            return
        except Exception as e:
            print(f"Error initializing Firebase Admin from individual env vars: {e}")

    if firebase_json:
        try:
            cert_dict = json.loads(firebase_json)
            # Fix potential newline issues in the private key
            if "private_key" in cert_dict:
                cert_dict["private_key"] = cert_dict["private_key"].replace("\\n", "\n")

            cred = credentials.Certificate(cert_dict)
            firebase_admin.initialize_app(cred)
            print("Successfully initialized Firebase Admin using FIREBASE_SERVICE_ACCOUNT_JSON.")
            return
        except Exception as e:
            print(f"Error initializing Firebase Admin from JSON string: {e}")

    # Fallback to file path
    if not cred_path:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        fallback_path = os.path.join(base_dir, "service-account.json")
        if os.path.exists(fallback_path):
            current_cred_path = fallback_path
        else:
            current_cred_path = None
    else:
        current_cred_path = cred_path

    if current_cred_path and os.path.exists(current_cred_path):
        try:
            cred = credentials.Certificate(current_cred_path)
            firebase_admin.initialize_app(cred)
            print(f"Successfully initialized Firebase Admin with: {current_cred_path}")
        except Exception as e:
            print(f"Error initializing Firebase Admin from file: {e}")
    else:
        print("Warning: Firebase service account key not found. Auth will not work.")

initialize_firebase()

async def verify_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )

    token = authorization.split(" ")[1] if " " in authorization else authorization

    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )
