"""
Integration tests for OpenSearch service (Story 4.1).
Tests vector search indexing and querying.
"""

import pytest
import os
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime

# Set test environment variables
os.environ.setdefault("AWS_REGION", "us-east-1")
os.environ.setdefault("S3_BUCKET_AUDIO", "test-audio-bucket")
os.environ.setdefault("S3_BUCKET_TRANSCRIPTS", "test-transcripts-bucket")
os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017/test_db")
os.environ.setdefault("REDIS_ENDPOINT", "localhost:6379")
os.environ.setdefault("SQS_QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123456789/test-queue")
os.environ.setdefault("OPENAI_API_KEY", "test-key")
os.environ.setdefault("OPENSEARCH_ENDPOINT", "test-collection.us-east-1.aoss.amazonaws.com")

from backend.services.opensearch_service import OpenSearchService, get_opensearch_service


class TestOpenSearchService:
    """Test suite for OpenSearch service."""

    @pytest.fixture
    def mock_opensearch_client(self):
        """Mock OpenSearch client."""
        with patch('backend.services.opensearch_service.OpenSearch') as mock_client:
            client_instance = MagicMock()
            mock_client.return_value = client_instance
            yield client_instance

    @pytest.fixture
    def opensearch_service(self, mock_opensearch_client):
        """Create OpenSearch service with mocked client."""
        service = OpenSearchService(
            endpoint="test-collection.us-east-1.aoss.amazonaws.com",
            region="us-east-1",
            index_name="test-index"
        )
        service.client = mock_opensearch_client
        return service

    def test_service_initialization(self, opensearch_service):
        """Test OpenSearch service initialization."""
        assert opensearch_service.endpoint == "test-collection.us-east-1.aoss.amazonaws.com"
        assert opensearch_service.region == "us-east-1"
        assert opensearch_service.index_name == "test-index"

    def test_create_index_success(self, opensearch_service, mock_opensearch_client):
        """Test successful index creation."""
        # Mock indices.exists to return False (index doesn't exist)
        mock_opensearch_client.indices.exists.return_value = False

        # Mock indices.create
        mock_opensearch_client.indices.create.return_value = {
            'acknowledged': True,
            'shards_acknowledged': True,
            'index': 'test-index'
        }

        index_config = {
            'settings': {'index': {'knn': True}},
            'mappings': {'properties': {}}
        }

        result = opensearch_service.create_index(index_config)

        assert result is True
        mock_opensearch_client.indices.create.assert_called_once()

    def test_create_index_already_exists(self, opensearch_service, mock_opensearch_client):
        """Test creating index that already exists."""
        # Mock indices.exists to return True
        mock_opensearch_client.indices.exists.return_value = True

        index_config = {'settings': {}, 'mappings': {}}
        result = opensearch_service.create_index(index_config)

        assert result is True
        # create should not be called
        mock_opensearch_client.indices.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_index_document_success(self, opensearch_service, mock_opensearch_client):
        """Test successful document indexing."""
        # Mock index response
        mock_opensearch_client.index.return_value = {
            '_index': 'test-index',
            '_id': 'doc123',
            'result': 'created'
        }

        vector = [0.1] * 1536  # 1536-dimensional vector
        response = await opensearch_service.index_document(
            doc_id='doc123',
            vector=vector,
            text='Test transcript chunk',
            call_id='call123',
            chunk_index=0,
            metadata={'company_name': 'Test Corp'}
        )

        assert response['result'] == 'created'
        assert response['_id'] == 'doc123'
        mock_opensearch_client.index.assert_called_once()

        # Verify document structure
        call_args = mock_opensearch_client.index.call_args
        assert call_args.kwargs['index'] == 'test-index'
        assert call_args.kwargs['id'] == 'doc123'
        assert 'embedding' in call_args.kwargs['body']
        assert 'text' in call_args.kwargs['body']
        assert 'call_id' in call_args.kwargs['body']

    @pytest.mark.asyncio
    async def test_vector_search_success(self, opensearch_service, mock_opensearch_client):
        """Test vector similarity search."""
        # Mock search response
        mock_opensearch_client.search.return_value = {
            'hits': {
                'hits': [
                    {
                        '_score': 0.95,
                        '_source': {
                            'call_id': 'call123',
                            'chunk_id': 'chunk1',
                            'chunk_index': 0,
                            'text': 'Similar text content',
                            'metadata': {'company_name': 'Test Corp'},
                            'timestamp': '2025-11-04T12:00:00Z'
                        }
                    },
                    {
                        '_score': 0.85,
                        '_source': {
                            'call_id': 'call456',
                            'chunk_id': 'chunk2',
                            'chunk_index': 1,
                            'text': 'Another similar text',
                            'metadata': {'company_name': 'Acme Inc'},
                            'timestamp': '2025-11-04T13:00:00Z'
                        }
                    }
                ]
            }
        }

        query_vector = [0.5] * 1536
        results = await opensearch_service.vector_search(
            query_vector=query_vector,
            k=10,
            min_score=0.7
        )

        assert len(results) == 2
        assert results[0]['score'] == 0.95
        assert results[0]['call_id'] == 'call123'
        assert results[0]['text'] == 'Similar text content'
        assert results[1]['score'] == 0.85

        mock_opensearch_client.search.assert_called_once()

    @pytest.mark.asyncio
    async def test_vector_search_with_filters(self, opensearch_service, mock_opensearch_client):
        """Test vector search with filters."""
        mock_opensearch_client.search.return_value = {
            'hits': {'hits': []}
        }

        query_vector = [0.5] * 1536
        filters = {
            'call_id': 'call123',
            'metadata.company_name': 'Test Corp'
        }

        await opensearch_service.vector_search(
            query_vector=query_vector,
            k=5,
            filters=filters
        )

        # Verify filter was applied
        call_args = mock_opensearch_client.search.call_args
        query = call_args.kwargs['body']['query']
        assert 'bool' in query
        assert 'filter' in query['bool']

    @pytest.mark.asyncio
    async def test_hybrid_search(self, opensearch_service, mock_opensearch_client):
        """Test hybrid search combining vector and keyword."""
        mock_opensearch_client.search.return_value = {
            'hits': {
                'hits': [
                    {
                        '_score': 1.5,
                        '_source': {
                            'call_id': 'call123',
                            'chunk_id': 'chunk1',
                            'chunk_index': 0,
                            'text': 'Product pricing discussion',
                            'metadata': {},
                            'timestamp': '2025-11-04T12:00:00Z'
                        }
                    }
                ]
            }
        }

        query_vector = [0.5] * 1536
        results = await opensearch_service.hybrid_search(
            query_vector=query_vector,
            query_text='pricing',
            k=10,
            vector_weight=0.7
        )

        assert len(results) == 1
        assert 'pricing' in results[0]['text'].lower()

        # Verify both k-NN and match queries were used
        call_args = mock_opensearch_client.search.call_args
        query = call_args.kwargs['body']['query']
        assert 'bool' in query
        assert 'should' in query['bool']

    @pytest.mark.asyncio
    async def test_delete_document(self, opensearch_service, mock_opensearch_client):
        """Test document deletion."""
        mock_opensearch_client.delete.return_value = {
            'result': 'deleted'
        }

        response = await opensearch_service.delete_document('doc123')

        assert response['result'] == 'deleted'
        mock_opensearch_client.delete.assert_called_once_with(
            index='test-index',
            id='doc123',
            refresh=True
        )

    @pytest.mark.asyncio
    async def test_delete_by_call_id(self, opensearch_service, mock_opensearch_client):
        """Test deleting all documents for a call."""
        mock_opensearch_client.delete_by_query.return_value = {
            'deleted': 10,
            'total': 10
        }

        response = await opensearch_service.delete_by_call_id('call123')

        assert response['deleted'] == 10
        mock_opensearch_client.delete_by_query.assert_called_once()

        # Verify query structure
        call_args = mock_opensearch_client.delete_by_query.call_args
        query = call_args.kwargs['body']['query']
        assert 'term' in query
        assert query['term']['call_id'] == 'call123'

    @pytest.mark.asyncio
    async def test_bulk_index(self, opensearch_service, mock_opensearch_client):
        """Test bulk indexing."""
        with patch('backend.services.opensearch_service.bulk') as mock_bulk:
            mock_bulk.return_value = (5, 0)  # 5 success, 0 failed

            documents = [
                {
                    'doc_id': f'doc{i}',
                    'vector': [0.1] * 1536,
                    'text': f'Text {i}',
                    'call_id': 'call123',
                    'chunk_index': i,
                    'metadata': {}
                }
                for i in range(5)
            ]

            response = await opensearch_service.bulk_index(documents)

            assert response['success'] == 5
            assert response['failed'] == 0
            mock_bulk.assert_called_once()

    def test_health_check_healthy(self, opensearch_service, mock_opensearch_client):
        """Test health check when service is healthy."""
        mock_opensearch_client.cluster.health.return_value = {
            'status': 'green',
            'number_of_nodes': 3
        }
        mock_opensearch_client.indices.exists.return_value = True

        health = opensearch_service.health_check()

        assert health['status'] == 'healthy'
        assert health['cluster_health'] == 'green'
        assert health['index_exists'] is True

    def test_health_check_unhealthy(self, opensearch_service, mock_opensearch_client):
        """Test health check when service is unhealthy."""
        mock_opensearch_client.cluster.health.side_effect = Exception("Connection failed")

        health = opensearch_service.health_check()

        assert health['status'] == 'unhealthy'
        assert 'error' in health

    def test_get_opensearch_service_singleton(self):
        """Test singleton pattern for service."""
        with patch('backend.services.opensearch_service.OpenSearch'):
            service1 = get_opensearch_service(
                endpoint="test.amazonaws.com",
                region="us-east-1",
                index_name="test-index"
            )
            service2 = get_opensearch_service(
                endpoint="test.amazonaws.com",
                region="us-east-1",
                index_name="test-index"
            )

            assert service1 is service2  # Same instance
