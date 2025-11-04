"""
Database service for MongoDB operations.
Handles CRUD operations for calls, contacts, and insights.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)


class DBService:
    """Service for MongoDB operations."""

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize database service.

        Args:
            db: MongoDB database instance
        """
        self.db = db
        self.calls_collection = db.calls
        self.contacts_collection = db.contacts
        self.insights_collection = db.insights_aggregated

    async def create_call(self, call_data: Dict[str, Any]) -> str:
        """
        Create a new call record.

        Args:
            call_data: Call data dictionary

        Returns:
            Inserted call ID
        """
        call_data['created_at'] = datetime.utcnow()
        call_data['updated_at'] = datetime.utcnow()

        result = await self.calls_collection.insert_one(call_data)
        logger.info(f"Created call record: {result.inserted_id}")
        return str(result.inserted_id)

    async def get_call(self, call_id: str) -> Optional[Dict[str, Any]]:
        """
        Get call by ID.

        Args:
            call_id: Call ID

        Returns:
            Call data or None if not found
        """
        return await self.calls_collection.find_one({"call_id": call_id})

    async def update_call(
        self,
        call_id: str,
        update_data: Dict[str, Any]
    ) -> bool:
        """
        Update call record.

        Args:
            call_id: Call ID
            update_data: Data to update

        Returns:
            True if updated, False if not found
        """
        update_data['updated_at'] = datetime.utcnow()

        result = await self.calls_collection.update_one(
            {"call_id": call_id},
            {"$set": update_data}
        )

        if result.modified_count > 0:
            logger.info(f"Updated call: {call_id}")
            return True
        return False

    async def list_calls(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List calls with pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by status (optional)

        Returns:
            List of call records
        """
        query = {}
        if status:
            query['status'] = status

        cursor = self.calls_collection.find(query).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_call_count(self, status: Optional[str] = None) -> int:
        """
        Get total count of calls.

        Args:
            status: Filter by status (optional)

        Returns:
            Total count
        """
        query = {}
        if status:
            query['status'] = status

        return await self.calls_collection.count_documents(query)


def get_db_service(db: AsyncIOMotorDatabase) -> DBService:
    """
    Factory function to create DBService instance.

    Args:
        db: MongoDB database instance

    Returns:
        DBService instance
    """
    return DBService(db)
