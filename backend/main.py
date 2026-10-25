import os
import shutil
import uuid
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from sqlalchemy.orm import selectinload

from database import engine, Base, get_db
import models.complaint
from models.complaint import User, Complaint, Department, Resolution, ComplaintStatus, PriorityLevel
from schemas.auth import UserCreate, UserResponse, TokenResponse
from schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    StatusUpdate,
    ResolutionCreate,
    DepartmentResponse
)
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    require_admin
)

# Ensure upload directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="CivicFix API",
    description="Civic Complaint Management and Analytics Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded media statically
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

def generate_ticket_id() -> str:
    suffix = uuid.uuid4().hex[:6].upper()
    return f"CF-2026-{suffix}"

@app.get("/")
async def root():
    return {
        "project": "CivicFix",
        "status": "Online",
        "message": "Civic Complaint Management API is operational"
    }

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "provider": "Neon Cloud PostgreSQL"
        }
    except Exception as e:
        return {
            "status": "degraded",
            "database": "disconnected",
            "error": str(e)
        }

# --- File / Media Upload Endpoint ---

@app.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported format. Only JPG, PNG, WEBP images and MP4, MOV, WEBM videos are allowed."
        )

    file_ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "file_url": f"http://127.0.0.1:8000/uploads/{unique_filename}",
        "media_type": "video" if "video" in file.content_type else "image"
    }

# --- Authentication Routes ---

@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email is already registered")

    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@app.post("/auth/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name
    }

@app.get("/auth/me", response_model=UserResponse)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

# --- Department Routes ---

@app.get("/departments", response_model=List[DepartmentResponse])
async def list_departments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department))
    return result.scalars().all()

# --- Complaint Routes ---

@app.post("/complaints", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_complaint = Complaint(
        ticket_id=generate_ticket_id(),
        title=payload.title,
        description=payload.description,
        category=payload.category,
        location=payload.location,
        image_url=payload.image_url,
        priority=payload.priority,
        user_id=current_user.id,
        status=ComplaintStatus.SUBMITTED
    )
    db.add(new_complaint)
    await db.commit()

    # Eager load relationships so Pydantic serialization succeeds without 500 error
    stmt = (
        select(Complaint)
        .where(Complaint.id == new_complaint.id)
        .options(selectinload(Complaint.department), selectinload(Complaint.resolution))
    )
    result = await db.execute(stmt)
    return result.scalar_one()

@app.get("/complaints/my", response_model=List[ComplaintResponse])
async def get_my_complaints(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Complaint)
        .where(Complaint.user_id == current_user.id)
        .options(selectinload(Complaint.department), selectinload(Complaint.resolution))
        .order_by(Complaint.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

# --- Admin Routes ---

@app.get("/admin/complaints", response_model=List[ComplaintResponse])
async def get_all_complaints(
    status_filter: Optional[ComplaintStatus] = None,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Complaint)
        .options(selectinload(Complaint.department), selectinload(Complaint.resolution))
        .order_by(Complaint.created_at.desc())
    )
    if status_filter:
        stmt = stmt.where(Complaint.status == status_filter)
    result = await db.execute(stmt)
    return result.scalars().all()

@app.patch("/admin/complaints/{complaint_id}/status", response_model=ComplaintResponse)
async def update_complaint_status(
    complaint_id: int,
    payload: StatusUpdate,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Complaint)
        .where(Complaint.id == complaint_id)
        .options(selectinload(Complaint.department), selectinload(Complaint.resolution))
    )
    result = await db.execute(stmt)
    complaint = result.scalar_one_or_none()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = payload.status
    if payload.department_id is not None:
        complaint.department_id = payload.department_id
    if payload.priority is not None:
        complaint.priority = payload.priority

    await db.commit()
    await db.refresh(complaint)
    return complaint

@app.post("/admin/complaints/{complaint_id}/resolve", response_model=ComplaintResponse)
async def resolve_complaint(
    complaint_id: int,
    payload: ResolutionCreate,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Complaint)
        .where(Complaint.id == complaint_id)
        .options(selectinload(Complaint.department), selectinload(Complaint.resolution))
    )
    result = await db.execute(stmt)
    complaint = result.scalar_one_or_none()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    resolution = Resolution(
        complaint_id=complaint.id,
        notes=payload.notes,
        resolution_image_url=payload.resolution_image_url,
        resolved_by=current_admin.full_name
    )
    db.add(resolution)
    complaint.status = ComplaintStatus.RESOLVED

    await db.commit()
    await db.refresh(complaint)
    return complaint

# --- Analytics Route ---

@app.get("/admin/analytics")
async def get_analytics(
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    all_complaints = await db.execute(select(Complaint))
    complaints = all_complaints.scalars().all()

    total = len(complaints)
    resolved = sum(1 for c in complaints if c.status == ComplaintStatus.RESOLVED)
    in_progress = sum(1 for c in complaints if c.status == ComplaintStatus.IN_PROGRESS)
    pending = sum(
        1 for c in complaints
        if c.status in [ComplaintStatus.SUBMITTED, ComplaintStatus.VERIFIED, ComplaintStatus.ASSIGNED]
    )

    category_counts = {}
    for c in complaints:
        category_counts[c.category] = category_counts.get(c.category, 0) + 1

    return {
        "summary": {
            "total_complaints": total,
            "resolved": resolved,
            "in_progress": in_progress,
            "pending": pending
        },
        "by_category": category_counts
    }