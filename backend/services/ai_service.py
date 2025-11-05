"""
AI Service for GPT-4o powered call analysis.

This service implements consolidated analysis using a single GPT-4o call
to extract entities, sentiment, pain points, objections, and key topics
from call transcripts.

Based on ADR-002: Consolidated Analysis approach
- 60% faster than multi-agent approach
- 70% cheaper per call
- Target: <20 seconds processing time, ~$0.15 per call
"""

import logging
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from openai import OpenAI
from pydantic import BaseModel, Field
from core.config import settings

logger = logging.getLogger(__name__)


class Entity(BaseModel):
    """Extracted entity with type and context."""
    name: str = Field(..., description="Entity name or value")
    type: str = Field(..., description="Entity type (person, company, product, location, etc.)")
    mentions: int = Field(default=1, description="Number of times mentioned")
    context: Optional[str] = Field(None, description="Brief context where entity appears")


class Sentiment(BaseModel):
    """Sentiment analysis results."""
    overall: str = Field(..., description="Overall sentiment: positive, negative, neutral, or mixed")
    score: float = Field(..., description="Sentiment score from -1.0 (negative) to 1.0 (positive)")
    confidence: float = Field(..., description="Confidence level from 0.0 to 1.0")
    reasoning: str = Field(..., description="Brief explanation of sentiment assessment")


class PainPoint(BaseModel):
    """Customer pain point or challenge."""
    description: str = Field(..., description="Description of the pain point")
    severity: str = Field(..., description="Severity: critical, high, medium, or low")
    category: str = Field(..., description="Category: technical, pricing, feature, support, etc.")
    quote: Optional[str] = Field(None, description="Relevant quote from transcript")


class Objection(BaseModel):
    """Customer objection or concern."""
    objection: str = Field(..., description="The objection or concern raised")
    type: str = Field(..., description="Type: pricing, timing, competition, technical, authority, etc.")
    resolution_status: str = Field(..., description="Status: resolved, partially_resolved, unresolved")
    resolution_approach: Optional[str] = Field(None, description="How it was addressed (if applicable)")


class KeyTopic(BaseModel):
    """Key discussion topic."""
    topic: str = Field(..., description="Topic name or theme")
    importance: str = Field(..., description="Importance: high, medium, or low")
    summary: str = Field(..., description="Brief summary of discussion around this topic")
    time_spent: Optional[str] = Field(None, description="Relative time spent: brief, moderate, extensive")


class ConsolidatedAnalysis(BaseModel):
    """Complete analysis result from GPT-4o."""

    # Core analysis components
    summary: str = Field(..., description="2-3 sentence summary of the entire call")
    sentiment: Sentiment = Field(..., description="Overall sentiment analysis")
    entities: List[Entity] = Field(default_factory=list, description="Extracted entities")
    pain_points: List[PainPoint] = Field(default_factory=list, description="Customer pain points")
    objections: List[Objection] = Field(default_factory=list, description="Customer objections")
    key_topics: List[KeyTopic] = Field(default_factory=list, description="Main discussion topics")

    # Metadata
    call_type: str = Field(..., description="Inferred call type: sales, support, discovery, demo, etc.")
    next_steps: List[str] = Field(default_factory=list, description="Action items or next steps mentioned")
    questions_raised: List[str] = Field(default_factory=list, description="Key questions raised during call")

    # Quality indicators
    engagement_level: str = Field(..., description="Engagement level: high, medium, or low")
    call_outcome: str = Field(..., description="Call outcome: positive, neutral, negative, or inconclusive")


class AIService:
    """
    AI Service for GPT-4o powered analysis.

    This service provides consolidated analysis of call transcripts using
    a single GPT-4o API call for optimal performance and cost efficiency.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize AI Service.

        Args:
            api_key: OpenAI API key (defaults to settings.openai_api_key)
        """
        self.client = OpenAI(api_key=api_key or settings.openai_api_key)
        self.model = "gpt-4o-2024-08-06"  # GPT-4o with structured output support

    def analyze_call_transcript(
        self,
        transcript: str,
        call_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze call transcript using GPT-4o consolidated analysis.

        This method performs a single GPT-4o API call to extract all
        analysis components: entities, sentiment, pain points, objections,
        key topics, and more.

        Args:
            transcript: Full transcript text to analyze
            call_metadata: Optional metadata (company, call_type, etc.)

        Returns:
            dict: Analysis results with metadata (processing time, cost, etc.)

        Raises:
            Exception: On API errors or processing failures
        """
        start_time = time.time()

        try:
            # Build context from metadata
            context = ""
            if call_metadata:
                if company := call_metadata.get('company_name'):
                    context += f"Company: {company}\n"
                if call_type := call_metadata.get('call_type'):
                    context += f"Call Type: {call_type}\n"

            # Construct prompt for consolidated analysis
            prompt = self._build_analysis_prompt(transcript, context)

            logger.info(
                "Calling GPT-4o for consolidated analysis",
                extra={
                    'model': self.model,
                    'transcript_length': len(transcript),
                    'has_context': bool(context)
                }
            )

            # Call GPT-4o with structured output
            response = self.client.beta.chat.completions.parse(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert call analyst. Analyze sales and support calls to extract actionable insights, entities, sentiment, pain points, objections, and key topics. Provide thorough, accurate analysis based solely on the transcript content."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format=ConsolidatedAnalysis,
                temperature=0.1,  # Low temperature for consistent, factual analysis
            )

            # Parse structured output
            analysis = response.choices[0].message.parsed

            # Calculate metrics
            processing_time = time.time() - start_time

            # Estimate cost (GPT-4o pricing as of Nov 2024)
            # Input: ~$2.50 per 1M tokens, Output: ~$10.00 per 1M tokens
            prompt_tokens = response.usage.prompt_tokens
            completion_tokens = response.usage.completion_tokens

            input_cost = (prompt_tokens / 1_000_000) * 2.50
            output_cost = (completion_tokens / 1_000_000) * 10.00
            total_cost = input_cost + output_cost

            logger.info(
                "GPT-4o analysis completed",
                extra={
                    'processing_time_seconds': round(processing_time, 2),
                    'prompt_tokens': prompt_tokens,
                    'completion_tokens': completion_tokens,
                    'total_tokens': response.usage.total_tokens,
                    'cost_usd': round(total_cost, 4),
                    'entities_count': len(analysis.entities),
                    'pain_points_count': len(analysis.pain_points),
                    'objections_count': len(analysis.objections)
                }
            )

            # Return results with metadata
            return {
                'analysis': analysis.model_dump(),
                'metadata': {
                    'model': self.model,
                    'provider': 'openai',
                    'processing_time_seconds': round(processing_time, 2),
                    'cost_usd': round(total_cost, 4),
                    'tokens': {
                        'prompt': prompt_tokens,
                        'completion': completion_tokens,
                        'total': response.usage.total_tokens
                    },
                    'analyzed_at': datetime.utcnow().isoformat()
                }
            }

        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(
                "Error during GPT-4o analysis",
                extra={
                    'error': str(e),
                    'processing_time_seconds': round(processing_time, 2)
                },
                exc_info=True
            )
            raise

    def _build_analysis_prompt(self, transcript: str, context: str = "") -> str:
        """
        Build the consolidated analysis prompt.

        Args:
            transcript: Call transcript text
            context: Optional context (company, call type, etc.)

        Returns:
            str: Formatted prompt for GPT-4o
        """
        prompt = "Analyze the following call transcript and extract comprehensive insights.\n\n"

        if context:
            prompt += f"Context:\n{context}\n"

        prompt += f"""
Transcript:
{transcript}

Instructions:
1. Provide a concise 2-3 sentence summary of the entire call
2. Analyze overall sentiment with reasoning
3. Extract all entities (people, companies, products, locations, etc.) with context
4. Identify customer pain points with severity and relevant quotes
5. Identify objections raised and whether they were resolved
6. Extract key discussion topics with importance levels
7. Infer the call type and engagement level
8. List any next steps or action items mentioned
9. Note key questions raised during the call
10. Assess the overall call outcome

Base your analysis solely on the transcript content. Be thorough but concise.
"""

        return prompt

    def validate_analysis_quality(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate analysis quality and completeness.

        Args:
            analysis: Analysis results from analyze_call_transcript

        Returns:
            dict: Quality validation results with score and recommendations
        """
        quality_score = 100.0
        issues = []
        recommendations = []

        analysis_data = analysis.get('analysis', {})

        # Check for empty summary
        if not analysis_data.get('summary') or len(analysis_data.get('summary', '')) < 20:
            quality_score -= 15
            issues.append("Summary is too short or missing")
            recommendations.append("Ensure transcript has sufficient content")

        # Check for entities
        if len(analysis_data.get('entities', [])) == 0:
            quality_score -= 10
            issues.append("No entities extracted")
            recommendations.append("Review transcript for entity mentions")

        # Check for key topics
        if len(analysis_data.get('key_topics', [])) == 0:
            quality_score -= 10
            issues.append("No key topics identified")
            recommendations.append("Ensure call has substantive content")

        # Check for sentiment reasoning
        sentiment = analysis_data.get('sentiment', {})
        if not sentiment.get('reasoning'):
            quality_score -= 10
            issues.append("Sentiment lacks reasoning")

        # Check confidence levels
        if sentiment.get('confidence', 0) < 0.5:
            quality_score -= 5
            issues.append("Low sentiment confidence")
            recommendations.append("Review transcript clarity")

        # Check for pain points in sales/support calls
        call_type = analysis_data.get('call_type', '').lower()
        if call_type in ['sales', 'support', 'discovery'] and len(analysis_data.get('pain_points', [])) == 0:
            quality_score -= 5
            issues.append("No pain points identified for sales/support call")

        quality_level = "high" if quality_score >= 80 else "medium" if quality_score >= 60 else "low"

        return {
            'quality_score': max(0, quality_score),
            'quality_level': quality_level,
            'issues': issues,
            'recommendations': recommendations,
            'validated_at': datetime.utcnow().isoformat()
        }


# Singleton instance
_ai_service_instance = None


def get_ai_service() -> AIService:
    """
    Get singleton AI service instance.

    Returns:
        AIService: Configured AI service instance
    """
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = AIService()
    return _ai_service_instance
