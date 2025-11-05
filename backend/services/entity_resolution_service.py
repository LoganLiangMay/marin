"""
Entity Resolution Service for deduplication and contact management.

This service uses fuzzy string matching to identify and merge duplicate entities
across multiple calls, creating canonical entity records (Story 3.3).
"""

import logging
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from rapidfuzz import fuzz, process
from pymongo import MongoClient
from core.config import settings
from models.entity import (
    CanonicalEntity,
    EntityOccurrence,
    EntityMatch,
    EntityResolutionResult,
    EntityType
)

logger = logging.getLogger(__name__)


class EntityResolutionService:
    """
    Service for resolving and deduplicating entities across calls.

    Uses fuzzy string matching (rapidfuzz) to identify similar entities
    and maintain canonical entity records in MongoDB.
    """

    def __init__(
        self,
        similarity_threshold: float = 85.0,
        mongo_uri: Optional[str] = None,
        database_name: Optional[str] = None
    ):
        """
        Initialize entity resolution service.

        Args:
            similarity_threshold: Minimum similarity score for fuzzy matching (0-100)
            mongo_uri: MongoDB connection URI (defaults to settings)
            database_name: Database name (defaults to settings)
        """
        self.similarity_threshold = similarity_threshold
        self.mongo_uri = mongo_uri or settings.mongodb_uri
        self.database_name = database_name or settings.mongodb_database

    def resolve_entities_for_call(
        self,
        call_id: str,
        extracted_entities: List[Dict[str, Any]]
    ) -> EntityResolutionResult:
        """
        Resolve entities for a single call.

        This method:
        1. Retrieves existing canonical entities from database
        2. Matches extracted entities using fuzzy matching
        3. Creates new canonical entities for unmatched entities
        4. Updates entity occurrence records
        5. Returns resolution result

        Args:
            call_id: Call identifier
            extracted_entities: List of entities from AI analysis

        Returns:
            EntityResolutionResult with resolution statistics and mappings
        """
        start_time = datetime.utcnow()
        mongo_client = None

        try:
            mongo_client = MongoClient(self.mongo_uri)
            db = mongo_client[self.database_name]
            entities_collection = db.entities

            entity_mappings = []
            new_entities_created = 0
            resolved_count = 0

            logger.info(
                "Starting entity resolution",
                extra={
                    'call_id': call_id,
                    'raw_entities_count': len(extracted_entities)
                }
            )

            for entity in extracted_entities:
                entity_name = entity.get('name', '').strip()
                entity_type = entity.get('type', EntityType.OTHER)
                mentions = entity.get('mentions', 1)
                context = entity.get('context')

                if not entity_name:
                    continue

                # Find or create canonical entity
                canonical_entity, match_info = self._find_or_create_canonical_entity(
                    entities_collection=entities_collection,
                    entity_name=entity_name,
                    entity_type=entity_type,
                    call_id=call_id,
                    mentions=mentions,
                    context=context
                )

                if match_info['is_new']:
                    new_entities_created += 1
                else:
                    resolved_count += 1

                # Track the mapping
                entity_mappings.append({
                    'raw_name': entity_name,
                    'canonical_id': canonical_entity['entity_id'],
                    'canonical_name': canonical_entity['canonical_name'],
                    'entity_type': entity_type,
                    'similarity_score': match_info['similarity_score'],
                    'match_method': match_info['match_method']
                })

                logger.debug(
                    "Entity resolved",
                    extra={
                        'call_id': call_id,
                        'raw_name': entity_name,
                        'canonical_name': canonical_entity['canonical_name'],
                        'match_method': match_info['match_method'],
                        'similarity': match_info['similarity_score']
                    }
                )

            processing_time = (datetime.utcnow() - start_time).total_seconds()

            result = EntityResolutionResult(
                call_id=call_id,
                raw_entities_count=len(extracted_entities),
                resolved_entities_count=resolved_count,
                new_entities_created=new_entities_created,
                entity_mappings=entity_mappings,
                processing_time_seconds=processing_time,
                confidence_scores={
                    mapping['raw_name']: mapping['similarity_score']
                    for mapping in entity_mappings
                }
            )

            logger.info(
                "Entity resolution completed",
                extra={
                    'call_id': call_id,
                    'raw_entities': len(extracted_entities),
                    'resolved': resolved_count,
                    'new': new_entities_created,
                    'processing_time': round(processing_time, 2)
                }
            )

            return result

        finally:
            if mongo_client:
                mongo_client.close()

    def _find_or_create_canonical_entity(
        self,
        entities_collection,
        entity_name: str,
        entity_type: str,
        call_id: str,
        mentions: int = 1,
        context: Optional[str] = None
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Find matching canonical entity or create new one.

        Args:
            entities_collection: MongoDB collection
            entity_name: Entity name to resolve
            entity_type: Entity type
            call_id: Call ID
            mentions: Number of mentions
            context: Entity context

        Returns:
            Tuple of (canonical_entity_dict, match_info_dict)
        """
        # Normalize entity name
        normalized_name = self._normalize_entity_name(entity_name)

        # Try exact match first
        existing_entity = entities_collection.find_one({
            'canonical_name': normalized_name,
            'entity_type': entity_type
        })

        if existing_entity:
            # Exact match found - update occurrence
            self._add_entity_occurrence(
                entities_collection=entities_collection,
                entity_id=existing_entity['entity_id'],
                call_id=call_id,
                raw_name=entity_name,
                entity_type=entity_type,
                mentions=mentions,
                context=context
            )

            return existing_entity, {
                'is_new': False,
                'similarity_score': 100.0,
                'match_method': 'exact'
            }

        # Try fuzzy match
        fuzzy_match = self._fuzzy_match_entity(
            entities_collection=entities_collection,
            entity_name=normalized_name,
            entity_type=entity_type
        )

        if fuzzy_match:
            matched_entity, similarity_score = fuzzy_match

            # Update occurrence for fuzzy matched entity
            self._add_entity_occurrence(
                entities_collection=entities_collection,
                entity_id=matched_entity['entity_id'],
                call_id=call_id,
                raw_name=entity_name,
                entity_type=entity_type,
                mentions=mentions,
                context=context
            )

            # Add as alias if not already present
            if entity_name.lower() not in [a.lower() for a in matched_entity.get('aliases', [])]:
                entities_collection.update_one(
                    {'entity_id': matched_entity['entity_id']},
                    {
                        '$addToSet': {'aliases': entity_name},
                        '$set': {'updated_at': datetime.utcnow()}
                    }
                )

            return matched_entity, {
                'is_new': False,
                'similarity_score': similarity_score,
                'match_method': 'fuzzy'
            }

        # No match - create new canonical entity
        new_entity = self._create_canonical_entity(
            entities_collection=entities_collection,
            entity_name=normalized_name,
            entity_type=entity_type,
            call_id=call_id,
            raw_name=entity_name,
            mentions=mentions,
            context=context
        )

        return new_entity, {
            'is_new': True,
            'similarity_score': 100.0,
            'match_method': 'new'
        }

    def _fuzzy_match_entity(
        self,
        entities_collection,
        entity_name: str,
        entity_type: str
    ) -> Optional[Tuple[Dict[str, Any], float]]:
        """
        Find best fuzzy match for entity name.

        Args:
            entities_collection: MongoDB collection
            entity_name: Normalized entity name
            entity_type: Entity type to match

        Returns:
            Tuple of (matched_entity, similarity_score) or None
        """
        # Get all entities of the same type
        existing_entities = list(entities_collection.find({'entity_type': entity_type}))

        if not existing_entities:
            return None

        # Build list of names to match against (canonical + aliases)
        choices = []
        entity_map = {}

        for entity in existing_entities:
            canonical = entity['canonical_name']
            choices.append(canonical)
            entity_map[canonical] = entity

            # Also check aliases
            for alias in entity.get('aliases', []):
                normalized_alias = self._normalize_entity_name(alias)
                choices.append(normalized_alias)
                entity_map[normalized_alias] = entity

        # Use rapidfuzz to find best match
        result = process.extractOne(
            entity_name,
            choices,
            scorer=fuzz.token_sort_ratio
        )

        if result:
            best_match, score, _ = result

            if score >= self.similarity_threshold:
                matched_entity = entity_map[best_match]
                logger.debug(
                    "Fuzzy match found",
                    extra={
                        'query': entity_name,
                        'match': best_match,
                        'canonical': matched_entity['canonical_name'],
                        'score': score
                    }
                )
                return matched_entity, score

        return None

    def _create_canonical_entity(
        self,
        entities_collection,
        entity_name: str,
        entity_type: str,
        call_id: str,
        raw_name: str,
        mentions: int = 1,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create new canonical entity.

        Args:
            entities_collection: MongoDB collection
            entity_name: Normalized entity name
            entity_type: Entity type
            call_id: Call ID
            raw_name: Original entity name
            mentions: Number of mentions
            context: Entity context

        Returns:
            Created entity document
        """
        entity_id = str(uuid.uuid4())
        now = datetime.utcnow()

        occurrence = {
            'call_id': call_id,
            'raw_name': raw_name,
            'entity_type': entity_type,
            'mentions': mentions,
            'context': context,
            'extracted_at': now
        }

        entity = {
            'entity_id': entity_id,
            'canonical_name': entity_name,
            'entity_type': entity_type,
            'aliases': [raw_name] if raw_name != entity_name else [],
            'email': None,
            'phone': None,
            'company': None,
            'title': None,
            'metadata': {},
            'first_seen': now,
            'last_seen': now,
            'total_mentions': mentions,
            'call_count': 1,
            'occurrences': [occurrence],
            'created_at': now,
            'updated_at': now
        }

        entities_collection.insert_one(entity)

        logger.info(
            "Created new canonical entity",
            extra={
                'entity_id': entity_id,
                'canonical_name': entity_name,
                'entity_type': entity_type
            }
        )

        return entity

    def _add_entity_occurrence(
        self,
        entities_collection,
        entity_id: str,
        call_id: str,
        raw_name: str,
        entity_type: str,
        mentions: int = 1,
        context: Optional[str] = None
    ):
        """
        Add new occurrence to existing canonical entity.

        Args:
            entities_collection: MongoDB collection
            entity_id: Canonical entity ID
            call_id: Call ID
            raw_name: Original entity name
            entity_type: Entity type
            mentions: Number of mentions
            context: Entity context
        """
        occurrence = {
            'call_id': call_id,
            'raw_name': raw_name,
            'entity_type': entity_type,
            'mentions': mentions,
            'context': context,
            'extracted_at': datetime.utcnow()
        }

        # Update entity with new occurrence
        entities_collection.update_one(
            {'entity_id': entity_id},
            {
                '$push': {'occurrences': occurrence},
                '$set': {
                    'last_seen': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                },
                '$inc': {
                    'total_mentions': mentions,
                    'call_count': 1
                }
            }
        )

        logger.debug(
            "Added entity occurrence",
            extra={'entity_id': entity_id, 'call_id': call_id}
        )

    def _normalize_entity_name(self, name: str) -> str:
        """
        Normalize entity name for consistent matching.

        Args:
            name: Raw entity name

        Returns:
            Normalized name
        """
        # Basic normalization
        normalized = name.strip()

        # Title case for person names
        # Keep uppercase for likely acronyms (e.g., "IBM", "AWS")
        if len(normalized) <= 5 and normalized.isupper():
            return normalized  # Keep acronyms as-is

        # Title case for longer names
        return normalized.title()

    def get_entity_stats(self) -> Dict[str, Any]:
        """
        Get statistics about entities in the system.

        Returns:
            Dict with entity statistics
        """
        mongo_client = None

        try:
            mongo_client = MongoClient(self.mongo_uri)
            db = mongo_client[self.database_name]
            entities_collection = db.entities

            total_entities = entities_collection.count_documents({})

            # Count by type
            pipeline = [
                {
                    '$group': {
                        '_id': '$entity_type',
                        'count': {'$sum': 1}
                    }
                }
            ]
            entities_by_type = {
                doc['_id']: doc['count']
                for doc in entities_collection.aggregate(pipeline)
            }

            # Total mentions
            total_mentions_result = list(entities_collection.aggregate([
                {'$group': {'_id': None, 'total': {'$sum': '$total_mentions'}}}
            ]))
            total_mentions = total_mentions_result[0].get('total', 0) if total_mentions_result else 0

            # Most mentioned entities
            most_mentioned = list(entities_collection.find(
                {},
                {'canonical_name': 1, 'entity_type': 1, 'total_mentions': 1, 'call_count': 1}
            ).sort('total_mentions', -1).limit(10))

            return {
                'total_entities': total_entities,
                'entities_by_type': entities_by_type,
                'total_mentions': total_mentions,
                'most_mentioned_entities': [
                    {
                        'name': e['canonical_name'],
                        'type': e['entity_type'],
                        'mentions': e['total_mentions'],
                        'calls': e['call_count']
                    }
                    for e in most_mentioned
                ]
            }

        finally:
            if mongo_client:
                mongo_client.close()


# Singleton instance
_entity_resolution_service = None


def get_entity_resolution_service() -> EntityResolutionService:
    """
    Get singleton entity resolution service instance.

    Returns:
        EntityResolutionService: Configured service instance
    """
    global _entity_resolution_service
    if _entity_resolution_service is None:
        _entity_resolution_service = EntityResolutionService()
    return _entity_resolution_service
