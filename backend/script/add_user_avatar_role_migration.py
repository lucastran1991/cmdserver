#!/usr/bin/env python3
import asyncio
import sys
import os

# Add the parent directory to the path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db import engine, async_session_maker


async def migrate_user_table():
    print("Adding 'full_name', 'avatar' and 'role' columns to User table...")

    async with engine.begin() as conn:
        # Check if full_name column exists
        result = await conn.execute(text(
            "SELECT name FROM pragma_table_info('user') WHERE name='full_name'"
        ))
        full_name_exists = result.fetchone() is not None

        # Check if avatar column exists
        result = await conn.execute(text(
            "SELECT name FROM pragma_table_info('user') WHERE name='avatar'"
        ))
        avatar_exists = result.fetchone() is not None
        
        # Check if role column exists
        result = await conn.execute(text(
            "SELECT name FROM pragma_table_info('user') WHERE name='role'"
        ))
        role_exists = result.fetchone() is not None

        # Add full_name column if it doesn't exist
        if not full_name_exists:
            await conn.execute(text(
                "ALTER TABLE user ADD COLUMN full_name VARCHAR NOT NULL DEFAULT 'user'"
            ))
            print("✓ Added 'full_name' column to user table")
        else:
            print("- 'full_name' column already exists")
            
        # Add avatar column if it doesn't exist
        if not avatar_exists:
            await conn.execute(text(
                "ALTER TABLE user ADD COLUMN avatar VARCHAR"
            ))
            print("✓ Added 'avatar' column to user table")
        else:
            print("- 'avatar' column already exists")
        
        # Add role column if it doesn't exist
        if not role_exists:
            await conn.execute(text(
                "ALTER TABLE user ADD COLUMN role VARCHAR NOT NULL DEFAULT 'user'"
            ))
            print("✓ Added 'role' column to user table")
        else:
            print("- 'role' column already exists")
        
        await conn.commit()


async def main():
    print("Starting User table migration...")
    print("Adding 'full_name', 'avatar' and 'role' columns to User table...")

    try:
        await migrate_user_table()
        print("✓ Migration completed successfully!")
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
