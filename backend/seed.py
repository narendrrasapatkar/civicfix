import asyncio
from database import AsyncSessionLocal
from models.complaint import Department
from sqlalchemy import select

DEFAULT_DEPARTMENTS = [
    {"name": "Roads & Infrastructure", "description": "Potholes, broken footpaths, road hazards"},
    {"name": "Sanitation & Waste", "description": "Garbage overflow, street sweeping, dump yards"},
    {"name": "Electrical & Lighting", "description": "Non-functional streetlights, dangling wires"},
    {"name": "Water Supply & Drainage", "description": "Pipeline bursts, contaminated water, clogged drains"}
]

async def seed():
    async with AsyncSessionLocal() as session:
        for dept_data in DEFAULT_DEPARTMENTS:
            stmt = select(Department).where(Department.name == dept_data["name"])
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            if not existing:
                dept = Department(name=dept_data["name"], description=dept_data["description"])
                session.add(dept)
        await session.commit()
        print("Default municipal departments seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed())