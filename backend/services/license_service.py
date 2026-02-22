from backend.database import get_db_connection
from datetime import datetime, timedelta
import json
import sqlite3

class LicenseService:
    def save_license(self, license_data: dict):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        fingerprint = license_data.get("fingerprint")
        activated_at = license_data.get("activated_at")
        
        cursor.execute("""
            INSERT OR REPLACE INTO licenses (id, client_name, tier, features, max_gpus, expires_at, fingerprint, raw_license, activated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            license_data["id"],
            license_data["client_name"],
            license_data["tier"],
            json.dumps(license_data["features"]),
            license_data["max_gpus"],
            license_data["expires_at"].isoformat() if isinstance(license_data["expires_at"], datetime) else license_data["expires_at"],
            fingerprint,
            license_data["raw_license"],
            activated_at.isoformat() if isinstance(activated_at, datetime) else activated_at
        ))
        
        conn.commit()
        conn.close()

    def get_license(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM licenses ORDER BY rowid DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "id": row["id"],
                "client_name": row["client_name"],
                "tier": row["tier"],
                "features": json.loads(row["features"]),
                "max_gpus": row["max_gpus"],
                "expires_at": datetime.fromisoformat(row["expires_at"]),
                "fingerprint": row["fingerprint"],
                "raw_license": row["raw_license"],
                "activated_at": datetime.fromisoformat(row["activated_at"]) if row["activated_at"] else None
            }
        return None

    def bind_machine_fingerprint(self, fingerprint: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE licenses 
            SET fingerprint = ?, activated_at = ? 
            WHERE rowid = (SELECT rowid FROM licenses ORDER BY rowid DESC LIMIT 1)
        """, (fingerprint, datetime.utcnow().isoformat()))
        conn.commit()
        conn.close()

    def validate_license(self, machine_fingerprint: str = None) -> dict:
        lic = self.get_license()
        if not lic:
            return {"valid": False, "error": "No license found"}
        
        if lic["expires_at"] < datetime.utcnow():
            return {"valid": False, "error": "License expired"}
        
        if lic["fingerprint"] and machine_fingerprint and lic["fingerprint"] != machine_fingerprint:
             return {"valid": False, "error": "Machine fingerprint mismatch"}
             
        return {"valid": True}

license_service = LicenseService()
