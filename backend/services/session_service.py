from backend.database import get_db_connection
from backend.utils import generate_session_token, generate_session_expiry
from backend.models.models import Session
from datetime import datetime
import sqlite3

class SessionService:
    def create_session(self, user_id: int, ip_address: str, user_agent: str) -> str:
        token = generate_session_token()
        expiry = generate_session_expiry()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("INSERT INTO sessions (token, user_id, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
                       (token, user_id, expiry.isoformat(), ip_address, user_agent))
        conn.commit()
        conn.close()
        return token

    def validate_session(self, token: str) -> int | None:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM sessions WHERE token = ?", (token,))
        row = cursor.fetchone()
        conn.close()
        
        if row and datetime.fromisoformat(row["expires_at"]) > datetime.utcnow():
            return row["user_id"]
        return None

    def destroy_session(self, token: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()

    def destroy_all_user_sessions(self, user_id: int):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()

    def cleanup_expired_sessions(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE expires_at < ?", (datetime.utcnow().isoformat(),))
        conn.commit()
        conn.close()

session_service = SessionService()
