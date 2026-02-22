from backend.database import get_db_connection
from backend.models.models import AuditLog
from datetime import datetime
from typing import Optional, List

class AuditService:
    def log(self, action: str, user_id: int = None, resource: str = None, details: str = None, ip_address: str = None):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, resource, details, ip_address)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, action, resource, details, ip_address))
        
        conn.commit()
        conn.close()

    def get_logs(self, limit: int = 100) -> List[AuditLog]:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        
        return [AuditLog(**row) for row in rows]

audit_service = AuditService()
