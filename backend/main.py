import sys
import os

# Add parent directory to path so 'backend' package can be imported when running from 'backend' dir
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, setup, system, models, apikeys, stats, users, chat, audit
from backend.database import init_db

# Initialize database
init_db()

app = FastAPI(title="Fortress API")
app.include_router(audit.router, prefix="/api")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(setup.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(system.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(apikeys.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Fortress API"}
