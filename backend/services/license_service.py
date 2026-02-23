from backend.database import get_db_connection
from datetime import datetime, timedelta, timezone
import json
import sqlite3
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization

# Public key for license verification
# Default/Fallback key
DEFAULT_PUBLIC_KEY_PEM = b"""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlMVNKuJlIzeleA4NsBSK
hjIxYUdTharEoN3hK5IylCz8T0518rJ7I/iLI1sM5EjNcw4YOrgVLnwspjUXqh1t
YGnWLH5bfKh0EOyk2n4oNi7wEIAfHKqKbFQcMv0xeneTx4Xl9kpx/nebipMFykDu
4JxQchH/k+zCww6/TYaJjrHD2C3kCapbN/fECl4K0BmqR7vzNqh/Qwpgd50sVmyp
y9xFOek+4pMsGsR2IwTw7Eyc/vyYOcwy7ydvzfnVosmNzFQLQHeKYcB2V3S/Ueie
hCXzwrr1ec3lTWLf77ct0XVLNo90eEjzO5Edxd18e5awf4z4C2z87wadCvsiPbis
5wIDAQAB
-----END PUBLIC KEY-----"""

def get_public_key():
    """
    Try to load the public key from the lander/lib/keys.ts file to ensure sync.
    Fallback to DEFAULT_PUBLIC_KEY_PEM if file not found or parsing fails.
    """
    import os
    import re
    
    # Path relative to backend/services/license_service.py
    # .../backend/services/license_service.py -> .../lander/lib/keys.ts
    # 3 levels up from services: backend/services -> backend -> root -> lander/lib/keys.ts
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir))) # Adjust levels?
    # backend/services/ is 2 levels deep from project root? 
    # c:\Users\User\Desktop\Projects\fortress\backend\services -> c:\Users\User\Desktop\Projects\fortress
    
    keys_path = os.path.join(os.path.dirname(os.path.dirname(current_dir)), "lander", "lib", "keys.ts")
    
    if os.path.exists(keys_path):
        try:
            with open(keys_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract content between backticks after PUBLIC_KEY = 
            match = re.search(r'export const PUBLIC_KEY = `(.*?)`;', content, re.DOTALL)
            if match:
                key_str = match.group(1).strip()
                if key_str.startswith("-----BEGIN PUBLIC KEY-----"):
                    return key_str.encode('utf-8')
        except Exception as e:
            print(f"Warning: Failed to load public key from {keys_path}: {e}")

    return DEFAULT_PUBLIC_KEY_PEM

PUBLIC_KEY_PEM = get_public_key()

class LicenseService:
    def process_license_content(self, file_content_b64: str) -> dict:
        """
        Process the uploaded license file content (base64 encoded).
        Decodes, parses, verifies signature, checks expiry, and saves to DB.
        Returns the license payload.
        """
        try:
            # Step 1: Decode the upload payload (base64 -> bytes)
            decoded_bytes = base64.b64decode(file_content_b64)
            
            # Step 2: Try to parse as JSON directly
            try:
                license_str = decoded_bytes.decode('utf-8')
                license_full_obj = json.loads(license_str) # If this returns a string, it means the file content was a JSON string or Base64 string, not a JSON object.
                
                # If parsed result is a string, it might be that the file content was "eyJ..." (quoted string) or just a string that looks like JSON?
                # No, if file content is `eyJ...`, json.loads("eyJ...") raises JSONDecodeError usually because it's not a valid JSON value unless it is quoted.
                # If file content is raw base64 `eyJ...` (no quotes), json.loads will fail.
                # If file content is `{"payload":...}`, json.loads returns dict.
                
                if isinstance(license_full_obj, str):
                     # If we got a string, maybe it was a JSON-encoded string (double encoded?)
                     # Or maybe we need to treat THIS string as the potential base64?
                     # Let's try to assume this string is the license content (maybe base64)
                     try:
                         # Attempt to decode this string as base64
                         inner_bytes = base64.b64decode(license_full_obj)
                         license_full_obj = json.loads(inner_bytes.decode('utf-8'))
                     except Exception:
                         # If that fails, maybe the string itself IS the JSON? (unlikely if we just loaded it from JSON)
                         # Let's try to load the string as JSON again?
                         try:
                             license_full_obj = json.loads(license_full_obj)
                         except:
                             pass

            except json.JSONDecodeError:
                # Step 3: If not JSON, it might be double base64 encoded (file content was raw base64 text)
                try:
                    # decoded_bytes is b'eyJ...'
                    inner_bytes = base64.b64decode(decoded_bytes)
                    license_str = inner_bytes.decode('utf-8')
                    license_full_obj = json.loads(license_str)
                except Exception:
                    # Provide original error if re-decode fails
                    raise ValueError("Invalid license file format. specific JSON structure required.")

            if isinstance(license_full_obj, str):
                 raise ValueError("License file content parsed to a string, expected a JSON object.")

            # Step 4: Verify signature
            payload = self.verify_license_signature(license_full_obj)
            
            # Step 5: Check expiry
            if payload.get("validUntil"):
                # Handle potential Z suffix for UTC
                expires_at_str = payload["validUntil"].replace('Z', '+00:00')
                expires_at = datetime.fromisoformat(expires_at_str)
                # Ensure it's offset-aware and use compatible current time (UTC)
                if expires_at < datetime.now(timezone.utc):
                    raise ValueError(f"License has expired. Valid until {expires_at}")

            # Step 6: Save to database
            # We save the *original* decoded string as the raw license for future verification
            self.save_license(payload, license_str)
            
            return payload

        except Exception as e:
            raise ValueError(f"License processing failed: {str(e)}")

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
