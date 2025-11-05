"""
Tests for RAG service.

Tests Story 4.5: RAG-based question answering service.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock


class TestRAGService:
    """Test suite for RAG service."""

    @pytest.fixture
    def mock_search_results(self):
        """Mock search results from OpenSearch."""
        return [
            {
                'call_id': 'call_123',
                'chunk_id': 'call_123_chunk_5',
                'score': 0.92,
                'text': 'The customer mentioned they were charged twice this month.',
                'metadata': {
                    'company_name': 'Acme Corp',
                    'call_type': 'support',
                    'start_time': 45.2,
                    'end_time': 58.7
                }
            },
            {
                'call_id': 'call_456',
                'chunk_id': 'call_456_chunk_10',
                'score': 0.88,
                'text': 'I am confused about the pricing structure and late fees.',
                'metadata': {
                    'company_name': 'Acme Corp',
                    'call_type': 'support',
                    'start_time': 120.5,
                    'end_time': 135.2
                }
            }
        ]

    # Test 1: Service initialization
    def test_rag_service_initialization(self):
        """Test RAG service can be initialized."""
        from backend.services.rag_service import RAGService

        service = RAGService(openai_api_key="test-key")
        assert service.openai_client is not None
        assert service.anthropic_client is None

    # Test 2: System prompt building
    def test_build_system_prompt(self):
        """Test system prompt is properly formatted."""
        from backend.services.rag_service import RAGService

        service = RAGService(openai_api_key="test-key")
        prompt = service._build_system_prompt()

        assert "AI assistant" in prompt
        assert "call transcripts" in prompt
        assert "cite" in prompt.lower()
        assert "context" in prompt.lower()

    # Test 3: User prompt building
    def test_build_user_prompt(self):
        """Test user prompt with question and context."""
        from backend.services.rag_service import RAGService

        service = RAGService(openai_api_key="test-key")
        question = "What are common complaints?"
        context = "[Source 1 - Call: call_123]\nDouble charging issue"

        prompt = service._build_user_prompt(question, context)

        assert question in prompt
        assert context in prompt
        assert "Question:" in prompt
        assert "Context" in prompt

    # Test 4: Context formatting
    def test_format_context(self, mock_search_results):
        """Test formatting search results as context."""
        from backend.services.rag_service import RAGService

        service = RAGService(openai_api_key="test-key")
        context = service._format_context(mock_search_results)

        # Verify both chunks are included
        assert 'call_123' in context
        assert 'call_456' in context

        # Verify text content
        assert 'charged twice' in context
        assert 'pricing structure' in context

        # Verify metadata
        assert 'Acme Corp' in context
        assert '45.2-58.7s' in context

    # Test 5: No context answer
    def test_no_context_answer(self):
        """Test answer generation when no context found."""
        from backend.services.rag_service import RAGService

        service = RAGService(openai_api_key="test-key")
        answer = service._generate_no_context_answer("What is the weather?")

        assert "couldn't find" in answer.lower()
        assert "try" in answer.lower()
        assert len(answer) > 50  # Should be informative

    # Test 6: Format sources
    def test_format_sources(self, mock_search_results):
        """Test formatting search results as SourceChunk objects."""
        from backend.services.rag_service import RAGService

        service = RAGService(openai_api_key="test-key")
        sources = service.format_sources(mock_search_results)

        assert len(sources) == 2
        assert sources[0].call_id == 'call_123'
        assert sources[0].score == 0.92
        assert sources[1].call_id == 'call_456'

    # Test 7: OpenAI call (mocked)
    @patch('backend.services.rag_service.OpenAI')
    async def test_call_openai(self, mock_openai_class, mock_search_results):
        """Test calling OpenAI API."""
        from backend.services.rag_service import RAGService

        # Mock OpenAI response
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="This is the generated answer"))]
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai_class.return_value = mock_client

        service = RAGService(openai_api_key="test-key")
        service.openai_client = mock_client

        system_prompt = "System"
        user_prompt = "User question"

        answer = await service._call_openai(system_prompt, user_prompt, "gpt-4o")

        assert answer == "This is the generated answer"
        assert mock_client.chat.completions.create.called

        # Verify API call parameters
        call_args = mock_client.chat.completions.create.call_args
        assert call_args[1]['model'] == 'gpt-4o'
        assert call_args[1]['temperature'] == 0.3
        assert len(call_args[1]['messages']) == 2

    # Test 8: Answer question with context
    @patch('backend.services.rag_service.OpenAI')
    async def test_answer_question_with_context(
        self, mock_openai_class, mock_search_results
    ):
        """Test full answer generation flow."""
        from backend.services.rag_service import RAGService

        # Mock OpenAI
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Based on the calls, customers complained about double charging and pricing confusion."))]
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai_class.return_value = mock_client

        service = RAGService(openai_api_key="test-key")
        service.openai_client = mock_client

        answer = await service.answer_question(
            question="What are common complaints?",
            search_results=mock_search_results,
            model="gpt-4o"
        )

        assert "double charging" in answer
        assert "pricing confusion" in answer

    # Test 9: Answer question with no context
    async def test_answer_question_no_context(self):
        """Test answer generation with empty search results."""
        from backend.services.rag_service import RAGService

        service = RAGService(openai_api_key="test-key")

        answer = await service.answer_question(
            question="What is the weather?",
            search_results=[],
            model="gpt-4o"
        )

        assert "couldn't find" in answer.lower()

    # Test 10: Unsupported model error
    async def test_unsupported_model(self, mock_search_results):
        """Test error handling for unsupported model."""
        from backend.services.rag_service import RAGService

        service = RAGService(openai_api_key="test-key")

        with pytest.raises(ValueError, match="Unsupported model"):
            await service.answer_question(
                question="Test question",
                search_results=mock_search_results,
                model="unsupported-model"
            )

    # Test 11: Context with missing metadata
    def test_format_context_missing_metadata(self):
        """Test formatting context when metadata is incomplete."""
        from backend.services.rag_service import RAGService

        service = RAGService(openai_api_key="test-key")

        # Search results with minimal metadata
        minimal_results = [
            {
                'call_id': 'call_789',
                'text': 'Some text here',
                'metadata': {}  # Empty metadata
            }
        ]

        context = service._format_context(minimal_results)

        assert 'call_789' in context
        assert 'Some text here' in context
        # Should handle missing metadata gracefully
