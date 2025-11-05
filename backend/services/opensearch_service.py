"""
OpenSearch service for vector search operations.
Handles indexing and searching of call transcript embeddings.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection, exceptions
from requests_aws4auth import AWS4Auth

logger = logging.getLogger(__name__)


class OpenSearchService:
    """Service for OpenSearch Serverless vector search operations."""

    def __init__(self, endpoint: str, region: str, index_name: str):
        """
        Initialize OpenSearch service with AWS Sigv4 auth.

        Args:
            endpoint: OpenSearch Serverless collection endpoint
            region: AWS region
            index_name: Name of the vector search index
        """
        self.endpoint = endpoint.replace('https://', '').replace('http://', '')
        self.region = region
        self.index_name = index_name

        # Get AWS credentials for Sigv4 auth
        credentials = boto3.Session().get_credentials()
        self.awsauth = AWS4Auth(
            credentials.access_key,
            credentials.secret_key,
            region,
            'aoss',  # AWS OpenSearch Serverless service
            session_token=credentials.token
        )

        # Initialize OpenSearch client
        self.client = OpenSearch(
            hosts=[{'host': self.endpoint, 'port': 443}],
            http_auth=self.awsauth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection,
            timeout=30,
            max_retries=3,
            retry_on_timeout=True
        )

        logger.info(f"OpenSearch service initialized for endpoint: {self.endpoint}")

    def create_index(self, index_config: Dict[str, Any]) -> bool:
        """
        Create vector search index with specified configuration.

        Args:
            index_config: Index configuration with settings and mappings

        Returns:
            bool: True if index created or already exists

        Raises:
            Exception: If index creation fails
        """
        try:
            if self.client.indices.exists(index=self.index_name):
                logger.info(f"Index {self.index_name} already exists")
                return True

            response = self.client.indices.create(
                index=self.index_name,
                body=index_config
            )

            logger.info(f"Created index {self.index_name}: {response}")
            return True

        except exceptions.RequestError as e:
            if 'resource_already_exists_exception' in str(e):
                logger.info(f"Index {self.index_name} already exists")
                return True
            logger.error(f"Failed to create index: {e}")
            raise

    async def index_document(
        self,
        doc_id: str,
        vector: List[float],
        text: str,
        call_id: str,
        chunk_index: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Index a document with its vector embedding.

        Args:
            doc_id: Unique document ID (chunk_id)
            vector: Embedding vector (1536 dimensions for Titan v2)
            text: Text content of the chunk
            call_id: ID of the call this chunk belongs to
            chunk_index: Index of this chunk in the call
            metadata: Additional metadata (company_name, call_type, etc.)

        Returns:
            dict: OpenSearch response

        Raises:
            Exception: If indexing fails
        """
        try:
            document = {
                'embedding': vector,
                'text': text,
                'call_id': call_id,
                'chunk_id': doc_id,
                'chunk_index': chunk_index,
                'timestamp': datetime.utcnow().isoformat(),
                'metadata': metadata or {}
            }

            response = self.client.index(
                index=self.index_name,
                id=doc_id,
                body=document,
                refresh=True  # Make immediately searchable
            )

            logger.info(f"Indexed document {doc_id} for call {call_id}")
            return response

        except Exception as e:
            logger.error(f"Failed to index document {doc_id}: {e}", exc_info=True)
            raise

    async def vector_search(
        self,
        query_vector: List[float],
        k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        min_score: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents using vector similarity.

        Args:
            query_vector: Query embedding vector
            k: Number of results to return
            filters: Optional filters (call_id, date range, metadata fields)
            min_score: Minimum similarity score (0-1)

        Returns:
            list: Search results with score, text, and metadata

        Raises:
            Exception: If search fails
        """
        try:
            # Build k-NN query
            query = {
                'size': k,
                'min_score': min_score,
                'query': {
                    'knn': {
                        'embedding': {
                            'vector': query_vector,
                            'k': k
                        }
                    }
                }
            }

            # Add filters if provided
            if filters:
                filter_clauses = []
                for field, value in filters.items():
                    if isinstance(value, dict):
                        # Range query
                        filter_clauses.append({'range': {field: value}})
                    else:
                        # Term query
                        filter_clauses.append({'term': {field: value}})

                query['query'] = {
                    'bool': {
                        'must': [query['query']],
                        'filter': filter_clauses
                    }
                }

            response = self.client.search(index=self.index_name, body=query)

            # Parse results
            results = []
            for hit in response['hits']['hits']:
                results.append({
                    'score': hit['_score'],
                    'call_id': hit['_source']['call_id'],
                    'chunk_id': hit['_source']['chunk_id'],
                    'chunk_index': hit['_source']['chunk_index'],
                    'text': hit['_source']['text'],
                    'metadata': hit['_source'].get('metadata', {}),
                    'timestamp': hit['_source'].get('timestamp')
                })

            logger.info(f"Vector search returned {len(results)} results")
            return results

        except Exception as e:
            logger.error(f"Vector search failed: {e}", exc_info=True)
            raise

    async def hybrid_search(
        self,
        query_vector: List[float],
        query_text: str,
        k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        vector_weight: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Hybrid search combining vector similarity and keyword matching.

        Args:
            query_vector: Query embedding vector
            query_text: Query text for keyword matching
            k: Number of results to return
            filters: Optional filters
            vector_weight: Weight for vector score (0-1), keyword weight is (1 - vector_weight)

        Returns:
            list: Search results with combined score

        Raises:
            Exception: If search fails
        """
        try:
            query = {
                'size': k,
                'query': {
                    'bool': {
                        'should': [
                            {
                                'knn': {
                                    'embedding': {
                                        'vector': query_vector,
                                        'k': k,
                                        'boost': vector_weight
                                    }
                                }
                            },
                            {
                                'match': {
                                    'text': {
                                        'query': query_text,
                                        'boost': 1 - vector_weight
                                    }
                                }
                            }
                        ],
                        'minimum_should_match': 1
                    }
                }
            }

            # Add filters
            if filters:
                filter_clauses = []
                for field, value in filters.items():
                    if isinstance(value, dict):
                        filter_clauses.append({'range': {field: value}})
                    else:
                        filter_clauses.append({'term': {field: value}})
                query['query']['bool']['filter'] = filter_clauses

            response = self.client.search(index=self.index_name, body=query)

            # Parse results
            results = []
            for hit in response['hits']['hits']:
                results.append({
                    'score': hit['_score'],
                    'call_id': hit['_source']['call_id'],
                    'chunk_id': hit['_source']['chunk_id'],
                    'chunk_index': hit['_source']['chunk_index'],
                    'text': hit['_source']['text'],
                    'metadata': hit['_source'].get('metadata', {}),
                    'timestamp': hit['_source'].get('timestamp')
                })

            logger.info(f"Hybrid search returned {len(results)} results")
            return results

        except Exception as e:
            logger.error(f"Hybrid search failed: {e}", exc_info=True)
            raise

    async def delete_document(self, doc_id: str) -> Dict[str, Any]:
        """
        Delete a document from the index.

        Args:
            doc_id: Document ID to delete

        Returns:
            dict: OpenSearch response

        Raises:
            Exception: If deletion fails
        """
        try:
            response = self.client.delete(
                index=self.index_name,
                id=doc_id,
                refresh=True
            )

            logger.info(f"Deleted document {doc_id}")
            return response

        except exceptions.NotFoundError:
            logger.warning(f"Document {doc_id} not found for deletion")
            return {'result': 'not_found'}
        except Exception as e:
            logger.error(f"Failed to delete document {doc_id}: {e}", exc_info=True)
            raise

    async def delete_by_call_id(self, call_id: str) -> Dict[str, Any]:
        """
        Delete all documents for a specific call.

        Args:
            call_id: Call ID to delete documents for

        Returns:
            dict: Delete response with count

        Raises:
            Exception: If deletion fails
        """
        try:
            query = {
                'query': {
                    'term': {
                        'call_id': call_id
                    }
                }
            }

            response = self.client.delete_by_query(
                index=self.index_name,
                body=query,
                refresh=True
            )

            deleted_count = response.get('deleted', 0)
            logger.info(f"Deleted {deleted_count} documents for call {call_id}")
            return response

        except Exception as e:
            logger.error(f"Failed to delete documents for call {call_id}: {e}", exc_info=True)
            raise

    async def bulk_index(self, documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Bulk index multiple documents.

        Args:
            documents: List of documents to index, each with:
                - doc_id, vector, text, call_id, chunk_index, metadata

        Returns:
            dict: Bulk response with success/error counts

        Raises:
            Exception: If bulk indexing fails
        """
        try:
            from opensearchpy.helpers import bulk

            actions = []
            for doc in documents:
                action = {
                    '_index': self.index_name,
                    '_id': doc['doc_id'],
                    '_source': {
                        'embedding': doc['vector'],
                        'text': doc['text'],
                        'call_id': doc['call_id'],
                        'chunk_id': doc['doc_id'],
                        'chunk_index': doc['chunk_index'],
                        'timestamp': datetime.utcnow().isoformat(),
                        'metadata': doc.get('metadata', {})
                    }
                }
                actions.append(action)

            success, failed = bulk(
                self.client,
                actions,
                stats_only=True,
                raise_on_error=False
            )

            logger.info(f"Bulk indexed {success} documents, {failed} failed")
            return {'success': success, 'failed': failed}

        except Exception as e:
            logger.error(f"Bulk indexing failed: {e}", exc_info=True)
            raise

    def health_check(self) -> Dict[str, Any]:
        """
        Check OpenSearch connection health.

        Returns:
            dict: Health status

        Raises:
            Exception: If health check fails
        """
        try:
            cluster_health = self.client.cluster.health()
            index_exists = self.client.indices.exists(index=self.index_name)

            return {
                'status': 'healthy',
                'cluster_health': cluster_health.get('status'),
                'index_exists': index_exists,
                'endpoint': self.endpoint,
                'index_name': self.index_name
            }

        except Exception as e:
            logger.error(f"Health check failed: {e}", exc_info=True)
            return {
                'status': 'unhealthy',
                'error': str(e),
                'endpoint': self.endpoint,
                'index_name': self.index_name
            }


# Singleton instance
_opensearch_service: Optional[OpenSearchService] = None


def get_opensearch_service(endpoint: str, region: str, index_name: str) -> OpenSearchService:
    """
    Get or create OpenSearch service singleton.

    Args:
        endpoint: OpenSearch collection endpoint
        region: AWS region
        index_name: Vector index name

    Returns:
        OpenSearchService: Service instance
    """
    global _opensearch_service

    if _opensearch_service is None:
        _opensearch_service = OpenSearchService(endpoint, region, index_name)

    return _opensearch_service
