from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
import secrets
import hashlib
import json
import sqlite3
from datetime import datetime
from backend.models.models import APIKey, APIKeyCreate, APIKeyResponse, User
from backend.database import get_db_connection
from backend.dependencies import deps

router = APIRouter(prefix="/apikeys", tags=["API Keys"])

def generate_api_key_str() -> str:
    return f"sk-{secrets.token_urlsafe(32)}"

def get_key_hash(key_str: str) -> str:
    return hashlib.sha256(key_str.encode()).hexdigest()

@router.get("/", response_model=List[APIKey])
async def list_api_keys(current_user: User = Depends(deps.get_current_user)):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check for expired keys and set is_active=0
    now = datetime.now().isoformat()
    cursor.execute("UPDATE api_keys SET is_active = 0 WHERE expires_at IS NOT NULL AND expires_at < ? AND is_active = 1", (now,))
    conn.commit()
    
    # Use 'role' attribute instead of dict access
    if current_user.role == "admin":
        cursor.execute("SELECT * FROM api_keys ORDER BY created_at DESC")
    else:
        cursor.execute("SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC", (current_user.id,))
        
    rows = cursor.fetchall()
    conn.close()
    
    keys = []
    for row in rows:
        try:
            allowed = json.loads(row["allowed_models"]) if row["allowed_models"] else []
        except:
            allowed = []
            
        keys.append(APIKey(
            id=row["id"],
            name=row["name"],
            description=row["description"] if "description" in row.keys() else None,
            prefix=row["prefix"],
            user_id=row["user_id"],
            allowed_models=allowed,
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(),
            expires_at=datetime.fromisoformat(row["expires_at"]) if row["expires_at"] else None,
            last_used_at=datetime.fromisoformat(row["last_used_at"]) if row["last_used_at"] else None,
            is_active=bool(row["is_active"])
        ))
    return keys

@router.post("/", response_model=APIKeyResponse)
async def create_api_key(key_data: APIKeyCreate, current_user: User = Depends(deps.get_current_user)):
    # If user_id is not provided, use current user
    target_user_id = key_data.user_id if key_data.user_id else current_user.id
    
    # Only admins can assign to others
    if target_user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Cannot assign keys to other users")
    
    raw_key = generate_api_key_str()
    key_hash = get_key_hash(raw_key)
    prefix = raw_key[:8] + "..."
    
    allowed_json = json.dumps(key_data.allowed_models)
    
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    
    # Ensure raw_key column exists
    try:
        cursor.execute("SELECT raw_key FROM api_keys LIMIT 1")
    except sqlite3.OperationalError:
        try:
            cursor.execute("ALTER TABLE api_keys ADD COLUMN raw_key TEXT")
            conn.commit()
        except Exception:
            pass # Already exists or other error

    # Ensure description column exists (migration helper)
    try:
        cursor.execute("SELECT description FROM api_keys LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE api_keys ADD COLUMN description TEXT")
        conn.commit()
    
    try:
        cursor.execute('''
            INSERT INTO api_keys (user_id, key_hash, prefix, name, description, allowed_models, created_at, expires_at, is_active, raw_key)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        ''', (
            target_user_id, 
            key_hash, 
            prefix, 
            key_data.name,
            key_data.description,
            allowed_json, 
            datetime.now().isoformat(),
            key_data.expires_at.isoformat() if key_data.expires_at else None,
            raw_key
        ))
        api_key_id = cursor.lastrowid
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Key generation error: {str(e)}")
    
    # Fetch created record to return
    cursor.execute("SELECT * FROM api_keys WHERE id = ?", (api_key_id,))
    row = cursor.fetchone()
    conn.close()
    
    created_key_info = APIKey(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        prefix=row["prefix"],
        user_id=row["user_id"],
        allowed_models=json.loads(row["allowed_models"]),
        created_at=datetime.fromisoformat(row["created_at"]),
        expires_at=datetime.fromisoformat(row["expires_at"]) if row["expires_at"] else None,
        last_used_at=None,
        is_active=bool(row["is_active"])
    )
    
    return APIKeyResponse(key=raw_key, info=created_key_info)

@router.delete("/{key_id}")
async def delete_api_key(key_id: int, current_user: User = Depends(deps.get_current_user)):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check ownership
    cursor.execute("SELECT user_id FROM api_keys WHERE id = ?", (key_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Key not found")
        
    if row["user_id"] != current_user.id and current_user.role != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Access denied")
        
    cursor.execute("DELETE FROM api_keys WHERE id = ?", (key_id,))
    conn.commit()
    conn.close()
    
    return {"status": "deleted", "id": key_id}

@router.post("/{key_id}/revoke")
async def revoke_api_key(key_id: int, current_user: User = Depends(deps.get_current_user)):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT user_id, is_active FROM api_keys WHERE id = ?", (key_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Key not found")
        
    if row["user_id"] != current_user.id and current_user.role != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Access denied")
        
    cursor.execute("UPDATE api_keys SET is_active = 0 WHERE id = ?", (key_id,))
    conn.commit()
    conn.close()
    
    return {"status": "revoked", "id": key_id}

@router.post("/{key_id}/restore")
async def restore_api_key(key_id: int, current_user: User = Depends(deps.get_current_user)):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT user_id, is_active, expires_at FROM api_keys WHERE id = ?", (key_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Key not found")
        
    if row["user_id"] != current_user.id and current_user.role != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if expired before restoring
    if row["expires_at"]:
        expires_at = datetime.fromisoformat(row["expires_at"])
        if expires_at < datetime.now():
             conn.close()
             raise HTTPException(status_code=400, detail="Cannot restore expired key. Create a new one.")

    cursor.execute("UPDATE api_keys SET is_active = 1 WHERE id = ?", (key_id,))
    conn.commit()
    conn.close()
    
    return {"status": "restored", "id": key_id}

@router.get("/{key_id}/reveal")
async def reveal_api_key(key_id: int, current_user: User = Depends(deps.get_current_user)):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Try to get raw_key, if column doesn't exist it will throw error so we query gently
    try:
        cursor.execute("SELECT user_id, raw_key FROM api_keys WHERE id = ?", (key_id,))
        row = cursor.fetchone()
    except Exception:
        conn.close()
        raise HTTPException(status_code=400, detail="Key reveal not supported (schema outdated)")

    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Key not found")
        
    if row["user_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if not row["raw_key"]:
        raise HTTPException(status_code=400, detail="This key cannot be revealed (it is legacy or hashed only)")
        
    return {"key": row["raw_key"]}
