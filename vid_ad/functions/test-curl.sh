#!/bin/bash

# Test generateScript function via Firebase emulator
echo "🧪 Testing generateScript function with real OpenAI API call..."
echo ""

# Note: Firebase callable functions require specific format
# For testing with the emulator, we need to use the callable functions format

curl -X POST \
  http://127.0.0.1:5001/vid-ad/us-central1/generateScript \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "productName": "EcoFlow Portable Power Station",
      "productDescription": "A powerful, portable battery that charges in 1 hour and powers your devices for days. Perfect for camping, emergencies, and outdoor adventures.",
      "brandTone": "inspiring",
      "targetAudience": "outdoor enthusiasts and eco-conscious consumers",
      "duration": 15,
      "variationCount": 1,
      "adType": "product-demo",
      "keywords": ["fast charging", "portable", "eco-friendly", "reliable"],
      "uniqueSellingPoints": ["Charges in 1 hour", "Powers devices for 3+ days", "Solar panel compatible"]
    }
  }'

echo ""
echo ""
echo "✅ Test complete!"
