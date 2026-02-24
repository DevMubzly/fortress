from backend.database import get_db_connection
from backend.utils import get_password_hash, verify_password, validate_password_strength
from backend.models.models import User, UserCreate
from typing import Optional, List
from datetime import datetime
import sqlite3

class UserService:
    def create_admin_user(self, user_data: UserCreate) -> User:
        return self.create_user(user_data, role="admin", provider="local")

    def has_any_users(self) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM users LIMIT 1")
        exists = cursor.fetchone() is not None
        conn.close()
        return exists


    def create_user(self, user_data: UserCreate, role: str = "user", provider: str = "local") -> User:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        hashed_password = get_password_hash(user_data.password)
        
        cursor.execute("INSERT INTO users (username, email, password_hash, full_name, role, auth_provider) VALUES (?, ?, ?, ?, ?, ?)",
                       (user_data.username, user_data.email, hashed_password, user_data.full_name, role, provider))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # When creating the User object from pydantic, we need to supply all required fields.
        # created_at is handled by DB DEFAULT CURRENT_TIMESTAMP, but Pydantic doesn't know that unless we read it back or supply it.
        # Simplest is to supply current time for the response object.
        return User(
            **user_data.dict(exclude={"password"}), 
            id=user_id, 
            active=True, 
            must_change_password=False,
            created_at=datetime.utcnow(),
            last_login=None
        )

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, username))
        row = cursor.fetchone()
        
        if row and verify_password(password, row["password_hash"]):
            return User(**row)
        
        conn.close()
        return None

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return User(**row)
        return None

    def get_user_by_username(self, username: str) -> Optional[User]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return User(**row)
        return None

    def get_user_by_email(self, email: str) -> Optional[User]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return User(**row)
        return None

    def update_user_password(self, username: str, password: str) -> Optional[User]:
        hashed_password = get_password_hash(password)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password_hash = ? WHERE username = ? OR email = ?", (hashed_password, username, username))
        conn.commit()
        
        # Return updated user. We need a new cursor because the previous one was used for update? No, but let's clear it.
        # Actually standard practice is to reuse or just execute.
        cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, username))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return User(**row)
        return None

    def get_user_by_username(self, username: str) -> Optional[User]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return User(**row)
        return None

    def update_password(self, user_id: int, new_password: str):
        hashed_password = get_password_hash(new_password)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?", (hashed_password, user_id))
        conn.commit()
        conn.close()

    def update_user_status(self, user_id: int, active: bool):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET active = ? WHERE id = ?", (1 if active else 0, user_id))
        conn.commit()
        conn.close()

    def update_user_role(self, user_id: int, role: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
        conn.commit()
        conn.close()

    def delete_user(self, user_id: int):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()

    def list_users(self) -> List[User]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users")
        rows = cursor.fetchall()
        conn.close()
        return [User(**row) for row in rows]

user_service = UserService()
