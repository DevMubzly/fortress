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

@router.post("/license")
async def update_license(data: LicenseUpdate):
    raise HTTPException(status_code=501, detail="License update must use setup or admin endpoint")
