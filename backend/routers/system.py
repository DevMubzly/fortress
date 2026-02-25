from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
import shutil
import os
import time
import platform
import psutil
import aiohttp
import asyncio
from backend.config import settings
from backend.database import get_db_connection
from pydantic import BaseModel
import json

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/metrics")
async def get_system_metrics():
    try:
        cpu_percent = psutil.cpu_percent(interval=None) or 0
        mem = psutil.virtual_memory()
        disk = shutil.disk_usage("/")
        net_io = psutil.net_io_counters()
        process_count = len(psutil.pids())
        
        db_path = settings.DATABASE_PATH
        db_size = os.path.getsize(db_path) if os.path.exists(db_path) else 0

        # Check Ollama Status & Loaded Model
        ollama_status = False
        loaded_model = None

        try:
            async with aiohttp.ClientSession() as session:
                # specific call to minimize timeout if offline
                try:
                    async with session.get("http://localhost:11434/api/version", timeout=1.0) as resp:
                         if resp.status == 200:
                             ollama_status = True
                except:
                    pass
                        
                # If online, try to get loaded models 
                if ollama_status:
                    try:
                        async with session.get("http://localhost:11434/api/ps", timeout=2.0) as resp:
                            if resp.status == 200:
                                result = await resp.json()
                                models = result.get("models", [])
                                if models:
                                    loaded_model = models[0].get("name")
                    except:
                        pass
        except Exception:
            pass

        return {
            "cpu_usage": cpu_percent,
            "ram_usage": mem.percent,
            "ram_total": round(mem.total / (1024**3), 2),
            "ram_used": round(mem.used / (1024**3), 2),
            "disk_total": round(disk.total / (1024**3), 2),
            "disk_used": round(disk.used / (1024**3), 2),
            "disk_percent": round((disk.used / disk.total) * 100, 1),
            "net_sent_mb": round(net_io.bytes_sent / (1024**2), 2),
            "net_recv_mb": round(net_io.bytes_recv / (1024**2), 2),
            "process_count": process_count,
            "db_size_mb": round(db_size / (1024**2), 2),
            "os": platform.system(),
            "uptime": int(time.time() - psutil.boot_time()),
            "ollama_status": ollama_status,
            "loaded_model": loaded_model
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/license")
async def get_license_info():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get the most recent license
        cursor.execute("""
            SELECT client_name, tier, features, max_gpus, expires_at, activated_at 
            FROM licenses 
            ORDER BY activated_at DESC 
            LIMIT 1
        """)
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return {"status": "none", "message": "No license found"}
            
        # Parse data
        client_name = row["client_name"]
        tier = row["tier"]
        features = json.loads(row["features"]) if row["features"] else []
        max_users = row["max_gpus"]
        expires_at_str = row["expires_at"]
        
        # Calculate status
        try:
             # Handle possible Z or offset
             expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
        except:
             expires_at = datetime.now() + timedelta(days=365) # Fallback
             
        now = datetime.now(expires_at.tzinfo) if expires_at.tzinfo else datetime.now()
        days_remaining = (expires_at - now).days
        
        status = "active"
        if days_remaining < 0:
            status = "expired"
        elif days_remaining < 30:
            status = "expiring"
            
        return {
            "status": status,
            "organization": client_name,
            "tier": tier,
            "features": features,
            "max_users": max_users,
            "active_users": 0, # TODO: hook up to real user count
            "issued_at": row["activated_at"],
            "expires_at": expires_at_str,
            "days_remaining": days_remaining
        }
    except Exception as e:
        print(f"Error fetching license: {e}")
        return {"status": "error", "message": str(e)}

class LicenseUpdate(BaseModel):
    file_content: str

from backend.services.license_service import LicenseService
import base64

@router.post("/license")
async def update_license(data: LicenseUpdate):
    try:
        service = LicenseService()
        
        # 1. Get current license to check organization
        current_license = service.get_license()
        
        # 2. Parse and verify new license WITHOUT saving yet
        # We RE-IMPLEMENT the parsing logic here to inspect before saving
        # or we could refactor LicenseService, but let's do it here for safety
        
        file_content_b64 = data.file_content
        
        # Step 1: Decode the upload payload (base64 -> bytes)
        try:
            decoded_bytes = base64.b64decode(file_content_b64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 encoding")

        # Step 2: Try to parse as JSON directly
        license_full_obj = None
        try:
            license_str = decoded_bytes.decode('utf-8')
            license_full_obj = json.loads(license_str)
            
            if isinstance(license_full_obj, str):
                 try:
                     inner_bytes = base64.b64decode(license_full_obj)
                     license_full_obj = json.loads(inner_bytes.decode('utf-8'))
                 except Exception:
                     try:
                         license_full_obj = json.loads(license_full_obj)
                     except:
                         pass
        except json.JSONDecodeError:
            try:
                inner_bytes = base64.b64decode(decoded_bytes)
                license_str = inner_bytes.decode('utf-8')
                license_full_obj = json.loads(license_str)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid license file format")

        if not isinstance(license_full_obj, dict):
             raise HTTPException(status_code=400, detail="Invalid license structure")

        # Step 3: Verify signature
        try:
            payload = service.verify_license_signature(license_full_obj)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid license signature: {str(e)}")

        # Step 4: Check Organization Match
        new_org = payload.get("organization")
        
        if current_license:
            current_org = current_license.get("client_name") or current_license.get("organization")
            # Normalize for comparison?
            if current_org and new_org and current_org.lower().strip() != new_org.lower().strip():
                # REVOKE / REJECT
                raise HTTPException(status_code=403, detail=f"License Organization Mismatch. Expected '{current_org}', got '{new_org}'. Update rejected.")
        
        # Step 5: Save (Implement)
        # We can use the service method now that we verified the org
        # But verify_license_signature returned payload, and save_license needs payload + raw string
        # We need to reconstruct the raw string or use the one we decoded.
        # Actually, process_license_content does it all. We can just call it now?
        # Yes, because we already verified the org condition.
        
        service.save_license(payload, json.dumps(license_full_obj))
        
        return {"status": "success", "message": "License updated successfully", "organization": new_org}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error updating license: {e}")
        raise HTTPException(status_code=500, detail=str(e))
