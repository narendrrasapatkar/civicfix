import os
import shutil
import uuid
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx

import auth
from database import Base, engine
from models import complaint as complaint_models
from schemas import complaint as complaint_schemas

app = FastAPI(title="CivicFix Municipal Redressal Engine")

# Async database initialization on startup
@app.on_event("startup")
async def init_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Ensure persistent uploads folder exists
os.makedirs("uploads", exist_ok=True)

# Mount uploads static folder so frontend can load evidence images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS middleware to allow cross-origin requests from Vercel and partner sites
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Authentication & Complaint API Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

if hasattr(complaint_models, "router"):
    app.include_router(complaint_models.router, prefix="/api", tags=["Grievances"])


@app.get("/")
def health_check():
    return {"status": "healthy", "service": "CivicFix API", "version": "1.0.0"}


# =========================================================================
# INTER-SERVICE IMAGE EXCHANGE (CIVICFIX <-> BUILDWISE)
# =========================================================================

BUILDWISE_UPLOAD_URL = "https://buildwise-backend-ylo3.onrender.com/api/civic/upload"


# TASK 1: SEND IMAGE FROM CIVICFIX TO BUILDWISE
@app.post("/api/external/send-image", tags=["Inter-Service Image Collaboration"])
async def send_image_to_buildwise(
    file: UploadFile = File(...),
    ticket_id: Optional[str] = Form(None),
    target_url: Optional[str] = Form(None),
):
    """Dispatches an image directly from CivicFix to BuildWise's server endpoint."""
    dest_url = target_url or BUILDWISE_UPLOAD_URL
    file_bytes = await file.read()

    files = {
        "file": (file.filename, file_bytes, file.content_type or "image/png")
    }
    data = {
        "ticket_id": ticket_id or "CF-2026-LIVE"
    }

    try:
        async with httpx.AsyncClient(timeout=35.0) as client:
            response = await client.post(dest_url, files=files, data=data)

            if response.status_code in [200, 201]:
                return response.json()

            raise HTTPException(
                status_code=response.status_code,
                detail=f"BuildWise returned status {response.status_code}: {response.text}",
            )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to communicate with BuildWise server: {str(e)}",
        )


# TASK 2: RECEIVE IMAGE FROM BUILDWISE (OR ANY EXTERNAL APP) TO CIVICFIX
@app.post("/api/external/receive-image", tags=["Inter-Service Image Collaboration"])
async def receive_image_from_buildwise(
    file: UploadFile = File(...), 
    ticket_id: Optional[str] = Form(None)
):
    """Accepts an image sent from BuildWise, saves it to CivicFix /uploads,
    and returns the public accessible URL.
    """
    os.makedirs("uploads", exist_ok=True)

    ext = os.path.splitext(file.filename)[1] or ".png"
    unique_name = f"buildwise_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join("uploads", unique_name)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "status": "success",
        "message": "File received and stored successfully on CivicFix server",
        "filename": unique_name,
        "file_url": f"https://civicfix-t3mx.onrender.com/uploads/{unique_name}",
        "ticket_id": ticket_id or "CF-EXTERNAL",
        "media_type": "image",
    }