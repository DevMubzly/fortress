from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import shutil
import os
import time
import platform
import psutil
import aiohttp
import asyncio
from backend.config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/system", tags=["System"])

# Mock license store
_license_db = {
    "status": "active",
    "organization": "Department of Defense",
    "tier": "Enterprise",
    "features": ["Advanced Analytics", "SSO", "Audit Logs", "Unlimited Users"],
    "max_users": 5000,
    "active_users": 142,
    "issued_at": datetime.now().isoformat(),
    "expires_at": (datetime.now().replace(year=datetime.now().year + 1)).isoformat(),
}

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
    expires = datetime.fromisoformat(_license_db["expires_at"])
    days_left = (expires - datetime.now()).days
    
    return {
        **_license_db,
        "days_remaining": days_left
    }

class LicenseUpdate(BaseModel):
    file_content: str

@router.post("/license")
async def update_license(data: LicenseUpdate):
    # Mock update logic
    global _license_db
    _license_db["organization"] = "Updated Org"
    _license_db["status"] = "active"
    return {"status": "updated", "organization": "Updated Org"}
