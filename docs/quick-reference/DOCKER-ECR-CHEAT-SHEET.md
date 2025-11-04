# Docker & AWS ECR Quick Reference - Marin Project

**Quick reference for Docker and ECR commands used during Marin application deployment**

---

## 🐳 Docker Installation & Setup

```bash
# Verify Docker installation
docker --version
docker info

# Start Docker daemon (if not running)
# macOS: Start Docker Desktop
# Linux:
sudo systemctl start docker
sudo systemctl enable docker  # Auto-start on boot

# Add user to docker group (Linux - avoid using sudo)
sudo usermod -aG docker $USER
newgrp docker  # Activate group changes

# Test Docker
docker run hello-world
```

---

## 🏗️ Building Images (Marin Project)

### API Image

```bash
# Navigate to backend directory
cd backend

# Build API image
docker build -f Dockerfile -t marin-api:dev .

# Build with no cache (force rebuild)
docker build --no-cache -f Dockerfile -t marin-api:dev .

# Build with build args
docker build \
  --build-arg PYTHON_VERSION=3.11 \
  -f Dockerfile \
  -t marin-api:dev \
  .

# Build for specific platform (M1/M2 Macs)
docker build --platform linux/amd64 -f Dockerfile -t marin-api:dev .
```

### Worker Image

```bash
# Build Worker image
docker build -f Dockerfile.worker -t marin-worker:dev .

# Build both images in parallel
docker build -f Dockerfile -t marin-api:dev . &
docker build -f Dockerfile.worker -t marin-worker:dev . &
wait
```

---

## 🏷️ Image Tagging

```bash
# Tag image for ECR
docker tag marin-api:dev ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/marin-dev-api:dev

# Tag with multiple tags
docker tag marin-api:dev ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/marin-dev-api:dev
docker tag marin-api:dev ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/marin-dev-api:latest
docker tag marin-api:dev ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/marin-dev-api:v1.0.0

# Tag using environment variables
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export API_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/marin-dev-api"
docker tag marin-api:dev $API_REPO:dev
```

---

## 📋 Image Management

```bash
# List images
docker images

# List images with filter
docker images | grep marin

# Remove image
docker rmi marin-api:dev

# Remove multiple images
docker rmi marin-api:dev marin-worker:dev

# Remove dangling images (untagged)
docker image prune

# Remove all unused images
docker image prune -a

# Remove by image ID
docker rmi IMAGE_ID

# Force remove (even if container running)
docker rmi -f IMAGE_ID

# Get image details
docker inspect marin-api:dev

# Get image size
docker images marin-api:dev --format "{{.Size}}"

# Get image history (layers)
docker history marin-api:dev
```

---

## 🚀 Running Containers Locally

```bash
# Run API container
docker run -d \
  --name marin-api \
  -p 8000:8000 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e REDIS_ENDPOINT="redis://localhost:6379" \
  marin-api:dev

# Run with environment file
docker run -d \
  --name marin-api \
  -p 8000:8000 \
  --env-file .env \
  marin-api:dev

# Run worker container
docker run -d \
  --name marin-worker \
  -e MONGODB_URI="mongodb+srv://..." \
  -e REDIS_ENDPOINT="redis://localhost:6379" \
  marin-worker:dev

# Run with volume mount (for development)
docker run -d \
  --name marin-api-dev \
  -p 8000:8000 \
  -v $(pwd):/app \
  marin-api:dev

# Run interactively (debugging)
docker run -it --rm marin-api:dev /bin/bash

# Run with specific entrypoint
docker run -it --rm --entrypoint /bin/bash marin-api:dev
```

---

## 🔍 Container Management

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop container
docker stop marin-api

# Start stopped container
docker start marin-api

# Restart container
docker restart marin-api

# Remove container
docker rm marin-api

# Remove running container (force)
docker rm -f marin-api

# View container logs
docker logs marin-api

# Follow logs (tail -f)
docker logs -f marin-api

# View last 100 lines
docker logs --tail 100 marin-api

# Execute command in running container
docker exec marin-api ls /app

# Interactive shell in running container
docker exec -it marin-api /bin/bash

# Copy files from container
docker cp marin-api:/app/logs/app.log ./app.log

# Copy files to container
docker cp ./config.yml marin-api:/app/config.yml

# Get container stats
docker stats marin-api

# Inspect container
docker inspect marin-api
```

---

## 🌐 Docker Compose (Local Development)

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_ENDPOINT=redis://redis:6379
    depends_on:
      - redis

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.worker
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_ENDPOINT=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Docker Compose Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Build and start
docker-compose up --build

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs

# Follow logs for specific service
docker-compose logs -f api

# Scale service
docker-compose up -d --scale worker=3

# Execute command in service
docker-compose exec api python manage.py migrate

# List running services
docker-compose ps
```

---

## 🔐 AWS ECR Authentication

```bash
# Get AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR (Docker CLI v2)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# Login with explicit account ID
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Verify login
docker info | grep ecr

# Login for multiple repositories
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com
```

---

## 📤 Pushing to ECR

### Get Repository URLs from Terraform

```bash
cd terraform

# Get API repository URL
export API_REPO=$(terraform output -raw ecr_api_repository_url)

# Get Worker repository URL
export WORKER_REPO=$(terraform output -raw ecr_worker_repository_url)

echo "API Repo: $API_REPO"
echo "Worker Repo: $WORKER_REPO"
```

### Push Images

```bash
# Tag and push API image
docker tag marin-api:dev $API_REPO:dev
docker push $API_REPO:dev

# Tag and push with multiple tags
docker tag marin-api:dev $API_REPO:dev
docker tag marin-api:dev $API_REPO:latest
docker tag marin-api:dev $API_REPO:v1.0.0
docker push $API_REPO:dev
docker push $API_REPO:latest
docker push $API_REPO:v1.0.0

# Tag and push Worker image
docker tag marin-worker:dev $WORKER_REPO:dev
docker push $WORKER_REPO:dev

# Push all tags
docker push --all-tags $API_REPO
```

---

## 📥 Pulling from ECR

```bash
# Pull specific tag
docker pull $API_REPO:dev

# Pull latest
docker pull $API_REPO:latest

# Pull and run
docker pull $API_REPO:dev
docker run -d -p 8000:8000 $API_REPO:dev
```

---

## 🔍 ECR Repository Management

```bash
# List repositories
aws ecr describe-repositories

# Get repository details
aws ecr describe-repositories --repository-names marin-dev-api

# Create repository (if not using Terraform)
aws ecr create-repository \
  --repository-name marin-dev-api \
  --image-scanning-configuration scanOnPush=true \
  --region us-east-1

# Delete repository
aws ecr delete-repository \
  --repository-name marin-dev-api \
  --force

# List images in repository
aws ecr list-images --repository-name marin-dev-api

# Describe images
aws ecr describe-images --repository-name marin-dev-api

# Get image manifest
aws ecr batch-get-image \
  --repository-name marin-dev-api \
  --image-ids imageTag=dev

# Delete image
aws ecr batch-delete-image \
  --repository-name marin-dev-api \
  --image-ids imageTag=dev

# Delete untagged images
aws ecr list-images \
  --repository-name marin-dev-api \
  --filter tagStatus=UNTAGGED \
  --query 'imageIds[*]' \
  --output json | \
jq -r '.[] | "--image-ids imageDigest=\(.imageDigest)"' | \
xargs -n 1 aws ecr batch-delete-image --repository-name marin-dev-api
```

---

## 🔒 Image Scanning

```bash
# Start image scan
aws ecr start-image-scan \
  --repository-name marin-dev-api \
  --image-id imageTag=dev

# Get scan results
aws ecr describe-image-scan-findings \
  --repository-name marin-dev-api \
  --image-id imageTag=dev

# Wait for scan to complete
aws ecr wait image-scan-complete \
  --repository-name marin-dev-api \
  --image-id imageTag=dev
```

---

## 🎯 Complete Workflow (Dev Environment)

```bash
#!/bin/bash
# build-and-deploy.sh

set -e  # Exit on error

# Configuration
ENVIRONMENT="dev"
VERSION="v$(date +%Y%m%d-%H%M%S)"

echo "Building Marin images for $ENVIRONMENT..."

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Get ECR repository URLs from Terraform
cd terraform
API_REPO=$(terraform output -raw ecr_api_repository_url)
WORKER_REPO=$(terraform output -raw ecr_worker_repository_url)
cd ..

echo "API Repository: $API_REPO"
echo "Worker Repository: $WORKER_REPO"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# Build images
echo "Building API image..."
cd backend
docker build -f Dockerfile -t marin-api:$ENVIRONMENT .

echo "Building Worker image..."
docker build -f Dockerfile.worker -t marin-worker:$ENVIRONMENT .
cd ..

# Tag images
echo "Tagging images..."
docker tag marin-api:$ENVIRONMENT $API_REPO:$ENVIRONMENT
docker tag marin-api:$ENVIRONMENT $API_REPO:latest
docker tag marin-api:$ENVIRONMENT $API_REPO:$VERSION

docker tag marin-worker:$ENVIRONMENT $WORKER_REPO:$ENVIRONMENT
docker tag marin-worker:$ENVIRONMENT $WORKER_REPO:latest
docker tag marin-worker:$ENVIRONMENT $WORKER_REPO:$VERSION

# Push images
echo "Pushing API image..."
docker push $API_REPO:$ENVIRONMENT
docker push $API_REPO:latest
docker push $API_REPO:$VERSION

echo "Pushing Worker image..."
docker push $WORKER_REPO:$ENVIRONMENT
docker push $WORKER_REPO:latest
docker push $WORKER_REPO:$VERSION

echo "Build and push complete!"
echo "API: $API_REPO:$VERSION"
echo "Worker: $WORKER_REPO:$VERSION"

# Trigger ECS deployment (optional)
echo "Triggering ECS deployment..."
aws ecs update-service \
  --cluster marin-$ENVIRONMENT-cluster \
  --service marin-$ENVIRONMENT-api \
  --force-new-deployment

aws ecs update-service \
  --cluster marin-$ENVIRONMENT-cluster \
  --service marin-$ENVIRONMENT-worker \
  --force-new-deployment

echo "Deployment triggered!"
```

Make executable:
```bash
chmod +x build-and-deploy.sh
./build-and-deploy.sh
```

---

## 🧹 Cleanup

```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Remove all unused networks
docker network prune

# Clean everything (containers, images, volumes, networks)
docker system prune -a --volumes

# Get disk usage
docker system df

# See what would be removed
docker system prune -a --dry-run
```

---

## 🐛 Debugging

```bash
# Check container logs
docker logs --tail 50 marin-api

# Follow logs with timestamps
docker logs -f --timestamps marin-api

# Check why container exited
docker logs marin-api
docker inspect marin-api | grep -A 10 State

# Get container process list
docker top marin-api

# Execute health check
docker exec marin-api curl -f http://localhost:8000/health || echo "Health check failed"

# Check resource usage
docker stats --no-stream marin-api

# Get environment variables
docker exec marin-api env

# Test connectivity
docker exec marin-api ping -c 3 google.com
docker exec marin-api curl -v https://api.mongodb.com

# Run container with debug mode
docker run -it --rm \
  --entrypoint /bin/bash \
  -e DEBUG=true \
  marin-api:dev
```

---

## 💡 Pro Tips

### Multi-stage Builds (Optimize Image Size)

```dockerfile
# Use multi-stage builds in Dockerfile
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

### Build Args for Flexibility

```bash
# Build with different Python versions
docker build --build-arg PYTHON_VERSION=3.11 -t marin-api:py311 .
docker build --build-arg PYTHON_VERSION=3.10 -t marin-api:py310 .
```

### Image Size Optimization

```bash
# Compare image sizes
docker images | grep marin

# Use alpine base images (smaller)
# FROM python:3.11-alpine instead of python:3.11

# Use .dockerignore to exclude files
cat > .dockerignore << EOF
*.pyc
__pycache__
.git
.pytest_cache
.venv
*.log
EOF
```

### Caching

```bash
# Build with cache from registry (faster CI/CD)
docker build \
  --cache-from $API_REPO:latest \
  -t marin-api:dev \
  .
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [AWS ECR User Guide](https://docs.aws.amazon.com/AmazonECR/latest/userguide/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)

---

**Last Updated:** 2025-11-04
**Marin Project** | Docker 24.x | AWS ECR
