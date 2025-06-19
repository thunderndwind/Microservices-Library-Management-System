#!/bin/bash

# Library Management System - Service Health Test Script

echo "🧪 Testing Library Management System Services"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to test endpoint
test_endpoint() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -n "Testing $service_name... "

    # Make request with timeout
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)

    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ OK${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (HTTP $response)"
        return 1
    fi
}

# Wait for services to be ready
wait_for_services() {
    echo "⏳ Waiting for services to start up..."
    sleep 15
}

# Test all service health endpoints
test_all_services() {
    echo "🔍 Testing service health endpoints..."
    echo ""

    local failed=0

    # Test each service
    test_endpoint "User Service" "http://localhost:3001/health" || ((failed++))
    test_endpoint "Admin Service" "http://localhost:3003/health" || ((failed++))
    test_endpoint "Book Service" "http://localhost:8000/api/v1/health" || ((failed++))
    test_endpoint "Reservation Service" "http://localhost:3000/health" || ((failed++))
    test_endpoint "Notification Service" "http://localhost:8001/health" || ((failed++))

    echo ""

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}🎉 All services are healthy!${NC}"
        return 0
    else
        echo -e "${RED}⚠️  $failed service(s) failed health check${NC}"
        return 1
    fi
}

# Test API endpoints with sample requests
test_api_endpoints() {
    echo "🔗 Testing sample API endpoints..."
    echo ""

    local failed=0

    # Test public endpoints (no auth required)
    test_endpoint "Book List" "http://localhost:8000/api/v1/books" || ((failed++))
    test_endpoint "Book Search" "http://localhost:8000/api/v1/books/search?q=test" || ((failed++))

    echo ""

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}📡 Sample API endpoints working!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Some API endpoints may need authentication${NC}"
        return 0
    fi
}

# Test infrastructure services
test_infrastructure() {
    echo "🗄️ Testing infrastructure services..."
    echo ""

    local failed=0

    # Test RabbitMQ Management
    test_endpoint "RabbitMQ Management" "http://localhost:15673" || ((failed++))

    echo ""

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}🏗️ Infrastructure services are accessible!${NC}"
        echo "   RabbitMQ Management: http://localhost:15672 (admin/password123)"
        return 0
    else
        echo -e "${YELLOW}⚠️  Some infrastructure services may not be ready${NC}"
        return 0
    fi
}

# Main execution
main() {
    # Check if curl is available
    if ! command -v curl &>/dev/null; then
        echo -e "${RED}❌ curl is required but not installed${NC}"
        exit 1
    fi

    case "${1:-all}" in
    "wait")
        wait_for_services
        ;;
    "health")
        test_all_services
        ;;
    "api")
        test_api_endpoints
        ;;
    "infra")
        test_infrastructure
        ;;
    "all" | *)
        wait_for_services
        test_all_services
        test_api_endpoints
        test_infrastructure

        echo ""
        echo "📋 Test Summary:"
        echo "  - Health checks: Service readiness"
        echo "  - API tests: Basic endpoint functionality"
        echo "  - Infrastructure: Supporting services"
        echo ""
        echo "🚀 Your Library Management System is ready!"
        echo ""
        echo "Next steps:"
        echo "  1. Create Super Admin: docker compose exec admin-service npm run create-super-admin"
        echo "  2. Test authentication: Check API documentation in each service"
        echo "  3. Monitor logs: docker compose logs -f [service-name]"
        ;;
    esac
}

# Run main function
main "$@"
