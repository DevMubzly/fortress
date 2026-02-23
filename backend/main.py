from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, setup, system
from backend.database import init_db

# Initialize database
init_db()

app = FastAPI(title="Fortress API")

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

@app.get("/")
def read_root():
    return {"message": "Fortress API"}
