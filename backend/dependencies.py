from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from backend.services.session_service import SessionService
from backend.services.user_service import UserService
from backend.models.models import User
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class Dependencies:
    def get_current_user(self, token: str = Depends(oauth2_scheme)) -> User:
        user_id = SessionService().validate_session(token)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = UserService().get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user

deps = Dependencies()
