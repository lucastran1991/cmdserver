#!/usr/bin/env python3
"""
Migration script to add avatar and role columns to the User table.
Run this script after updating the User model to add the new fields.
"""

import asyncio
import sys
import os

# Add the parent directory to the path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db import engine, async_session_maker


async def migrate_user_table():
    """Add avatar and role columns to the user table if they don't exist."""
    
    async with engine.begin() as conn:
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
    """Run the migration."""
    print("Starting User table migration...")
    print("Adding 'avatar' and 'role' columns to User table...")
    
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
