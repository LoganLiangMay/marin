"""
Unit tests for entity resolution service.

Tests fuzzy matching, entity deduplication, and canonical entity management.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime
from services.entity_resolution_service import EntityResolutionService
from models.entity import (
    CanonicalEntity,
    EntityOccurrence,
    EntityResolutionResult,
    EntityType
)


@pytest.fixture
def sample_entities():
    """Sample extracted entities for testing."""
    return [
        {
            'name': 'John Smith',
            'type': EntityType.PERSON,
            'mentions': 3,
            'context': 'Sales representative'
        },
        {
            'name': 'Acme Corporation',
            'type': EntityType.COMPANY,
            'mentions': 5,
            'context': 'Customer company'
        },
        {
            'name': 'Salesforce',
            'type': EntityType.PRODUCT,
            'mentions': 2,
            'context': 'CRM platform'
        }
    ]


@pytest.fixture
def duplicate_entities():
    """Sample entities with duplicates for testing fuzzy matching."""
    return [
        {'name': 'John Smith', 'type': EntityType.PERSON, 'mentions': 1},
        {'name': 'john smith', 'type': EntityType.PERSON, 'mentions': 1},
        {'name': 'J. Smith', 'type': EntityType.PERSON, 'mentions': 1},
        {'name': 'Jon Smith', 'type': EntityType.PERSON, 'mentions': 1},  # Typo
        {'name': 'Acme Corp', 'type': EntityType.COMPANY, 'mentions': 2},
        {'name': 'ACME Corporation', 'type': EntityType.COMPANY, 'mentions': 3},
    ]


@pytest.fixture
def mock_mongo_collection():
    """Mock MongoDB collection."""
    collection = MagicMock()
    return collection


class TestEntityResolutionService:
    """Test suite for EntityResolutionService."""

    def test_service_initialization(self):
        """Test service can be initialized."""
        service = EntityResolutionService(similarity_threshold=85.0)
        assert service.similarity_threshold == 85.0

    def test_normalize_entity_name(self):
        """Test entity name normalization."""
        service = EntityResolutionService()

        # Test title case conversion
        assert service._normalize_entity_name('john smith') == 'John Smith'
        assert service._normalize_entity_name('JOHN SMITH') == 'John Smith'
        assert service._normalize_entity_name('  john smith  ') == 'John Smith'

        # Test acronyms are preserved
        assert service._normalize_entity_name('IBM') == 'IBM'
        assert service._normalize_entity_name('AWS') == 'AWS'

    def test_normalize_entity_name_edge_cases(self):
        """Test edge cases in name normalization."""
        service = EntityResolutionService()

        # Empty string
        assert service._normalize_entity_name('') == ''

        # Special characters
        assert service._normalize_entity_name('O\'Brien') == "O'Brien"

        # Multiple spaces
        assert service._normalize_entity_name('John   Smith') == 'John   Smith'

    @patch('services.entity_resolution_service.MongoClient')
    def test_create_canonical_entity(self, mock_mongo_client, mock_mongo_collection):
        """Test creating new canonical entity."""
        # Setup mocks
        mock_client = MagicMock()
        mock_mongo_client.return_value = mock_client
        mock_db = MagicMock()
        mock_client.__getitem__.return_value = mock_db
        mock_db.entities = mock_mongo_collection

        service = EntityResolutionService()

        # Create entity
        entity = service._create_canonical_entity(
            entities_collection=mock_mongo_collection,
            entity_name='John Smith',
            entity_type=EntityType.PERSON,
            call_id='test-call-123',
            raw_name='john smith',
            mentions=3,
            context='Sales rep'
        )

        # Verify entity structure
        assert entity['canonical_name'] == 'John Smith'
        assert entity['entity_type'] == EntityType.PERSON
        assert entity['total_mentions'] == 3
        assert entity['call_count'] == 1
        assert len(entity['occurrences']) == 1
        assert 'entity_id' in entity

        # Verify MongoDB was called
        mock_mongo_collection.insert_one.assert_called_once()

    def test_add_entity_occurrence(self, mock_mongo_collection):
        """Test adding occurrence to existing entity."""
        service = EntityResolutionService()

        service._add_entity_occurrence(
            entities_collection=mock_mongo_collection,
            entity_id='entity-123',
            call_id='call-456',
            raw_name='John Smith',
            entity_type=EntityType.PERSON,
            mentions=2,
            context='Customer contact'
        )

        # Verify MongoDB update was called
        mock_mongo_collection.update_one.assert_called_once()

        # Check update structure
        call_args = mock_mongo_collection.update_one.call_args
        assert call_args[0][0] == {'entity_id': 'entity-123'}
        update_doc = call_args[0][1]
        assert '$push' in update_doc
        assert '$inc' in update_doc
        assert update_doc['$inc']['total_mentions'] == 2
        assert update_doc['$inc']['call_count'] == 1

    @patch('services.entity_resolution_service.MongoClient')
    def test_exact_match(self, mock_mongo_client, mock_mongo_collection):
        """Test exact entity name matching."""
        # Setup existing entity
        existing_entity = {
            'entity_id': 'entity-123',
            'canonical_name': 'John Smith',
            'entity_type': EntityType.PERSON,
            'aliases': [],
            'total_mentions': 10,
            'call_count': 3
        }

        mock_mongo_collection.find_one.return_value = existing_entity
        mock_mongo_collection.update_one.return_value = Mock(modified_count=1)

        service = EntityResolutionService()

        # Test exact match
        entity, match_info = service._find_or_create_canonical_entity(
            entities_collection=mock_mongo_collection,
            entity_name='John Smith',
            entity_type=EntityType.PERSON,
            call_id='call-123',
            mentions=1
        )

        assert entity['entity_id'] == 'entity-123'
        assert match_info['match_method'] == 'exact'
        assert match_info['similarity_score'] == 100.0
        assert match_info['is_new'] is False

    @patch('services.entity_resolution_service.MongoClient')
    def test_fuzzy_match(self, mock_mongo_client, mock_mongo_collection):
        """Test fuzzy entity matching."""
        # Setup: existing entity with similar name
        existing_entities = [
            {
                'entity_id': 'entity-456',
                'canonical_name': 'John Smith',
                'entity_type': EntityType.PERSON,
                'aliases': ['Johnny Smith'],
                'total_mentions': 5,
                'call_count': 2
            }
        ]

        # No exact match
        mock_mongo_collection.find_one.return_value = None
        # Return existing entities for fuzzy matching
        mock_mongo_collection.find.return_value = existing_entities
        mock_mongo_collection.update_one.return_value = Mock(modified_count=1)

        service = EntityResolutionService(similarity_threshold=85.0)

        # Test fuzzy match with typo
        entity, match_info = service._find_or_create_canonical_entity(
            entities_collection=mock_mongo_collection,
            entity_name='Jon Smith',  # Typo
            entity_type=EntityType.PERSON,
            call_id='call-789',
            mentions=1
        )

        # Should match to existing entity via fuzzy matching
        assert entity['entity_id'] == 'entity-456'
        assert match_info['match_method'] == 'fuzzy'
        assert match_info['similarity_score'] >= 85.0
        assert match_info['is_new'] is False

    @patch('services.entity_resolution_service.MongoClient')
    def test_no_match_creates_new_entity(self, mock_mongo_client, mock_mongo_collection):
        """Test that no match creates new entity."""
        # No exact match
        mock_mongo_collection.find_one.return_value = None
        # No similar entities for fuzzy matching
        mock_mongo_collection.find.return_value = []

        service = EntityResolutionService()

        # Test with completely new entity
        entity, match_info = service._find_or_create_canonical_entity(
            entities_collection=mock_mongo_collection,
            entity_name='Jane Doe',
            entity_type=EntityType.PERSON,
            call_id='call-999',
            mentions=2
        )

        assert match_info['match_method'] == 'new'
        assert match_info['is_new'] is True
        assert entity['canonical_name'] == 'Jane Doe'

        # Verify entity was inserted
        mock_mongo_collection.insert_one.assert_called_once()

    @patch('services.entity_resolution_service.MongoClient')
    def test_resolve_entities_for_call(
        self,
        mock_mongo_client,
        sample_entities,
        mock_mongo_collection
    ):
        """Test resolving all entities for a call."""
        # Setup mocks
        mock_client = MagicMock()
        mock_mongo_client.return_value = mock_client
        mock_db = MagicMock()
        mock_client.__getitem__.return_value = mock_db
        mock_db.entities = mock_mongo_collection

        # No existing entities (all will be new)
        mock_mongo_collection.find_one.return_value = None
        mock_mongo_collection.find.return_value = []

        service = EntityResolutionService()

        # Resolve entities
        result = service.resolve_entities_for_call(
            call_id='test-call-123',
            extracted_entities=sample_entities
        )

        # Verify result
        assert result.call_id == 'test-call-123'
        assert result.raw_entities_count == 3
        assert result.new_entities_created == 3
        assert result.resolved_entities_count == 0
        assert len(result.entity_mappings) == 3

        # Verify all entities were created
        assert mock_mongo_collection.insert_one.call_count == 3

    @patch('services.entity_resolution_service.MongoClient')
    def test_resolve_entities_with_duplicates(
        self,
        mock_mongo_client,
        duplicate_entities,
        mock_mongo_collection
    ):
        """Test deduplication of similar entities."""
        # Setup mocks
        mock_client = MagicMock()
        mock_mongo_client.return_value = mock_client
        mock_db = MagicMock()
        mock_client.__getitem__.return_value = mock_db
        mock_db.entities = mock_mongo_collection

        # Track created entities
        created_entities = []

        def mock_find_one(query):
            # Check for exact matches in created entities
            canonical_name = query.get('canonical_name')
            entity_type = query.get('entity_type')
            for entity in created_entities:
                if (entity['canonical_name'] == canonical_name and
                    entity['entity_type'] == entity_type):
                    return entity
            return None

        def mock_find(query):
            # Return entities of matching type for fuzzy matching
            entity_type = query.get('entity_type')
            return [e for e in created_entities if e['entity_type'] == entity_type]

        def mock_insert_one(doc):
            created_entities.append(doc)

        mock_mongo_collection.find_one.side_effect = mock_find_one
        mock_mongo_collection.find.side_effect = mock_find
        mock_mongo_collection.insert_one.side_effect = mock_insert_one
        mock_mongo_collection.update_one.return_value = Mock(modified_count=1)

        service = EntityResolutionService(similarity_threshold=80.0)

        # Resolve duplicate entities
        result = service.resolve_entities_for_call(
            call_id='test-call-dedup',
            extracted_entities=duplicate_entities
        )

        # Should create fewer canonical entities than raw entities
        # due to deduplication
        assert result.raw_entities_count == 6
        assert result.new_entities_created < 6  # Some were deduplicated

        # Verify entity mappings exist
        assert len(result.entity_mappings) == 6

    @patch('services.entity_resolution_service.MongoClient')
    def test_get_entity_stats(self, mock_mongo_client, mock_mongo_collection):
        """Test retrieving entity statistics."""
        # Setup mocks
        mock_client = MagicMock()
        mock_mongo_client.return_value = mock_client
        mock_db = MagicMock()
        mock_client.__getitem__.return_value = mock_db
        mock_db.entities = mock_mongo_collection

        # Mock count
        mock_mongo_collection.count_documents.return_value = 42

        # Mock aggregation for entities by type
        mock_mongo_collection.aggregate.side_effect = [
            [
                {'_id': EntityType.PERSON, 'count': 20},
                {'_id': EntityType.COMPANY, 'count': 15},
                {'_id': EntityType.PRODUCT, 'count': 7}
            ],
            [{'total': 150}]  # Total mentions
        ]

        # Mock most mentioned entities
        mock_cursor = MagicMock()
        mock_cursor.sort.return_value = mock_cursor
        mock_cursor.limit.return_value = [
            {
                'canonical_name': 'John Smith',
                'entity_type': EntityType.PERSON,
                'total_mentions': 50,
                'call_count': 10
            }
        ]
        mock_mongo_collection.find.return_value = mock_cursor

        service = EntityResolutionService()

        # Get stats
        stats = service.get_entity_stats()

        # Verify stats
        assert stats['total_entities'] == 42
        assert stats['entities_by_type'][EntityType.PERSON] == 20
        assert stats['entities_by_type'][EntityType.COMPANY] == 15
        assert stats['total_mentions'] == 150
        assert len(stats['most_mentioned_entities']) == 1
        assert stats['most_mentioned_entities'][0]['name'] == 'John Smith'

    def test_resolve_entities_empty_list(self, mock_mongo_collection):
        """Test resolving empty entity list."""
        service = EntityResolutionService()

        # Should handle empty list gracefully
        # We'll need to mock MongoDB for this to work properly
        with patch('services.entity_resolution_service.MongoClient'):
            result = service.resolve_entities_for_call(
                call_id='test-empty',
                extracted_entities=[]
            )

            assert result.raw_entities_count == 0
            assert result.new_entities_created == 0
            assert result.resolved_entities_count == 0
            assert len(result.entity_mappings) == 0

    def test_similarity_threshold_configuration(self):
        """Test different similarity thresholds."""
        # High threshold (strict matching)
        strict_service = EntityResolutionService(similarity_threshold=95.0)
        assert strict_service.similarity_threshold == 95.0

        # Low threshold (loose matching)
        loose_service = EntityResolutionService(similarity_threshold=75.0)
        assert loose_service.similarity_threshold == 75.0


class TestEntityModels:
    """Test entity data models."""

    def test_canonical_entity_model(self):
        """Test CanonicalEntity model validation."""
        now = datetime.utcnow()

        entity = CanonicalEntity(
            entity_id='entity-123',
            canonical_name='John Smith',
            entity_type=EntityType.PERSON,
            aliases=['Johnny', 'J. Smith'],
            email='john@example.com',
            company='Acme Corp',
            first_seen=now,
            last_seen=now,
            total_mentions=10,
            call_count=3
        )

        assert entity.entity_id == 'entity-123'
        assert entity.canonical_name == 'John Smith'
        assert len(entity.aliases) == 2
        assert entity.email == 'john@example.com'

    def test_entity_occurrence_model(self):
        """Test EntityOccurrence model validation."""
        occurrence = EntityOccurrence(
            call_id='call-123',
            raw_name='john smith',
            entity_type=EntityType.PERSON,
            mentions=3,
            context='Sales representative',
            extracted_at=datetime.utcnow()
        )

        assert occurrence.call_id == 'call-123'
        assert occurrence.mentions == 3
        assert occurrence.entity_type == EntityType.PERSON

    def test_entity_resolution_result_model(self):
        """Test EntityResolutionResult model validation."""
        result = EntityResolutionResult(
            call_id='call-456',
            raw_entities_count=5,
            resolved_entities_count=3,
            new_entities_created=2,
            processing_time_seconds=1.25
        )

        assert result.call_id == 'call-456'
        assert result.raw_entities_count == 5
        assert result.resolved_entities_count == 3
        assert result.new_entities_created == 2
