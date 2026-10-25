import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base

class UserRole(str, enum.Enum):
    CITIZEN = "citizen"
    ADMIN = "admin"

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "Submitted"
    VERIFIED = "Verified"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    REJECTED = "Rejected"

class PriorityLevel(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.CITIZEN, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="creator")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    complaints = relationship("Complaint", back_populates="department")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(20), unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(80), nullable=False)
    location = Column(String(255), nullable=False)
    image_url = Column(String(255), nullable=True)
    
    status = Column(SQLEnum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False)
    priority = Column(SQLEnum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="complaints")
    department = relationship("Department", back_populates="complaints")
    resolution = relationship("Resolution", back_populates="complaint", uselist=False)

class Resolution(Base):
    __tablename__ = "resolutions"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), unique=True, nullable=False)
    notes = Column(Text, nullable=False)
    resolution_image_url = Column(String(255), nullable=True)
    resolved_by = Column(String(100), nullable=False)
    resolved_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="resolution")