#!/bin/bash

# Superese API - Gamification System Test Script
# This script tests the complete gamification system functionality

API_BASE="http://localhost:3000"
BEARER_TOKEN=""  # Add your Firebase token here for testing

echo "🎮 Superese Gamification System - Integration Test"
echo "=================================================="

# Function to make authenticated API calls
call_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$BEARER_TOKEN" ]; then
        if [ -n "$data" ]; then
            curl -s -X $method \
                -H "Authorization: Bearer $BEARER_TOKEN" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_BASE$endpoint"
        else
            curl -s -X $method \
                -H "Authorization: Bearer $BEARER_TOKEN" \
                -H "Content-Type: application/json" \
                "$API_BASE$endpoint"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X $method \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_BASE$endpoint"
        else
            curl -s -X $method \
                -H "Content-Type: application/json" \
                "$API_BASE$endpoint"
        fi
    fi
}

echo ""
echo "📊 1. Testing Achievement Seeding..."
echo "------------------------------------"
response=$(call_api POST "/achievements/seeder/seed")
echo "Response: $response"

echo ""
echo "📋 2. Testing Get All Achievements..."
echo "------------------------------------"
response=$(call_api GET "/achievements")
echo "Response: $response" | jq '.[0:3]' 2>/dev/null || echo "$response"

if [ -n "$BEARER_TOKEN" ]; then
    echo ""
    echo "👤 3. Testing User Progress (requires auth)..."
    echo "----------------------------------------------"
    response=$(call_api GET "/achievements/my-progress")
    echo "Response: $response" | jq '.[0:3]' 2>/dev/null || echo "$response"
    
    echo ""
    echo "🏆 4. Testing User Achievements (requires auth)..."
    echo "------------------------------------------------"
    response=$(call_api GET "/achievements/my-achievements")
    echo "Response: $response" | jq '.[0:3]' 2>/dev/null || echo "$response"
    
    echo ""
    echo "🔔 5. Testing New Badges Count (requires auth)..."
    echo "------------------------------------------------"
    response=$(call_api GET "/achievements/new-badges-count")
    echo "Response: $response"
else
    echo ""
    echo "⚠️  Skipping authenticated endpoints (no Bearer token provided)"
    echo "   To test authenticated endpoints, add your Firebase token to BEARER_TOKEN variable"
fi

echo ""
echo "🏥 6. Testing Health Check..."
echo "----------------------------"
response=$(call_api GET "/health")
echo "Response: $response"

echo ""
echo "📈 7. Achievement Statistics..."
echo "------------------------------"
achievements_count=$(call_api GET "/achievements" | jq 'length' 2>/dev/null || echo "Could not count achievements")
echo "Total achievements available: $achievements_count"

echo ""
echo "✅ Test completed!"
echo "=================="

if [ -z "$BEARER_TOKEN" ]; then
    echo ""
    echo "📝 Next Steps:"
    echo "1. Start the server: npm run start:dev"
    echo "2. Add a Firebase token to test authenticated endpoints"
    echo "3. Test the system with real user actions:"
    echo "   - Create forum posts and get likes"
    echo "   - Write diary entries"
    echo "   - Complete planner tasks"
    echo "   - Use GPT consultation"
    echo "4. Check progress and unlocked achievements"
fi
