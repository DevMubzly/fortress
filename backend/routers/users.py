from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from backend.services.user_service import UserService
from backend.models.models import User, UserCreate
from backend.dependencies import deps

router = APIRouter(prefix="/users", tags=["users"])
user_service = UserService()

class UserStatusUpdate(BaseModel):
    active: bool

class UserRoleUpdate(BaseModel):
    role: str

@router.get("/", response_model=List[User])
async def list_users(current_user: User = Depends(deps.get_current_admin_user)):
    return user_service.list_users()

@router.post("/", response_model=User)
async def create_user(user_in: UserCreate, current_user: User = Depends(deps.get_current_admin_user)):
    existing_user = user_service.get_user_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return user_service.create_user(user_in)

@router.put("/{user_id}/status", response_model=dict)
async def update_user_status(user_id: int, status_update: UserStatusUpdate, current_user: User = Depends(deps.get_current_admin_user)):
    user = user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_service.update_user_status(user_id, status_update.active)
    return {"message": f"User {'activated' if status_update.active else 'deactivated'} successfully"}

@router.put("/{user_id}/role", response_model=dict)
async def update_user_role(user_id: int, role_update: UserRoleUpdate, current_user: User = Depends(deps.get_current_admin_user)):
    user = user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    valid_roles = ["admin", "manager", "analyst", "user"]
    if role_update.role not in valid_roles:
         raise HTTPException(status_code=400, detail="Invalid role")

    user_service.update_user_role(user_id, role_update.role)
    return {"message": f"User role updated to {role_update.role}"}

@router.delete("/{user_id}")
async def delete_user(user_id: int, current_user: User = Depends(deps.get_current_admin_user)):
    user = user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    user_service.delete_user(user_id)
    return {"message": "User deleted successfully"}
