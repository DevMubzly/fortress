from fastapi import APIRouter, Header, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from backend.services.license_service import license_service
from backend.models.models import User
from backend.dependencies import get_current_admin_user

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    responses={404: {"description": "Not found"}},
)

class LicenseSchema(BaseModel):
    id: str
    client_name: str
    tier: str
    features: List[str]
    max_users: int
    expires_at: Optional[str]
    fingerprint: Optional[str]
    raw_license: Optional[str]
    activated_at: Optional[str]
    issued_at: Optional[str]

class AdminLicenseUpload(BaseModel):
    file_content: str

@router.post("/licenses")
async def upload_license(license_data: AdminLicenseUpload, current_user: User = Depends(get_current_admin_user)):
    try:
        payload = license_service.process_license_content(license_data.file_content)
        return {"status": "success", "license": payload}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/licenses", response_model=List[LicenseSchema])
async def get_licenses(current_user: User = Depends(get_current_admin_user)):
    # Assuming only admin can see this - for now let any authenticated user (or check role)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return license_service.get_all_licenses()

@router.delete("/licenses/{license_id}")
async def revoke_license(license_id: str, current_user: User = Depends(get_current_admin_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = license_service.delete_license(license_id)
    if not success:
        raise HTTPException(status_code=404, detail="License not found")
    
    return {"status": "success", "message": f"License {license_id} revoked"}

