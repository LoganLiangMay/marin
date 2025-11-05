"""
Pydantic models for entity resolution and contact management.

This module defines data structures for canonical entities, entity matching,
and contact deduplication (Story 3.3).
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class EntityType:
    """Entity type constants."""
    PERSON = "person"
    COMPANY = "company"
    PRODUCT = "product"
    LOCATION = "location"
    TECHNOLOGY = "technology"
    OTHER = "other"


class EntityMatch(BaseModel):
    """Result of entity matching/resolution."""
    canonical_id: str = Field(..., description="ID of the canonical entity")
    similarity_score: float = Field(..., description="Similarity score (0-100)")
    match_method: str = Field(..., description="Method used: exact, fuzzy, manual")
    matched_at: datetime = Field(default_factory=datetime.utcnow, description="When the match was made")


class EntityOccurrence(BaseModel):
    """Single occurrence of an entity in a call."""
    call_id: str = Field(..., description="Call where entity was mentioned")
    raw_name: str = Field(..., description="Original entity name from extraction")
    entity_type: str = Field(..., description="Entity type")
    mentions: int = Field(default=1, description="Number of mentions in this call")
    context: Optional[str] = Field(None, description="Context where entity appears")
    extracted_at: datetime = Field(..., description="When entity was extracted")


class CanonicalEntity(BaseModel):
    """
    Canonical (deduplicated) entity representing a unique person, company, etc.

    This is the master record that multiple raw entities can link to.
    """
    entity_id: str = Field(..., description="Unique identifier for canonical entity")
    canonical_name: str = Field(..., description="Canonical/preferred name")
    entity_type: str = Field(..., description="Entity type (person, company, etc.)")

    # Alternative names and variations
    aliases: List[str] = Field(default_factory=list, description="Known aliases and variations")

    # Contact information (if available)
    email: Optional[str] = Field(None, description="Email address (for person entities)")
    phone: Optional[str] = Field(None, description="Phone number")
    company: Optional[str] = Field(None, description="Company (for person entities)")
    title: Optional[str] = Field(None, description="Job title (for person entities)")

    # Enrichment data
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    # Tracking
    first_seen: datetime = Field(..., description="First occurrence")
    last_seen: datetime = Field(..., description="Most recent occurrence")
    total_mentions: int = Field(default=0, description="Total mentions across all calls")
    call_count: int = Field(default=0, description="Number of calls mentioning this entity")

    # Occurrences
    occurrences: List[EntityOccurrence] = Field(
        default_factory=list,
        description="All occurrences of this entity across calls"
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class EntityResolutionResult(BaseModel):
    """Result of entity resolution process for a single call."""
    call_id: str = Field(..., description="Call ID")

    # Resolution statistics
    raw_entities_count: int = Field(..., description="Number of raw entities extracted")
    resolved_entities_count: int = Field(..., description="Number of canonical entities matched")
    new_entities_created: int = Field(..., description="Number of new canonical entities created")

    # Mappings
    entity_mappings: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Mapping from raw entities to canonical entities"
    )

    # Resolution metadata
    processing_time_seconds: float = Field(..., description="Time taken for resolution")
    confidence_scores: Dict[str, float] = Field(
        default_factory=dict,
        description="Confidence scores for each resolution"
    )

    resolved_at: datetime = Field(default_factory=datetime.utcnow)


class EntitySearchQuery(BaseModel):
    """Query for searching entities."""
    entity_name: str = Field(..., description="Entity name to search for")
    entity_type: Optional[str] = Field(None, description="Filter by entity type")
    min_similarity: float = Field(default=80.0, description="Minimum similarity score (0-100)")
    limit: int = Field(default=10, description="Maximum number of results")


class EntitySearchResult(BaseModel):
    """Search result for entity queries."""
    entity: CanonicalEntity = Field(..., description="Matched canonical entity")
    similarity_score: float = Field(..., description="Similarity score (0-100)")
    match_method: str = Field(..., description="Matching method used")


class EntityMergeRequest(BaseModel):
    """Request to merge duplicate entities."""
    primary_entity_id: str = Field(..., description="Entity to keep")
    duplicate_entity_ids: List[str] = Field(..., description="Entities to merge into primary")
    reason: str = Field(..., description="Reason for merge")


class EntityStats(BaseModel):
    """Statistics about entities in the system."""
    total_entities: int = Field(..., description="Total canonical entities")
    entities_by_type: Dict[str, int] = Field(
        default_factory=dict,
        description="Count by entity type"
    )
    total_mentions: int = Field(..., description="Total entity mentions across all calls")
    most_mentioned_entities: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Top entities by mention count"
    )
    recent_entities: List[CanonicalEntity] = Field(
        default_factory=list,
        description="Recently discovered entities"
    )
