"""
Tests for embedding generation task.

Tests the complete flow of generating embeddings using AWS Bedrock Titan
and indexing them in OpenSearch.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import json

from backend.tasks.embedding import (
    generate_embeddings,
    _generate_embedding_bedrock,
    _batch_index_opensearch
)


class TestEmbeddingGeneration:
    """Test suite for embedding generation task."""

    @pytest.fixture
    def mock_call_doc(self):
        """Mock MongoDB call document."""
        return {
            "call_id": "test_call_123",
            "status": "transcribed",
            "transcript": {
                "full_text": "Hello, this is a test call transcript. " * 20,  # ~800 chars
                "segments": [
                    {"start": 0.0, "end": 2.5, "text": "Hello, this is a test call transcript."},
                    {"start": 2.5, "end": 5.0, "text": "Hello, this is a test call transcript."},
                ]
            },
            "metadata": {
                "company_name": "Test Corp",
                "call_type": "sales"
            }
        }

    @pytest.fixture
    def mock_embedding_vector(self):
        """Mock 1536-dimensional embedding vector."""
        return [0.1] * 1536

    @pytest.fixture
    def mock_bedrock_response(self, mock_embedding_vector):
        """Mock Bedrock API response."""
        return {
            'body': MagicMock(read=lambda: json.dumps({
                'embedding': mock_embedding_vector,
                'inputTextTokenCount': 150
            }).encode())
        }

    # Test 1: Successful embedding generation
    @patch('backend.tasks.embedding.MongoClient')
    @patch('backend.tasks.embedding.boto3.client')
    @patch('backend.tasks.embedding.OpenSearchService')
    def test_generate_embeddings_success(
        self, mock_opensearch, mock_boto3, mock_mongo,
        mock_call_doc, mock_bedrock_response
    ):
        """Test successful embedding generation and indexing."""
        # Setup MongoDB mock
        mock_db = Mock()
        mock_collection = Mock()
        mock_collection.find_one.return_value = mock_call_doc
        mock_db.calls = mock_collection
        mock_mongo.return_value.__getitem__.return_value = mock_db

        # Setup Bedrock mock
        mock_bedrock_client = Mock()
        mock_bedrock_client.invoke_model.return_value = mock_bedrock_response
        mock_boto3.return_value = mock_bedrock_client

        # Setup OpenSearch mock
        mock_opensearch_instance = Mock()
        mock_opensearch_instance.bulk_index = MagicMock()
        mock_opensearch.return_value = mock_opensearch_instance

        # Execute task
        result = generate_embeddings.apply(args=["test_call_123"]).get()

        # Verify result
        assert result["status"] == "success"
        assert result["call_id"] == "test_call_123"
        assert result["chunks_indexed"] > 0
        assert "processing_time" in result
        assert "cost" in result

        # Verify MongoDB was updated
        assert mock_collection.update_one.called
        update_call = mock_collection.update_one.call_args
        assert update_call[0][0] == {"call_id": "test_call_123"}
        assert "$set" in update_call[0][1]
        assert update_call[0][1]["$set"]["status"] == "indexed"

    # Test 2: Already indexed (idempotency)
    @patch('backend.tasks.embedding.MongoClient')
    def test_generate_embeddings_already_indexed(self, mock_mongo, mock_call_doc):
        """Test that already indexed calls are skipped."""
        # Setup mock with indexed status
        mock_call_doc["status"] = "indexed"
        mock_call_doc["embeddings"] = {"chunk_count": 10}

        mock_db = Mock()
        mock_collection = Mock()
        mock_collection.find_one.return_value = mock_call_doc
        mock_db.calls = mock_collection
        mock_mongo.return_value.__getitem__.return_value = mock_db

        # Execute task
        result = generate_embeddings.apply(args=["test_call_123"]).get()

        # Verify result
        assert result["status"] == "already_indexed"
        assert result["chunks_indexed"] == 10

        # Verify no update was made
        assert not mock_collection.update_one.called

    # Test 3: Call not found
    @patch('backend.tasks.embedding.MongoClient')
    def test_generate_embeddings_call_not_found(self, mock_mongo):
        """Test error handling when call_id not found."""
        # Setup mock with None result
        mock_db = Mock()
        mock_collection = Mock()
        mock_collection.find_one.return_value = None
        mock_db.calls = mock_collection
        mock_mongo.return_value.__getitem__.return_value = mock_db

        # Execute task and expect ValueError
        with pytest.raises(ValueError, match="Call not found"):
            generate_embeddings.apply(args=["nonexistent_call"]).get()

    # Test 4: No transcript
    @patch('backend.tasks.embedding.MongoClient')
    def test_generate_embeddings_no_transcript(self, mock_mongo, mock_call_doc):
        """Test handling of call with no transcript."""
        # Setup mock with empty transcript
        mock_call_doc["transcript"] = {"full_text": ""}

        mock_db = Mock()
        mock_collection = Mock()
        mock_collection.find_one.return_value = mock_call_doc
        mock_db.calls = mock_collection
        mock_mongo.return_value.__getitem__.return_value = mock_db

        # Execute task
        result = generate_embeddings.apply(args=["test_call_123"]).get()

        # Verify result
        assert result["status"] == "no_transcript"

    # Test 5: Bedrock embedding generation
    def test_generate_embedding_bedrock(self, mock_bedrock_response, mock_embedding_vector):
        """Test Bedrock Titan embedding generation."""
        mock_client = Mock()
        mock_client.invoke_model.return_value = mock_bedrock_response

        embedding = _generate_embedding_bedrock(mock_client, "Test text")

        # Verify correct model and parameters
        assert mock_client.invoke_model.called
        call_args = mock_client.invoke_model.call_args
        assert call_args[1]['modelId'] == 'amazon.titan-embed-text-v2:0'

        # Verify request body
        body = json.loads(call_args[1]['body'])
        assert body['inputText'] == "Test text"
        assert body['dimensions'] == 1536
        assert body['normalize'] is True

        # Verify embedding
        assert len(embedding) == 1536
        assert embedding == mock_embedding_vector

    # Test 6: Bedrock embedding dimension validation
    def test_generate_embedding_invalid_dimensions(self):
        """Test error handling for invalid embedding dimensions."""
        mock_client = Mock()
        mock_response = {
            'body': MagicMock(read=lambda: json.dumps({
                'embedding': [0.1] * 512  # Wrong dimension
            }).encode())
        }
        mock_client.invoke_model.return_value = mock_response

        with pytest.raises(ValueError, match="Expected 1536 dimensions"):
            _generate_embedding_bedrock(mock_client, "Test text")

    # Test 7: Batch indexing OpenSearch
    @patch('backend.tasks.embedding.asyncio')
    def test_batch_index_opensearch(self, mock_asyncio):
        """Test batch indexing in OpenSearch."""
        mock_opensearch = Mock()
        mock_loop = Mock()
        mock_asyncio.new_event_loop.return_value = mock_loop

        embeddings_batch = [
            {
                "doc_id": "test_call_123_chunk_0",
                "vector": [0.1] * 1536,
                "text": "Test chunk",
                "call_id": "test_call_123",
                "chunk_index": 0,
                "metadata": {"company_name": "Test Corp"}
            }
        ]

        _batch_index_opensearch(mock_opensearch, embeddings_batch)

        # Verify bulk_index was called
        assert mock_loop.run_until_complete.called

    # Test 8: Cost calculation
    @patch('backend.tasks.embedding.MongoClient')
    @patch('backend.tasks.embedding.boto3.client')
    @patch('backend.tasks.embedding.OpenSearchService')
    def test_cost_calculation(
        self, mock_opensearch, mock_boto3, mock_mongo,
        mock_call_doc, mock_bedrock_response
    ):
        """Test that cost is calculated correctly."""
        # Setup mocks (similar to test 1)
        mock_db = Mock()
        mock_collection = Mock()
        mock_collection.find_one.return_value = mock_call_doc
        mock_db.calls = mock_collection
        mock_mongo.return_value.__getitem__.return_value = mock_db

        mock_bedrock_client = Mock()
        mock_bedrock_client.invoke_model.return_value = mock_bedrock_response
        mock_boto3.return_value = mock_bedrock_client

        mock_opensearch_instance = Mock()
        mock_opensearch.return_value = mock_opensearch_instance

        # Execute task
        result = generate_embeddings.apply(args=["test_call_123"]).get()

        # Verify cost is calculated
        assert "cost" in result
        assert result["cost"] > 0
        assert isinstance(result["cost"], float)

    # Test 9: Processing time tracking
    @patch('backend.tasks.embedding.MongoClient')
    @patch('backend.tasks.embedding.boto3.client')
    @patch('backend.tasks.embedding.OpenSearchService')
    def test_processing_time_tracking(
        self, mock_opensearch, mock_boto3, mock_mongo,
        mock_call_doc, mock_bedrock_response
    ):
        """Test that processing time is tracked."""
        # Setup mocks
        mock_db = Mock()
        mock_collection = Mock()
        mock_collection.find_one.return_value = mock_call_doc
        mock_db.calls = mock_collection
        mock_mongo.return_value.__getitem__.return_value = mock_db

        mock_bedrock_client = Mock()
        mock_bedrock_client.invoke_model.return_value = mock_bedrock_response
        mock_boto3.return_value = mock_bedrock_client

        mock_opensearch_instance = Mock()
        mock_opensearch.return_value = mock_opensearch_instance

        # Execute task
        result = generate_embeddings.apply(args=["test_call_123"]).get()

        # Verify processing time is tracked
        assert "processing_time" in result
        assert result["processing_time"] >= 0
        assert isinstance(result["processing_time"], float)

    # Test 10: MongoDB metadata update
    @patch('backend.tasks.embedding.MongoClient')
    @patch('backend.tasks.embedding.boto3.client')
    @patch('backend.tasks.embedding.OpenSearchService')
    def test_mongodb_metadata_update(
        self, mock_opensearch, mock_boto3, mock_mongo,
        mock_call_doc, mock_bedrock_response
    ):
        """Test that MongoDB is updated with complete metadata."""
        # Setup mocks
        mock_db = Mock()
        mock_collection = Mock()
        mock_collection.find_one.return_value = mock_call_doc
        mock_db.calls = mock_collection
        mock_mongo.return_value.__getitem__.return_value = mock_db

        mock_bedrock_client = Mock()
        mock_bedrock_client.invoke_model.return_value = mock_bedrock_response
        mock_boto3.return_value = mock_bedrock_client

        mock_opensearch_instance = Mock()
        mock_opensearch.return_value = mock_opensearch_instance

        # Execute task
        generate_embeddings.apply(args=["test_call_123"]).get()

        # Verify MongoDB update
        update_call = mock_collection.update_one.call_args[0][1]
        metadata = update_call["$set"]["processing_metadata.embeddings"]

        assert metadata["model"] == "amazon.titan-embed-text-v2:0"
        assert metadata["provider"] == "aws-bedrock"
        assert metadata["chunk_count"] > 0
        assert metadata["processing_time_seconds"] >= 0
        assert metadata["cost_usd"] >= 0
