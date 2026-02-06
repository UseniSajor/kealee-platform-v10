#!/bin/bash
# Test API Service
# Run from root: ./test-api.sh

echo "🧪 Testing Kealee Platform API Service..."
echo ""

# Change to API directory
cd services/api

echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔨 Building TypeScript..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    cd ../..
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "🧪 Running tests..."
pnpm test

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Tests failed!"
    cd ../..
    exit 1
fi

echo ""
echo "✅ All tests passed!"
echo ""
echo "📊 Running tests with coverage..."
pnpm test:coverage

cd ../..

echo ""
echo "✨ Testing complete!"
