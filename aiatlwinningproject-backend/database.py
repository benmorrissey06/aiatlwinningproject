"""MongoDB database connection and configuration."""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://architlakhani20_db_user:nz1Dy6JXCmSvbaIj@flashrequest.gn6q8bx.mongodb.net/?appName=FlashRequest"
)
DB_NAME = os.getenv("DB_NAME", "flashrequest")

# Global client and database instances
client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Connect to MongoDB database."""
    global client, db
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DB_NAME]
        # Test connection
        await client.admin.command('ping')
        print(f'[OK] MongoDB Connected: {DB_NAME} Database')
        return db
    except Exception as e:
        print(f'[WARNING] MongoDB connection error: {e}')
        print('[WARNING] Continuing without MongoDB - some features may not work')
        # Don't raise - allow app to start without DB for development
        return None


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print('MongoDB connection closed')


def get_db():
    """Get database instance."""
    if db is None:
        # Try to reconnect if not connected
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is running, we're in an async context
                pass
            else:
                loop.run_until_complete(connect_db())
        except Exception:
            pass
        if db is None:
            raise RuntimeError("Database not initialized. MongoDB connection failed. Please check your connection string.")
    return db
