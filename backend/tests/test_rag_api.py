"""
Tests for RAG API endpoint.

Tests Story 4.5: RAG answer generation API.
"""

import pytest
from pydantic import ValidationError


class TestRAGAPI:
    """Test suite for RAG API endpoints."""

    # Test 1: RAG request validation
    def test_rag_request_validation(self):
        """Test RAGRequest model validation."""
        from backend.models.rag import RAGRequest

        request = RAGRequest(
            question="What are the most common complaints?",
            k=5,
            model="gpt-4o",
            include_sources=True
        )

        assert request.question == "What are the most common complaints?"
        assert request.k == 5
        assert request.model == "gpt-4o"
        assert request.include_sources is True

    # Test 2: RAG request with filters
    def test_rag_request_with_filters(self):
        """Test RAGRequest with search filters."""
        from backend.models.rag import RAGRequest
        from backend.models.search import SearchFilters

        request = RAGRequest(
            question="Billing complaints?",
            filters=SearchFilters(
                company_name="Acme Corp",
                call_type="support"
            ),
            k=3,
            model="gpt-4"
        )

        assert request.filters.company_name == "Acme Corp"
        assert request.filters.call_type == "support"
        assert request.k == 3

    # Test 3: Invalid k parameter
    def test_invalid_k_parameter(self):
        """Test that k must be between 1 and 20."""
        from backend.models.rag import RAGRequest

        # k too small
        with pytest.raises(ValidationError):
            RAGRequest(question="test", k=0)

        # k too large
        with pytest.raises(ValidationError):
            RAGRequest(question="test", k=21)

    # Test 4: Empty question validation
    def test_empty_question(self):
        """Test that empty question is rejected."""
        from backend.models.rag import RAGRequest

        with pytest.raises(ValidationError):
            RAGRequest(question="")

    # Test 5: SourceChunk model
    def test_source_chunk_model(self):
        """Test SourceChunk model structure."""
        from backend.models.rag import SourceChunk

        chunk = SourceChunk(
            call_id="call_123",
            chunk_id="call_123_chunk_5",
            score=0.92,
            text="Customer complaint about billing",
            metadata={"company_name": "Acme Corp"}
        )

        assert chunk.call_id == "call_123"
        assert chunk.score == 0.92
        assert chunk.metadata["company_name"] == "Acme Corp"

    # Test 6: RAG response model
    def test_rag_response_model(self):
        """Test RAGResponse model structure."""
        from backend.models.rag import RAGResponse, SourceChunk

        response = RAGResponse(
            question="Test question",
            answer="Generated answer",
            sources=[
                SourceChunk(
                    call_id="call_123",
                    chunk_id="call_123_chunk_0",
                    score=0.95,
                    text="Test text",
                    metadata={}
                )
            ],
            model_used="gpt-4o",
            total_sources=1,
            processing_time_ms=1250
        )

        assert response.question == "Test question"
        assert response.answer == "Generated answer"
        assert len(response.sources) == 1
        assert response.model_used == "gpt-4o"
        assert response.total_sources == 1
        assert response.processing_time_ms == 1250

    # Test 7: Default values
    def test_default_values(self):
        """Test default values in RAGRequest."""
        from backend.models.rag import RAGRequest

        request = RAGRequest(question="Test question")

        assert request.k == 5  # Default
        assert request.model == "gpt-4o"  # Default
        assert request.include_sources is True  # Default
        assert request.filters is None  # Default

    # Test 8: Supported models
    def test_supported_models(self):
        """Test that various models can be specified."""
        from backend.models.rag import RAGRequest

        # GPT models
        request1 = RAGRequest(question="test", model="gpt-4o")
        assert request1.model == "gpt-4o"

        request2 = RAGRequest(question="test", model="gpt-4")
        assert request2.model == "gpt-4"

        request3 = RAGRequest(question="test", model="gpt-3.5-turbo")
        assert request3.model == "gpt-3.5-turbo"

        # Claude models
        request4 = RAGRequest(question="test", model="claude-3-5-sonnet-20241022")
        assert request4.model == "claude-3-5-sonnet-20241022"

    # Test 9: Include sources flag
    def test_include_sources_flag(self):
        """Test include_sources parameter."""
        from backend.models.rag import RAGRequest

        # With sources
        request1 = RAGRequest(question="test", include_sources=True)
        assert request1.include_sources is True

        # Without sources
        request2 = RAGRequest(question="test", include_sources=False)
        assert request2.include_sources is False

    # Test 10: Complex filter combination
    def test_complex_filters(self):
        """Test RAGRequest with multiple filters."""
        from backend.models.rag import RAGRequest
        from backend.models.search import SearchFilters

        request = RAGRequest(
            question="What issues were discussed?",
            filters=SearchFilters(
                company_name="Acme Corp",
                call_type="support",
                date_from="2025-01-01",
                date_to="2025-12-31"
            ),
            k=10,
            model="gpt-4o"
        )

        assert request.filters.company_name == "Acme Corp"
        assert request.filters.call_type == "support"
        assert request.filters.date_from == "2025-01-01"
        assert request.filters.date_to == "2025-12-31"
        assert request.k == 10
