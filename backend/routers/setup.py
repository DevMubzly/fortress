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

@router.get("/status", response_model=SetupStatus)
def get_setup_status():
    status = config_service.get_setup_status()
    # Step logic could be more complex but keeping it simple
    return {"completed": status, "step": 1 if not status else 5}

class LicenseUpload(BaseModel):
    file_content: str  # Base64 encoded

@router.post("/license")
def upload_license(license_data: LicenseUpload):
    try:
        decoded_bytes = base64.b64decode(license_data.file_content)
        license_str = decoded_bytes.decode('utf-8')
        license_full_obj = json.loads(license_str)
        
        # Verify signature and get payload
        try:
             payload = license_service.verify_license_signature(license_full_obj)
        except ValueError as e:
             raise HTTPException(status_code=400, detail=str(e))
             
        # Validate logic (expiry etc)
        # Note: We pass a simple dict to validate_license, but validate_license currently fetches from DB!
        # We need validation OF THE PAYLOAD before saving.
        # But license_service.validate_license is designed to check the *active* license against system constraints.
        
        # Simple check on payload expires_at
        if payload.get("validUntil"):
            expires_at = datetime.fromisoformat(payload["validUntil"].replace('Z', '+00:00'))
            if expires_at < datetime.utcnow():
                raise HTTPException(status_code=400, detail="License has already expired")

        # Save verified payload and the raw signed content
        license_service.save_license(payload, license_str)
        
        return {"item": payload}
    except Exception as e:
        # Check if it was our HTTPException
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"License processing failed: {str(e)}")

@router.post("/admin")
def create_admin(user: UserCreate):
    try:
        new_user = user_service.create_admin_user(user)
        return {"user": new_user}
    except Exception as e:
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
