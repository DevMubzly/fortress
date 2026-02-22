from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from backend.services.user_service import UserService
from backend.services.session_service import SessionService
from backend.models.models import User, Session
from backend.dependencies import deps

router = APIRouter(prefix="/auth", tags=["auth"])
user_service = UserService()
session_service = SessionService()

@router.post("/token")
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    user = user_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Session handling
    client_host = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    token = session_service.create_session(user.id, client_host, user_agent)
    
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(deps.get_current_user)):
    return current_user

@router.post("/logout")
async def logout(request: Request, current_user: User = Depends(deps.get_current_user)):
    # Extract token from header
    authorization = request.headers.get("Authorization")
    if authorization:
        scheme, token = authorization.split()
        if scheme.lower() == "bearer":
             session_service.destroy_session(token)
    return {"detail": "Logged out"}

