from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
import json
import uuid
from datetime import datetime
from backend.models.models import User
from backend.database import get_db_connection
from backend.dependencies import deps

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("/")
async def list_audit_logs(
    limit: int = 100, 
    offset: int = 0, 
    current_user: User = Depends(deps.get_current_user)
):
    conn = get_db_connection()
    conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
    cursor = conn.cursor()
    
    # Only admins or specific roles can see logs?
    if current_user.role != "admin":
        # Maybe allow viewing own logs?
        pass # For now, assume admin only or wide open for demo

    cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?", (limit, offset))
    rows = cursor.fetchall()
    conn.close()
    
    # Transform for frontend if needed
    return rows

def log_event(action: str, details: dict, user_id: str = None, api_key_id: str = None, ip: str = None, status: str = "success"):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        audit_id = f"aud_{uuid.uuid4().hex}"
        timestamp = datetime.utcnow().isoformat()
        
        cursor.execute(
            "INSERT INTO audit_logs (id, timestamp, user_id, api_key_id, action, details, ip_address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (audit_id, timestamp, user_id, api_key_id, action, json.dumps(details), ip, status)
        )
        conn.commit()
    except Exception as e:
        print(f"Failed to log audit event: {e}")
    finally:
        if 'conn' in locals():
            conn.close()
