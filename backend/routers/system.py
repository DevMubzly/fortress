from fastapi import APIRouter, HTTPException, Depends
from backend.services.license_service import license_service
from datetime import datetime
from pydantic import BaseModel
import base64
import json

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/license")
def get_license_info():
    license_data = license_service.get_license()
    if not license_data:
        return {"status": "none"}
    
    expires_at = license_data["expires_at"]
    days_remaining = (expires_at - datetime.utcnow()).days
    
    status = "active"
    if days_remaining < 0:
        status = "expired"
    elif days_remaining < 30:
        status = "expiring"

    issued_at = None
    try:
        raw_lic = json.loads(license_data["raw_license"])
        # Depending on format, issuedAt might be in payload or top level if old format
        # Current format: { payload: {...}, signature: "...", signedPayload: "..." }
        if "payload" in raw_lic:
            issued_at = raw_lic["payload"].get("issuedAt")
        elif "issuedAt" in raw_lic:
             issued_at = raw_lic["issuedAt"]
        
        # If signedPayload is present, lets trust that one most if we can parse it
        if "signedPayload" in raw_lic and isinstance(raw_lic["signedPayload"], str):
             payload_obj = json.loads(raw_lic["signedPayload"])
             issued_at = payload_obj.get("issuedAt")

        if issued_at:
             # Standardize format if needed, but it's likely ISO string already
             if isinstance(issued_at, str) and issued_at.endswith("Z"):
                 issued_at = issued_at.replace("T", " ").split(".")[0] # Simple formatting
    except:
        pass
        
    return {
        "status": status,
        "organization": license_data["client_name"],
        "tier": license_data["tier"],
        "features": license_data["features"],
        "max_users": license_data["max_users"],
        "expires_at": expires_at.strftime("%Y-%m-%d"),
        "days_remaining": days_remaining,
        "issued_at": issued_at or (license_data["activated_at"].strftime("%Y-%m-%d") if license_data["activated_at"] else "Unknown")
    }

class LicenseUpdate(BaseModel):
    file_content: str  # Base64 encoded

@router.post("/license")
def update_license(data: LicenseUpdate):
    try:
        decoded_bytes = base64.b64decode(data.file_content)
        license_str = decoded_bytes.decode('utf-8')
        license_full_obj = json.loads(license_str)
        
        # Verify signature
        payload = license_service.verify_license_signature(license_full_obj)
             
        # Check expiry
        if payload.get("validUntil"):
            expires_at = datetime.fromisoformat(payload["validUntil"].replace('Z', '+00:00'))
            if expires_at < datetime.utcnow():
                raise HTTPException(status_code=400, detail="License has already expired")

        # Save
        license_service.save_license(payload, license_str)
        
        return {"status": "updated", "organization": payload.get("organization")}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"License update failed: {str(e)}")
