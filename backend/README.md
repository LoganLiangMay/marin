# Audio Call Data Ingestion Pipeline - FastAPI Backend

FastAPI-based REST API for processing and analyzing sales call recordings with AI-powered transcription and insights.

## Features

- **RESTful API** with FastAPI and automatic OpenAPI documentation
- **Async/await** architecture for high performance
- **Pydantic 2.0** for data validation and settings management
- **MongoDB** for document storage (Motor async driver)
- **Redis** for caching and rate limiting
- **S3** for audio file storage
- **SQS** for async task queuing
- **Structured logging** in JSON format
- **Docker** support with multi-stage builds
- **Comprehensive tests** with pytest

## Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── core/
│   ├── config.py          # Pydantic settings from env vars
│   ├── dependencies.py    # Dependency injection
│   └── security.py        # Auth helpers (placeholder for Epic 5)
├── api/
│   └── v1/
│       ├── calls.py       # Call endpoints (placeholder)
│       └── health.py      # Health check endpoint
├── services/
│   ├── s3_service.py      # S3 operations
│   ├── db_service.py      # MongoDB operations
│   └── queue_service.py   # SQS operations
├── models/
│   └── call.py            # Pydantic models
├── tests/
│   ├── test_health.py     # Health endpoint tests
│   ├── test_config.py     # Configuration tests
│   └── conftest.py        # pytest fixtures
├── requirements.txt
├── Dockerfile.api
└── .env.example
```

## Prerequisites

- Python 3.11+
- MongoDB Atlas cluster (Story 1.4)
- Redis ElastiCache (Story 1.5)
- AWS S3 buckets (Story 1.3)
- AWS SQS queue (Story 2.3)
- OpenAI API key

## Installation

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the application:**
   ```bash
   uvicorn main:app --reload
   ```

4. **Access the API:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc
   - Health check: http://localhost:8000/api/v1/health

### Docker Deployment

1. **Build the image:**
   ```bash
   docker build -t audio-pipeline-api -f Dockerfile.api .
   ```

2. **Run the container:**
   ```bash
   docker run -p 8000:8000 \
     --env-file .env \
     audio-pipeline-api
   ```

## Configuration

All configuration is managed through environment variables (see `.env.example`):

### Required Settings

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_REGION` | AWS region | `us-east-1` |
| `S3_BUCKET_AUDIO` | S3 bucket for audio files | `audio-pipeline-dev-audio` |
| `S3_BUCKET_TRANSCRIPTS` | S3 bucket for transcripts | `audio-pipeline-dev-transcripts` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster...` |
| `REDIS_ENDPOINT` | Redis endpoint | `cluster.cache.amazonaws.com:6379` |
| `SQS_QUEUE_URL` | SQS queue URL | `https://sqs.us-east-1.amazonaws...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

### Optional Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `False` |
| `API_V1_PREFIX` | API version prefix | `/api/v1` |
| `CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:3000"]` |
| `PORT` | Server port | `8000` |

## API Endpoints

### Health Check
```
GET /api/v1/health
```
Returns service health status (200 OK if healthy).

### Calls (Placeholders)
```
GET /api/v1/calls        # List calls (Story 2.2)
POST /api/v1/calls/upload  # Upload call audio (Story 2.2)
```

## Testing

### Run all tests:
```bash
pytest
```

### Run with coverage:
```bash
pytest --cov=backend --cov-report=html
```

### Run specific test file:
```bash
pytest tests/test_health.py -v
```

## Development

### Code formatting:
```bash
black backend/
```

### Linting:
```bash
flake8 backend/
```

### Type checking:
```bash
mypy backend/
```

## Architecture

### Async Design
- Uses `async/await` for non-blocking I/O
- Motor for async MongoDB operations
- aioredis for async Redis operations
- FastAPI handles concurrent requests efficiently

### Service Layer
- **S3Service**: Audio file storage and retrieval
- **DBService**: MongoDB CRUD operations
- **QueueService**: SQS message publishing

### Dependency Injection
- MongoDB and Redis connections are managed via FastAPI dependencies
- Singleton pattern for service instances
- Proper cleanup on application shutdown

### Configuration Management
- Pydantic Settings for type-safe config
- Loads from `.env` file or environment variables
- Validates required settings on startup

## Logging

Structured JSON logging is configured by default:

```json
{
  "timestamp": "2025-11-04T12:00:00+00:00",
  "level": "INFO",
  "name": "backend.services.s3_service",
  "message": "Uploaded audio to s3://bucket/key"
}
```

## Security

### Current Implementation
- CORS configured for allowed origins
- Health check endpoint is public (no auth required)
- Other endpoints are placeholders

### Epic 5 (Future)
- AWS Cognito JWT authentication
- Role-based access control
- API rate limiting

## Celery Workers

### Overview

Celery workers process async tasks in dedicated queues:
- **transcription**: OpenAI Whisper audio transcription (Story 2.5)
- **analysis**: GPT-4o AI analysis of transcripts (Story 3.1-3.2)
- **embedding**: Bedrock Titan embedding generation (Epic 4)

### Running Workers Locally

```bash
# Install dependencies (including celery[sqs])
pip install -r requirements.txt

# Run worker for all queues
celery -A celery_app worker --loglevel=info -Q transcription,analysis,embedding

# Run worker for specific queue
celery -A celery_app worker --loglevel=info -Q analysis
```

### Docker Deployment

```bash
# Build worker image
docker build -t audio-pipeline-worker -f Dockerfile.worker .

# Run worker container
docker run \
  --env-file .env \
  audio-pipeline-worker
```

### Task Pipeline

The processing pipeline automatically chains tasks:

1. **Upload** → API stores audio in S3, publishes to SQS
2. **Transcription** → Worker transcribes with Whisper → MongoDB
3. **Analysis** → Worker analyzes with GPT-4o → MongoDB
4. **Embedding** → Worker generates embeddings → OpenSearch (Epic 4)

### Monitoring Workers

```bash
# Check worker status
celery -A celery_app inspect active

# Check registered tasks
celery -A celery_app inspect registered

# Monitor task stats
celery -A celery_app inspect stats
```

### Worker Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `CELERY_CONCURRENCY` | Worker processes | 2 |
| `CELERY_MAX_TASKS_PER_CHILD` | Tasks before restart | 1000 |
| `CELERY_TASK_TIME_LIMIT` | Hard timeout (seconds) | 3600 |

## Task Reference

### Transcription Tasks

**`tasks.transcription.transcribe_audio`**
- Downloads audio from S3
- Transcribes using OpenAI Whisper API
- Saves transcript to MongoDB and S3
- Triggers analysis task
- Cost: ~$0.006 per minute of audio

### Analysis Tasks

**`tasks.analysis.analyze_call`**
- Retrieves transcript from MongoDB
- Performs consolidated GPT-4o analysis
- Extracts entities, sentiment, pain points, objections
- Validates analysis quality
- Saves results to MongoDB
- Cost: ~$0.15 per call (target)

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB URI in `.env`
- Check network connectivity to MongoDB Atlas
- Ensure IP whitelist includes your server

### Redis Connection Issues
- Verify Redis endpoint and password
- Check SSL/TLS configuration
- Ensure security group allows connection

### S3 Access Issues
- Verify AWS credentials
- Check IAM permissions for S3 buckets
- Ensure bucket names match configuration

## References

- Epic: `docs/epics.md` (Epic 2, Story 2.1)
- Architecture: `docs/stories/audio-ingestion-pipeline-architecture.md`
- FastAPI Documentation: https://fastapi.tiangolo.com
- Pydantic Documentation: https://docs.pydantic.dev
