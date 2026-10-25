from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.complaint import ComplaintStatus, PriorityLevel

class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    location: str
    image_url: Optional[str] = None
    priority: Optional[PriorityLevel] = PriorityLevel.MEDIUM

class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True

class ResolutionResponse(BaseModel):
    id: int
    notes: str
    resolution_image_url: Optional[str]
    resolved_by: str
    resolved_at: datetime

    class Config:
        from_attributes = True

class ComplaintResponse(BaseModel):
    id: int
    ticket_id: str
    title: str
    description: str
    category: str
    location: str
    image_url: Optional[str]
    status: ComplaintStatus
    priority: PriorityLevel
    user_id: int
    department_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    department: Optional[DepartmentResponse] = None
    resolution: Optional[ResolutionResponse] = None

    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: ComplaintStatus
    department_id: Optional[int] = None
    priority: Optional[PriorityLevel] = None

class ResolutionCreate(BaseModel):
    notes: str
    resolution_image_url: Optional[str] = None