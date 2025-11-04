"""
Tests for health check endpoint.
Validates health endpoint returns correct status and response format.
"""

import pytest
from fastapi import status
from datetime import datetime


def test_health_check_returns_200(client):
    """Test that health check returns HTTP 200."""
    response = client.get("/api/v1/health")
    assert response.status_code == status.HTTP_200_OK


def test_health_check_returns_healthy_status(client):
    """Test that health check returns 'healthy' status."""
    response = client.get("/api/v1/health")
    data = response.json()

    assert data["status"] == "healthy"


def test_health_check_includes_timestamp(client):
    """Test that health check includes timestamp."""
    response = client.get("/api/v1/health")
    data = response.json()

    assert "timestamp" in data
    # Validate timestamp format
    timestamp = datetime.fromisoformat(data["timestamp"].replace('Z', '+00:00'))
    assert isinstance(timestamp, datetime)


def test_health_check_includes_version(client):
    """Test that health check includes version."""
    response = client.get("/api/v1/health")
    data = response.json()

    assert "version" in data
    assert isinstance(data["version"], str)
    assert len(data["version"]) > 0


def test_health_check_response_structure(client):
    """Test that health check response has correct structure."""
    response = client.get("/api/v1/health")
    data = response.json()

    # Validate all required fields are present
    required_fields = ["status", "timestamp", "version"]
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"


def test_health_check_no_auth_required(client):
    """Test that health check doesn't require authentication."""
    # Should work without any auth headers
    response = client.get("/api/v1/health")
    assert response.status_code == status.HTTP_200_OK


def test_root_endpoint_returns_info(client):
    """Test root endpoint returns API information."""
    response = client.get("/")
    data = response.json()

    assert response.status_code == status.HTTP_200_OK
    assert "message" in data
    assert "version" in data
    assert "docs" in data
    assert "health" in data


def test_docs_endpoint_accessible(client):
    """Test that Swagger docs endpoint is accessible."""
    response = client.get("/docs")
    assert response.status_code == status.HTTP_200_OK


def test_redoc_endpoint_accessible(client):
    """Test that ReDoc endpoint is accessible."""
    response = client.get("/redoc")
    assert response.status_code == status.HTTP_200_OK
