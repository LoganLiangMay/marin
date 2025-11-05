"""
Unit tests for AI service (GPT-4o analysis).

Tests consolidated analysis functionality including:
- Transcript analysis
- Quality validation
- Error handling
- Cost estimation
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from services.ai_service import (
    AIService,
    get_ai_service,
    ConsolidatedAnalysis,
    Sentiment,
    Entity,
    PainPoint,
    Objection,
    KeyTopic
)


@pytest.fixture
def sample_transcript():
    """Sample call transcript for testing."""
    return """
    Sales Rep: Hi, this is John from Acme Solutions. Thanks for taking the time to speak with me today.
    Prospect: Hi John, no problem. I'm interested in learning more about your product.
    Sales Rep: Great! Can you tell me a bit about the challenges you're facing?
    Prospect: We're struggling with our current CRM system. It's too slow and doesn't integrate well with our other tools.
    Sales Rep: I understand. Many of our customers faced similar issues before switching to Acme. Our platform is 3x faster and has native integrations with over 100 tools.
    Prospect: That sounds interesting, but I'm concerned about the pricing. Our budget is tight this quarter.
    Sales Rep: I totally get that. Let me show you our flexible pricing options that might work better for your budget.
    Prospect: Okay, I'd like to see a demo next week.
    Sales Rep: Perfect! I'll send you a calendar invite for Tuesday at 2pm. Does that work?
    Prospect: Yes, that works. Thanks!
    """


@pytest.fixture
def sample_analysis_response():
    """Sample GPT-4o analysis response."""
    return {
        'analysis': {
            'summary': 'Sales call discussing CRM system replacement. Prospect interested but concerned about pricing.',
            'sentiment': {
                'overall': 'positive',
                'score': 0.6,
                'confidence': 0.8,
                'reasoning': 'Prospect expressed interest and agreed to demo, showing positive engagement.'
            },
            'entities': [
                {
                    'name': 'John',
                    'type': 'person',
                    'mentions': 2,
                    'context': 'Sales representative from Acme Solutions'
                },
                {
                    'name': 'Acme Solutions',
                    'type': 'company',
                    'mentions': 2,
                    'context': 'Vendor company'
                }
            ],
            'pain_points': [
                {
                    'description': 'Current CRM system is too slow',
                    'severity': 'high',
                    'category': 'technical',
                    'quote': "We're struggling with our current CRM system. It's too slow"
                },
                {
                    'description': 'Poor integration with other tools',
                    'severity': 'high',
                    'category': 'technical',
                    'quote': "doesn't integrate well with our other tools"
                }
            ],
            'objections': [
                {
                    'objection': 'Pricing concerns due to tight budget',
                    'type': 'pricing',
                    'resolution_status': 'partially_resolved',
                    'resolution_approach': 'Offered to show flexible pricing options'
                }
            ],
            'key_topics': [
                {
                    'topic': 'CRM System Replacement',
                    'importance': 'high',
                    'summary': 'Discussion about switching from current slow CRM to Acme',
                    'time_spent': 'extensive'
                },
                {
                    'topic': 'Pricing and Budget',
                    'importance': 'high',
                    'summary': 'Prospect concerned about budget constraints',
                    'time_spent': 'moderate'
                }
            ],
            'call_type': 'sales',
            'next_steps': ['Send calendar invite for demo on Tuesday at 2pm'],
            'questions_raised': ['What are the flexible pricing options?'],
            'engagement_level': 'high',
            'call_outcome': 'positive'
        },
        'metadata': {
            'model': 'gpt-4o-2024-08-06',
            'provider': 'openai',
            'processing_time_seconds': 12.5,
            'cost_usd': 0.14,
            'tokens': {
                'prompt': 800,
                'completion': 450,
                'total': 1250
            },
            'analyzed_at': '2025-11-04T10:00:00'
        }
    }


class TestAIService:
    """Test suite for AIService."""

    def test_ai_service_initialization(self):
        """Test AI service can be initialized."""
        service = AIService()
        assert service.model == "gpt-4o-2024-08-06"
        assert service.client is not None

    def test_ai_service_with_custom_api_key(self):
        """Test AI service initialization with custom API key."""
        service = AIService(api_key="sk-test-key")
        assert service.client.api_key == "sk-test-key"

    def test_get_ai_service_singleton(self):
        """Test get_ai_service returns singleton instance."""
        service1 = get_ai_service()
        service2 = get_ai_service()
        assert service1 is service2

    @patch('services.ai_service.OpenAI')
    def test_analyze_call_transcript_success(
        self,
        mock_openai_class,
        sample_transcript,
        sample_analysis_response
    ):
        """Test successful call transcript analysis."""
        # Mock OpenAI client
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client

        # Create proper analysis object with attributes
        mock_parsed = Mock()
        mock_parsed.model_dump.return_value = sample_analysis_response['analysis']
        mock_parsed.entities = sample_analysis_response['analysis']['entities']
        mock_parsed.pain_points = sample_analysis_response['analysis']['pain_points']
        mock_parsed.objections = sample_analysis_response['analysis']['objections']

        mock_message = Mock()
        mock_message.parsed = mock_parsed

        mock_choice = Mock()
        mock_choice.message = mock_message

        mock_usage = Mock()
        mock_usage.prompt_tokens = 800
        mock_usage.completion_tokens = 450
        mock_usage.total_tokens = 1250

        mock_response = Mock()
        mock_response.choices = [mock_choice]
        mock_response.usage = mock_usage

        mock_client.beta.chat.completions.parse.return_value = mock_response

        # Test analysis
        service = AIService()
        result = service.analyze_call_transcript(
            transcript=sample_transcript,
            call_metadata={'company_name': 'Test Corp', 'call_type': 'sales'}
        )

        # Verify result structure
        assert 'analysis' in result
        assert 'metadata' in result
        assert result['metadata']['model'] == 'gpt-4o-2024-08-06'
        assert result['metadata']['provider'] == 'openai'
        assert 'cost_usd' in result['metadata']
        assert 'processing_time_seconds' in result['metadata']

        # Verify OpenAI was called correctly
        mock_client.beta.chat.completions.parse.assert_called_once()
        call_args = mock_client.beta.chat.completions.parse.call_args
        assert call_args.kwargs['model'] == 'gpt-4o-2024-08-06'
        assert call_args.kwargs['response_format'] == ConsolidatedAnalysis
        assert call_args.kwargs['temperature'] == 0.1

    @patch('services.ai_service.OpenAI')
    def test_analyze_call_transcript_with_context(
        self,
        mock_openai_class,
        sample_transcript
    ):
        """Test analysis with call metadata context."""
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client

        # Setup mock response
        analysis_data = {
            'summary': 'Test summary',
            'sentiment': {'overall': 'positive', 'score': 0.7, 'confidence': 0.8, 'reasoning': 'test'},
            'entities': [],
            'pain_points': [],
            'objections': [],
            'key_topics': [],
            'call_type': 'sales',
            'next_steps': [],
            'questions_raised': [],
            'engagement_level': 'high',
            'call_outcome': 'positive'
        }

        mock_parsed = Mock()
        mock_parsed.model_dump.return_value = analysis_data
        mock_parsed.entities = analysis_data['entities']
        mock_parsed.pain_points = analysis_data['pain_points']
        mock_parsed.objections = analysis_data['objections']

        mock_message = Mock()
        mock_message.parsed = mock_parsed

        mock_choice = Mock()
        mock_choice.message = mock_message

        mock_usage = Mock()
        mock_usage.prompt_tokens = 500
        mock_usage.completion_tokens = 200
        mock_usage.total_tokens = 700

        mock_response = Mock()
        mock_response.choices = [mock_choice]
        mock_response.usage = mock_usage

        mock_client.beta.chat.completions.parse.return_value = mock_response

        # Test with metadata
        service = AIService()
        result = service.analyze_call_transcript(
            transcript=sample_transcript,
            call_metadata={'company_name': 'Acme Corp', 'call_type': 'sales'}
        )

        # Verify prompt includes context
        call_args = mock_client.beta.chat.completions.parse.call_args
        prompt = call_args.kwargs['messages'][1]['content']
        assert 'Acme Corp' in prompt
        assert 'sales' in prompt

    @patch('services.ai_service.OpenAI')
    def test_analyze_call_cost_calculation(
        self,
        mock_openai_class,
        sample_transcript
    ):
        """Test cost calculation for GPT-4o analysis."""
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client

        # Mock response with specific token usage
        analysis_data = {
            'summary': 'Test',
            'sentiment': {'overall': 'neutral', 'score': 0, 'confidence': 1, 'reasoning': 'test'},
            'entities': [],
            'pain_points': [],
            'objections': [],
            'key_topics': [],
            'call_type': 'support',
            'next_steps': [],
            'questions_raised': [],
            'engagement_level': 'medium',
            'call_outcome': 'neutral'
        }

        mock_parsed = Mock()
        mock_parsed.model_dump.return_value = analysis_data
        mock_parsed.entities = analysis_data['entities']
        mock_parsed.pain_points = analysis_data['pain_points']
        mock_parsed.objections = analysis_data['objections']

        mock_message = Mock()
        mock_message.parsed = mock_parsed
        mock_choice = Mock()
        mock_choice.message = mock_message

        # Set specific token counts: 1M input tokens, 1M output tokens
        mock_usage = Mock()
        mock_usage.prompt_tokens = 1_000_000
        mock_usage.completion_tokens = 1_000_000
        mock_usage.total_tokens = 2_000_000

        mock_response = Mock()
        mock_response.choices = [mock_choice]
        mock_response.usage = mock_usage

        mock_client.beta.chat.completions.parse.return_value = mock_response

        service = AIService()
        result = service.analyze_call_transcript(transcript=sample_transcript)

        # Expected cost: (1M / 1M) * $2.50 + (1M / 1M) * $10.00 = $12.50
        assert result['metadata']['cost_usd'] == 12.50

    def test_validate_analysis_quality_high(self, sample_analysis_response):
        """Test quality validation with high quality analysis."""
        service = AIService()
        validation = service.validate_analysis_quality(sample_analysis_response)

        assert validation['quality_level'] == 'high'
        assert validation['quality_score'] >= 80
        assert len(validation['issues']) == 0

    def test_validate_analysis_quality_low(self):
        """Test quality validation with low quality analysis."""
        poor_analysis = {
            'analysis': {
                'summary': 'Short',  # Too short
                'sentiment': {
                    'overall': 'neutral',
                    'score': 0,
                    'confidence': 0.3,  # Low confidence
                    'reasoning': ''  # No reasoning
                },
                'entities': [],  # No entities
                'pain_points': [],  # No pain points in sales call
                'objections': [],
                'key_topics': [],  # No key topics
                'call_type': 'sales',
                'next_steps': [],
                'questions_raised': [],
                'engagement_level': 'low',
                'call_outcome': 'negative'
            }
        }

        service = AIService()
        validation = service.validate_analysis_quality(poor_analysis)

        assert validation['quality_level'] == 'low'
        assert validation['quality_score'] < 60
        assert len(validation['issues']) > 0
        assert len(validation['recommendations']) > 0

    def test_build_analysis_prompt(self):
        """Test analysis prompt construction."""
        service = AIService()

        transcript = "Test transcript content"
        context = "Company: Test Corp\nCall Type: sales"

        prompt = service._build_analysis_prompt(transcript, context)

        assert "Test transcript content" in prompt
        assert "Test Corp" in prompt
        assert "sales" in prompt
        assert "sentiment" in prompt.lower()
        assert "entities" in prompt.lower()
        assert "pain points" in prompt.lower()

    def test_build_analysis_prompt_no_context(self):
        """Test prompt construction without context."""
        service = AIService()

        transcript = "Test transcript"
        prompt = service._build_analysis_prompt(transcript)

        assert "Test transcript" in prompt
        assert "Context:" not in prompt

    @patch('services.ai_service.OpenAI')
    def test_analyze_call_transcript_api_error(
        self,
        mock_openai_class,
        sample_transcript
    ):
        """Test error handling when OpenAI API fails."""
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client

        # Simulate API error
        mock_client.beta.chat.completions.parse.side_effect = Exception("API Error")

        service = AIService()

        with pytest.raises(Exception) as exc_info:
            service.analyze_call_transcript(transcript=sample_transcript)

        assert "API Error" in str(exc_info.value)

    def test_validate_analysis_medium_quality(self):
        """Test quality validation with medium quality analysis."""
        medium_analysis = {
            'analysis': {
                'summary': 'This is a decent summary of the call',
                'sentiment': {
                    'overall': 'positive',
                    'score': 0.6,
                    'confidence': 0.7,
                    'reasoning': 'Customer seemed interested'
                },
                'entities': [{'name': 'John', 'type': 'person', 'mentions': 1}],
                'pain_points': [],  # Missing for sales call (-5)
                'objections': [],
                'key_topics': [],  # Missing (-10)
                'call_type': 'sales',
                'next_steps': ['Follow up'],
                'questions_raised': [],
                'engagement_level': 'medium',
                'call_outcome': 'positive'
            }
        }

        service = AIService()
        validation = service.validate_analysis_quality(medium_analysis)

        assert validation['quality_level'] == 'high'  # 85 score
        assert 60 <= validation['quality_score'] < 100


class TestAnalysisModels:
    """Test Pydantic models for analysis."""

    def test_entity_model(self):
        """Test Entity model validation."""
        entity = Entity(
            name="John Doe",
            type="person",
            mentions=3,
            context="Sales representative"
        )
        assert entity.name == "John Doe"
        assert entity.type == "person"
        assert entity.mentions == 3

    def test_sentiment_model(self):
        """Test Sentiment model validation."""
        sentiment = Sentiment(
            overall="positive",
            score=0.8,
            confidence=0.9,
            reasoning="Customer expressed enthusiasm"
        )
        assert sentiment.overall == "positive"
        assert sentiment.score == 0.8

    def test_pain_point_model(self):
        """Test PainPoint model validation."""
        pain_point = PainPoint(
            description="System is too slow",
            severity="high",
            category="technical",
            quote="It takes forever to load"
        )
        assert pain_point.severity == "high"
        assert pain_point.category == "technical"

    def test_objection_model(self):
        """Test Objection model validation."""
        objection = Objection(
            objection="Price is too high",
            type="pricing",
            resolution_status="resolved",
            resolution_approach="Offered discount"
        )
        assert objection.type == "pricing"
        assert objection.resolution_status == "resolved"

    def test_key_topic_model(self):
        """Test KeyTopic model validation."""
        topic = KeyTopic(
            topic="Product Features",
            importance="high",
            summary="Discussed key features",
            time_spent="extensive"
        )
        assert topic.importance == "high"
        assert topic.time_spent == "extensive"
