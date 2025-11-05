"""
Tests for semantic search API endpoint.

Tests Story 4.4: Semantic search across call transcripts.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import status

# Note: Full integration tests would require test client setup
# These are unit tests for the search endpoint logic


class TestSemanticSearchAPI:
    """Test suite for semantic search API."""

    @pytest.fixture
    def mock_query_embedding(self):
        """Mock 1536-dimensional query embedding."""
        return [0.1] * 1536

    @pytest.fixture
    def mock_search_results(self):
        """Mock OpenSearch search results."""
        return [
            {
                'call_id': 'call_123',
                'chunk_id': 'call_123_chunk_5',
                'chunk_index': 5,
                'score': 0.92,
                'text': 'The customer mentioned they were charged twice this month...',
                'metadata': {
                    'company_name': 'Test Corp',
                    'call_type': 'support',
                    'start_time': 45.2,
                    'end_time': 58.7,
                    'word_count': 25,
                    'character_count': 120
                }
            }
        ]

    @pytest.fixture
    def mock_call_doc(self):
        """Mock MongoDB call document."""
        return {
            'call_id': 'call_123',
            'created_at': '2025-01-15T10:30:00Z',
            'audio': {
                'duration_seconds': 180
            }
        }

    # Test 1: Valid search request
    def test_search_request_validation(self):
        """Test SearchRequest model validation."""
        from backend.models.search import SearchRequest

        request = SearchRequest(
            query="customer complaint billing",
            k=10,
            min_score=0.7
        )

        assert request.query == "customer complaint billing"
        assert request.k == 10
        assert request.min_score == 0.7

    # Test 2: Search with filters
    def test_search_with_filters(self):
        """Test SearchRequest with filters."""
        from backend.models.search import SearchRequest, SearchFilters

        request = SearchRequest(
            query="billing issue",
            filters=SearchFilters(
                company_name="Acme Corp",
                call_type="support",
                date_from="2025-01-01",
                date_to="2025-12-31"
            ),
            k=5,
            min_score=0.8
        )

        assert request.filters.company_name == "Acme Corp"
        assert request.filters.call_type == "support"
        assert request.k == 5

    # Test 3: Invalid k parameter
    def test_invalid_k_parameter(self):
        """Test that k must be between 1 and 100."""
        from backend.models.search import SearchRequest
        from pydantic import ValidationError

        # k too small
        with pytest.raises(ValidationError):
            SearchRequest(query="test", k=0)

        # k too large
        with pytest.raises(ValidationError):
            SearchRequest(query="test", k=101)

    # Test 4: Invalid min_score parameter
    def test_invalid_min_score(self):
        """Test that min_score must be between 0.0 and 1.0."""
        from backend.models.search import SearchRequest
        from pydantic import ValidationError

        # Score below 0
        with pytest.raises(ValidationError):
            SearchRequest(query="test", min_score=-0.1)

        # Score above 1
        with pytest.raises(ValidationError):
            SearchRequest(query="test", min_score=1.1)

    # Test 5: Search result model
    def test_search_result_model(self, mock_call_doc):
        """Test SearchResult model structure."""
        from backend.models.search import SearchResult, ChunkMetadata, CallMetadataSummary

        result = SearchResult(
            call_id="call_123",
            chunk_id="call_123_chunk_5",
            chunk_index=5,
            score=0.92,
            text="Test text",
            metadata=ChunkMetadata(
                company_name="Test Corp",
                call_type="support"
            ),
            call_metadata=CallMetadataSummary(
                duration_seconds=180
            )
        )

        assert result.call_id == "call_123"
        assert result.score == 0.92
        assert result.metadata.company_name == "Test Corp"

    # Test 6: Empty query validation
    def test_empty_query(self):
        """Test that empty query is rejected."""
        from backend.models.search import SearchRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            SearchRequest(query="")

    # Test 7: Query embedding generation (mocked)
    @patch('backend.api.v1.search.boto3.client')
    async def test_query_embedding_generation(self, mock_boto3, mock_query_embedding):
        """Test query embedding generation."""
        from backend.api.v1.search import generate_query_embedding
        import json

        # Mock Bedrock client
        mock_bedrock = Mock()
        mock_response = {
            'body': Mock(read=lambda: json.dumps({
                'embedding': mock_query_embedding
            }).encode())
        }
        mock_bedrock.invoke_model.return_value = mock_response
        mock_boto3.return_value = mock_bedrock

        embedding = await generate_query_embedding("test query")

        assert len(embedding) == 1536
        assert embedding == mock_query_embedding

    # Test 8: Search response model
    def test_search_response_model(self):
        """Test SearchResponse model structure."""
        from backend.models.search import SearchResponse, SearchResult, ChunkMetadata, CallMetadataSummary

        response = SearchResponse(
            query="test query",
            results=[
                SearchResult(
                    call_id="call_123",
                    chunk_id="call_123_chunk_0",
                    chunk_index=0,
                    score=0.95,
                    text="Test text",
                    metadata=ChunkMetadata(),
                    call_metadata=CallMetadataSummary()
                )
            ],
            total_results=1,
            processing_time_ms=250
        )

        assert response.query == "test query"
        assert response.total_results == 1
        assert len(response.results) == 1
        assert response.processing_time_ms == 250

    # Test 9: Filters optional fields
    def test_filters_all_optional(self):
        """Test that all filter fields are optional."""
        from backend.models.search import SearchFilters

        # Empty filters
        filters = SearchFilters()
        assert filters.company_name is None
        assert filters.call_type is None
        assert filters.date_from is None
        assert filters.date_to is None

        # Partial filters
        filters = SearchFilters(company_name="Test")
        assert filters.company_name == "Test"
        assert filters.call_type is None
