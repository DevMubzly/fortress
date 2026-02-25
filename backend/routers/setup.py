from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.services.config_service import ConfigService
from backend.services.license_service import LicenseService
from backend.services.user_service import UserService
from backend.models.models import UserCreate, License
import base64
import json

router = APIRouter(prefix="/setup", tags=["setup"])
config_service = ConfigService()
license_service = LicenseService()
user_service = UserService()

class SetupStatus(BaseModel):
    completed: bool
    step: int

class SetupStatus(BaseModel):
    completed: bool
    step: int = 1

@router.post("/reset")
def reset_system():
    """
    Destructive: Wipes all data to restart onboarding.
    """
    from backend.database import get_db_connection
    import os
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Delete all tables content but keep structure? 
        # Or better -> recreate tables?
        # User said "deletes evrything entirely from the database"
        
        tables = ["users", "licenses", "sessions", "audit_logs", "api_keys", "downloaded_models", "config"]
        for table in tables:
            try:
                cursor.execute(f"DELETE FROM {table}")
            except Exception:
                pass # Table might not exist
        
        conn.commit()
        conn.close()
        return {"status": "success", "message": "System reset complete"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    from backend.services.user_service import UserService
    from backend.services.license_service import LicenseService
    from backend.database import get_db_connection

    user_svc = UserService()
    license_svc = LicenseService()

    has_users = user_svc.has_any_users()
    has_license = license_svc.get_license() is not None

    print(f"DEBUG: Setup Status Check - Users: {has_users}, License: {has_license}")

    if has_users and has_license:
        return {"completed": True, "step": 5}
    
    # Determine step if not complete
    if not has_users:
        return {"completed": False, "step": 1}
    
    if not has_license:
        return {"completed": False, "step": 2}
        
    return {"completed": False, "step": 1}

@router.get("/status", response_model=SetupStatus)
def get_setup_status():
    return check_setup_status()

class LicenseUpload(BaseModel):
    file_content: str  # Base64 encoded

@router.post("/license")
def upload_license(license_data: LicenseUpload):
    try:
        # Process the uploaded license content (base64 encoded)
        # Verify signature, check expiry, and save to DB
        payload = license_service.process_license_content(license_data.file_content)
        
        return {"item": payload}
    except Exception as e:
        # Check if it was our HTTPException
        if isinstance(e, HTTPException):
            raise e
        print(f"Error processing license upload: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"License processing failed: {str(e)}")

@router.post("/admin")
def create_admin(user: UserCreate):
    try:
        # Check if user exists (by email OR username) to allow retry
        # This handles the case where the user refreshed or previous step failed
        # We check both email and username as either could trigger UNIQUE constraint
        existing_user_email = user_service.get_user_by_email(user.email)
        existing_user_username = user_service.get_user_by_username(user.username)
        
        if existing_user_email:
             # Update password for existing user intended to be admin
             user_service.update_user_password(existing_user_email.username, user.password)
             return {"user": existing_user_email}

        if existing_user_username:
             user_service.update_user_password(existing_user_username.username, user.password)
             return {"user": existing_user_username}

        new_user = user_service.create_admin_user(user)
        return {"user": new_user}
    except Exception as e:
        print(f"Error creating admin: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

class SSOConfig(BaseModel):
    issuer_url: str
    client_id: str
    client_secret: str

@router.post("/sso")
def configure_sso(config: SSOConfig):
    config_service.set_auth_config({
        "provider": "oidc",
        **config.dict()
    })
    return {"status": "ok"}

class InfraConfig(BaseModel):
    ollama_url: str
    chroma_url: str

@router.post("/infra")
def configure_infra(config: InfraConfig):
    config_service.set_infrastructure_config(config.dict())
    return {"status": "ok"}

@router.post("/complete")
def complete_setup():
    config_service.mark_setup_complete()
    return {"status": "setup_completed"}
