import sys
import asyncio
from app.database import engine, Base
import app.models  # Ensure all ORM models are registered with Base.metadata

async def main():
    print("Step 1: Creating database tables...", flush=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Step 2: Tables created successfully!", flush=True)

    print("Step 3: Seeding database...", flush=True)
    from app.seed_data import seed_database_if_needed
    await seed_database_if_needed()
    print("Step 4: Seeding finished successfully!", flush=True)

    await engine.dispose()
    print("Step 5: Engine disposed.", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
