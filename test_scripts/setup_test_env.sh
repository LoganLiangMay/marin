#!/bin/bash
# Setup Test Environment for Marin Pipeline
# This script helps you configure the minimum required environment variables for testing

echo "================================================================================"
echo "🔧 MARIN TEST ENVIRONMENT SETUP"
echo "================================================================================"
echo ""
echo "This script will help you set up the minimum environment variables needed"
echo "to run pipeline tests with synthetic conversation data."
echo ""
echo "You'll need:"
echo "  1. MongoDB Atlas URI (required)"
echo "  2. Redis URL (optional for basic tests)"
echo "  3. AWS credentials (optional for basic tests, required for AI analysis)"
echo ""

# Check if .env file exists
ENV_FILE="../backend/.env"

if [ -f "$ENV_FILE" ]; then
    echo "✅ Found existing .env file at: $ENV_FILE"
    echo ""
    read -p "Do you want to update it? (y/n): " UPDATE_ENV
    if [ "$UPDATE_ENV" != "y" ]; then
        echo "Using existing .env file. Make sure it has the correct values."
        exit 0
    fi
else
    echo "📝 Creating new .env file from .env.example..."
    cp ../backend/.env.example "$ENV_FILE"
fi

echo ""
echo "================================================================================"
echo "1️⃣  MONGODB CONFIGURATION (Required)"
echo "================================================================================"
echo ""
echo "You need a MongoDB Atlas URI. Format:"
echo "  mongodb+srv://username:password@cluster.mongodb.net/audio_pipeline"
echo ""
read -p "Enter MongoDB URI [or press Enter to skip]: " MONGODB_URI

if [ -n "$MONGODB_URI" ]; then
    # Update .env file
    sed -i '' "s|MONGODB_URI=.*|MONGODB_URI=$MONGODB_URI|" "$ENV_FILE"
    echo "✅ MongoDB URI configured"
else
    echo "⚠️  Skipped - you'll need to set this manually"
fi

echo ""
echo "================================================================================"
echo "2️⃣  REDIS CONFIGURATION (Optional for basic tests)"
echo "================================================================================"
echo ""
echo "For basic testing, you can use a local Redis or skip it."
echo "Format: redis://localhost:6379/0"
echo ""
read -p "Enter Redis URL [or press Enter for localhost:6379]: " REDIS_URL

if [ -z "$REDIS_URL" ]; then
    REDIS_URL="redis://localhost:6379/0"
fi

# Create Redis URL format from endpoint
REDIS_ENDPOINT="${REDIS_URL#redis://}"
REDIS_ENDPOINT="${REDIS_ENDPOINT%/*}"

sed -i '' "s|REDIS_ENDPOINT=.*|REDIS_ENDPOINT=$REDIS_ENDPOINT|" "$ENV_FILE"
sed -i '' "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=|" "$ENV_FILE"
sed -i '' "s|REDIS_SSL=.*|REDIS_SSL=False|" "$ENV_FILE"
echo "✅ Redis configured: $REDIS_URL"

echo ""
echo "================================================================================"
echo "3️⃣  AWS CONFIGURATION (Required for AI analysis)"
echo "================================================================================"
echo ""
echo "For AI analysis testing, you need AWS credentials with Bedrock access."
echo ""
read -p "Configure AWS now? (y/n): " CONFIGURE_AWS

if [ "$CONFIGURE_AWS" = "y" ]; then
    read -p "AWS Region [us-east-1]: " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}

    read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
    read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
    echo ""

    sed -i '' "s|AWS_REGION=.*|AWS_REGION=$AWS_REGION|" "$ENV_FILE"
    sed -i '' "s|AWS_ACCESS_KEY_ID=.*|AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID|" "$ENV_FILE"
    sed -i '' "s|AWS_SECRET_ACCESS_KEY=.*|AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY|" "$ENV_FILE"
    echo "✅ AWS credentials configured"
else
    echo "⚠️  Skipped - AI analysis tests will fail without AWS credentials"
fi

echo ""
echo "================================================================================"
echo "📝 EXPORT ENVIRONMENT VARIABLES"
echo "================================================================================"
echo ""
echo "Exporting variables for current session..."

# Export for current session
if [ -n "$MONGODB_URI" ]; then
    export MONGODB_URI="$MONGODB_URI"
    echo "✅ Exported MONGODB_URI"
fi

export REDIS_URL="$REDIS_URL"
echo "✅ Exported REDIS_URL"

# Source the .env file for Python to use
echo ""
echo "To load these variables in Python, the backend will read from: $ENV_FILE"

echo ""
echo "================================================================================"
echo "✅ SETUP COMPLETE"
echo "================================================================================"
echo ""
echo "Configuration saved to: $ENV_FILE"
echo ""
echo "Next steps:"
echo "  1. Verify MongoDB connection:"
echo "     mongosh \"$MONGODB_URI\" --eval \"db.adminCommand('ping')\""
echo ""
echo "  2. Run quick test:"
echo "     cd /Applications/Gauntlet/marin/test_scripts"
echo "     python quick_test.py"
echo ""
echo "  3. If successful, run full pipeline test:"
echo "     python test_pipeline.py --skip-analysis  # Safe, no API costs"
echo "     python test_pipeline.py                   # Full test with AI (~\$0.50)"
echo ""
echo "================================================================================"
