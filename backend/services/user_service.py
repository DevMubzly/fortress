from backend.database import get_db_connection
from backend.utils import get_password_hash, verify_password, validate_password_strength
from backend.models.models import User, UserCreate
from typing import Optional, List
import sqlite3

class UserService:
    def create_admin_user(self, user_data: UserCreate) -> User:
        return self.create_user(user_data, role="admin", provider="local")

    def create_user(self, user_data: UserCreate, role: str = "user", provider: str = "local") -> User:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        hashed_password = get_password_hash(user_data.password)
        
        cursor.execute("INSERT INTO users (username, email, password_hash, full_name, role, auth_provider) VALUES (?, ?, ?, ?, ?, ?)",
                       (user_data.username, user_data.email, hashed_password, user_data.full_name, role, provider))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return User(**user_data.dict(exclude={"password"}), id=user_id, active=True, must_change_password=False)

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

    def update_password(self, user_id: int, new_password: str):
        hashed_password = get_password_hash(new_password)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?", (hashed_password, user_id))
        conn.commit()
        conn.close()

    def deactivate_user(self, user_id: int):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET active = 0 WHERE id = ?", (user_id,))
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
