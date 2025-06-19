#!/bin/bash

echo "🧪 Testing All Services..."
echo "=========================="

services=(
    "User Service:http://localhost:3001/health"
    "Admin Service:http://localhost:3003/health"
    "Book Service:http://localhost:8000/api/v1/health"
    "Reservation Service:http://localhost:3000/health"
    "Notification Service:http://localhost:8001/health"
)

for service in "${services[@]}"; do
    name="${service%%:*}"
    url="${service##*:}"
    echo -n "Testing $name... "

    if curl -s "$url" >/dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
done

echo ""
echo "🌐 Service URLs:"
echo "- User Service: http://localhost:3001"
echo "- Admin Service: http://localhost:3003"
echo "- Book Service: http://localhost:8000"
echo "- Reservation Service: http://localhost:3000"
echo "- Notification Service: http://localhost:8001"
echo "- RabbitMQ Management: http://localhost:15673 (guest/guest)"
echo ""
echo "🗄️ Infrastructure (Alternative Ports):"
echo "- MongoDB: localhost:27018"
echo "- MySQL: localhost:3307"
echo "- PostgreSQL: localhost:5433"
echo "- Redis: localhost:6380"
echo "- RabbitMQ: localhost:5673"
