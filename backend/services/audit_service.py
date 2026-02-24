from backend.database import get_db_connection
from datetime import datetime
from typing import Optional, List
import json
import uuid

class AuditService:
    def log(self, action: str, details: dict, user_id: str = None, api_key_id: str = None, ip_address: str = None, status: str = "success"):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        audit_id = f"aud_{uuid.uuid4().hex}"
        timestamp = datetime.utcnow().isoformat()
        
        cursor.execute("""
            INSERT INTO audit_logs (id, timestamp, user_id, api_key_id, action, details, ip_address, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (audit_id, timestamp, user_id, api_key_id, action, json.dumps(details), ip_address, status))
        
        conn.commit()
        conn.close()

    def get_logs(self, limit: int = 100, offset: int = 0) -> List[dict]:
        conn = get_db_connection()
        conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?", (limit, offset))
        rows = cursor.fetchall()
        conn.close()
        
        return rows

audit_service = AuditService()
