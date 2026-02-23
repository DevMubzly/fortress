from backend.database import get_db_connection
from datetime import datetime, timedelta
import json
import sqlite3
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization

# Public key for license verification
PUBLIC_KEY_PEM = b"""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlMVNKuJlIzeleA4NsBSK
hjIxYUdTharEoN3hK5IylCz8T0518rJ7I/iLI1sM5EjNcw4YOrgVLnwspjUXqh1t
YGnWLH5bfKh0EOyk2n4oNi7wEIAfHKqKbFQcMv0xeneTx4Xl9kpx/nebipMFykDu
4JxQchH/k+zCww6/TYaJjrHD2C3kCapbN/fECl4K0BmqR7vzNqh/Qwpgd50sVmyp
y9xFOek+4pMsGsR2IwTw7Eyc/vyYOcwy7ydvzfnVosmNzFQLQHeKYcB2V3S/Ueie
hCXzwrr1ec3lTWLf77ct0XVLNo90eEjzO5Edxd18e5awf4z4C2z87wadCvsiPbis
5wIDAQAB
-----END PUBLIC KEY-----"""

class LicenseService:
    def verify_license_signature(self, license_full_obj: dict) -> dict:
        """
        Verifies the signature of the license object.
        Returns the payload dict if valid, raises ValueError if invalid.
        """
        try:
            signed_payload_str = license_full_obj.get("signedPayload")
            signature_b64 = license_full_obj.get("signature")
            
            if not signed_payload_str or not signature_b64:
                # Fallback for old format if key rotation happens or dev testing
                # In prod, this should be strict. For now, try verifying payload object directly if signedPayload is missing
                # But since we just added signedPayload, let's enforce it or fail.
                raise ValueError("Missing signature or signedPayload")

            signature = base64.b64decode(signature_b64)
            
            public_key = serialization.load_pem_public_key(PUBLIC_KEY_PEM)
            
            # Verify
            public_key.verify(
                signature,
                signed_payload_str.encode('utf-8'),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            # If verification passes, return the parsed payload
            return json.loads(signed_payload_str)
            
        except Exception as e:
            raise ValueError(f"License verification failed: {str(e)}")

    def save_license(self, payload: dict, raw_license_str: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        fingerprint = payload.get("fingerprint") # Might be None initially
        activated_at = payload.get("activated_at") # Might be None initially
        
        # Map fields
        # payload from lander: { organization, tier, features, validUntil, maxUsers, id, issuedAt }
        # db schema: id, client_name, tier, features, max_gpus, expires_at, fingerprint, raw_license, activated_at
        
        client_name = payload.get("organization", "Unknown Organization")
        tier = payload.get("tier", "standard")
        features = json.dumps(payload.get("features", []))
        max_users = payload.get("maxUsers", 10) # Map maxUsers to max_gpus or add column? Assuming max_gpus was a placeholder
        
        expires_at_str = payload.get("validUntil")
        expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00')) if expires_at_str else datetime.utcnow() + timedelta(days=30)
        
        cursor.execute("""
            INSERT OR REPLACE INTO licenses (id, client_name, tier, features, max_gpus, expires_at, fingerprint, raw_license, activated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.get("id"),
            client_name,
            tier,
            features,
            max_users, # using max_users for max_gpus column for now, schema migration might be needed later if strictly GPU
            expires_at.isoformat(),
            fingerprint,
            raw_license_str,
            activated_at
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
                "max_users": row["max_gpus"], # Exposing as max_users
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
