"""
Pydantic models for AI analysis results.

This module defines the data structures for storing and retrieving
AI-powered call analysis results from consolidated GPT-4o analysis.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class EntityModel(BaseModel):
    """Entity extracted from call transcript."""
    name: str = Field(..., description="Entity name or value")
    type: str = Field(..., description="Entity type (person, company, product, location, etc.)")
    mentions: int = Field(default=1, description="Number of times mentioned")
    context: Optional[str] = Field(None, description="Brief context where entity appears")


class SentimentModel(BaseModel):
    """Sentiment analysis results."""
    overall: str = Field(..., description="Overall sentiment: positive, negative, neutral, or mixed")
    score: float = Field(..., description="Sentiment score from -1.0 (negative) to 1.0 (positive)")
    confidence: float = Field(..., description="Confidence level from 0.0 to 1.0")
    reasoning: str = Field(..., description="Brief explanation of sentiment assessment")


class PainPointModel(BaseModel):
    """Customer pain point or challenge."""
    description: str = Field(..., description="Description of the pain point")
    severity: str = Field(..., description="Severity: critical, high, medium, or low")
    category: str = Field(..., description="Category: technical, pricing, feature, support, etc.")
    quote: Optional[str] = Field(None, description="Relevant quote from transcript")


class ObjectionModel(BaseModel):
    """Customer objection or concern."""
    objection: str = Field(..., description="The objection or concern raised")
    type: str = Field(..., description="Type: pricing, timing, competition, technical, authority, etc.")
    resolution_status: str = Field(..., description="Status: resolved, partially_resolved, unresolved")
    resolution_approach: Optional[str] = Field(None, description="How it was addressed (if applicable)")


class KeyTopicModel(BaseModel):
    """Key discussion topic."""
    topic: str = Field(..., description="Topic name or theme")
    importance: str = Field(..., description="Importance: high, medium, or low")
    summary: str = Field(..., description="Brief summary of discussion around this topic")
    time_spent: Optional[str] = Field(None, description="Relative time spent: brief, moderate, extensive")


class AnalysisMetadata(BaseModel):
    """Metadata about the analysis process."""
    model: str = Field(..., description="AI model used for analysis")
    provider: str = Field(..., description="AI provider (openai, etc.)")
    processing_time_seconds: float = Field(..., description="Time taken to complete analysis")
    cost_usd: float = Field(..., description="Cost of analysis in USD")
    tokens: Dict[str, int] = Field(..., description="Token usage breakdown")
    analyzed_at: str = Field(..., description="ISO timestamp of analysis")


class QualityValidation(BaseModel):
    """Analysis quality validation results."""
    quality_score: float = Field(..., description="Quality score from 0 to 100")
    quality_level: str = Field(..., description="Quality level: high, medium, or low")
    issues: List[str] = Field(default_factory=list, description="Quality issues identified")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations for improvement")
    validated_at: str = Field(..., description="ISO timestamp of validation")


class CallAnalysis(BaseModel):
    """Complete call analysis result."""

    # Core analysis
    summary: str = Field(..., description="2-3 sentence summary of the entire call")
    sentiment: SentimentModel = Field(..., description="Overall sentiment analysis")
    entities: List[EntityModel] = Field(default_factory=list, description="Extracted entities")
    pain_points: List[PainPointModel] = Field(default_factory=list, description="Customer pain points")
    objections: List[ObjectionModel] = Field(default_factory=list, description="Customer objections")
    key_topics: List[KeyTopicModel] = Field(default_factory=list, description="Main discussion topics")

    # Call metadata
    call_type: str = Field(..., description="Inferred call type: sales, support, discovery, demo, etc.")
    next_steps: List[str] = Field(default_factory=list, description="Action items or next steps mentioned")
    questions_raised: List[str] = Field(default_factory=list, description="Key questions raised during call")

    # Quality indicators
    engagement_level: str = Field(..., description="Engagement level: high, medium, or low")
    call_outcome: str = Field(..., description="Call outcome: positive, neutral, negative, or inconclusive")

    # Processing metadata
    metadata: AnalysisMetadata = Field(..., description="Analysis processing metadata")
    quality_validation: Optional[QualityValidation] = Field(None, description="Quality validation results")


class AnalysisResponse(BaseModel):
    """API response model for call analysis."""
    call_id: str = Field(..., description="Call identifier")
    analysis: CallAnalysis = Field(..., description="Analysis results")
    created_at: datetime = Field(..., description="Timestamp when analysis was created")


class AnalysisSummary(BaseModel):
    """Lightweight analysis summary for listing."""
    call_id: str = Field(..., description="Call identifier")
    summary: str = Field(..., description="Brief call summary")
    sentiment: str = Field(..., description="Overall sentiment")
    call_type: str = Field(..., description="Call type")
    engagement_level: str = Field(..., description="Engagement level")
    analyzed_at: str = Field(..., description="ISO timestamp of analysis")
