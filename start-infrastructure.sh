#!/bin/bash

# Start Infrastructure Services for Local Development
# This script starts only the databases and message broker needed for individual service development
# Uses alternative ports to avoid conflicts with existing local services

echo "🏗️ Starting Infrastructure Services for Local Development"
echo "=========================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is available
if ! command -v docker &>/dev/null; then
    print_error "Docker is not installed or not available"
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &>/dev/null; then
    print_error "Docker Compose is not available"
    exit 1
fi

print_info "Starting infrastructure services with alternative ports..."

# Start infrastructure services using alternative configuration
if docker compose -f docker-compose.infrastructure-alt.yml up -d; then
    print_info "Infrastructure services started successfully"
else
    print_error "Failed to start infrastructure services"
    exit 1
fi

echo ""
print_info "Waiting for services to be ready..."
sleep 10

echo ""
print_info "Checking service health..."

# Check MongoDB
if docker exec library-mongodb-dev mongosh --eval "db.adminCommand('ping')" &>/dev/null; then
    print_info "✅ MongoDB is ready (Port 27018)"
else
    print_warning "❌ MongoDB is not ready yet"
fi

# Check MySQL
if docker exec library-mysql-dev mysql -u library_user -plibrary_password -e "SELECT 1;" &>/dev/null; then
    print_info "✅ MySQL is ready (Port 3307)"
else
    print_warning "❌ MySQL is not ready yet"
fi

# Check PostgreSQL
if docker exec library-postgresql-dev psql -U library_user -d library_reservations -c "SELECT 1;" &>/dev/null; then
    print_info "✅ PostgreSQL is ready (Port 5433)"
else
    print_warning "❌ PostgreSQL is not ready yet"
fi

# Check Redis
if docker exec library-redis-dev redis-cli ping &>/dev/null; then
    print_info "✅ Redis is ready (Port 6380)"
else
    print_warning "❌ Redis is not ready yet"
fi

# Check RabbitMQ
if curl -s -u guest:guest http://localhost:15673/api/overview &>/dev/null; then
    print_info "✅ RabbitMQ is ready (Port 5673, Management 15673)"
else
    print_warning "❌ RabbitMQ is not ready yet"
fi

echo ""
print_info "🎯 Infrastructure Status (Alternative Ports):"
echo "=============================================="
echo "📊 Services:"
echo "  - MongoDB:     localhost:27018   (library_users, library_admins)"
echo "  - MySQL:       localhost:3307    (library_books)"
echo "  - PostgreSQL:  localhost:5433    (library_reservations)"
echo "  - Redis:       localhost:6380    (notifications cache)"
echo "  - RabbitMQ:    localhost:5673    (message broker)"
echo ""
echo "🌐 Management Interfaces:"
echo "  - RabbitMQ Management: http://localhost:15673 (guest/guest)"
echo ""
echo "📋 Next Steps:"
echo "  1. Update your service .env files to use these alternative ports"
echo "  2. Follow the service-specific setup in 'local-development-guide.md'"
echo "  3. Start services in order: User → Admin → Book → Reservation → Notification"
echo "  4. Run the health check script to verify all services are working"
echo ""
echo "🛑 To stop infrastructure:"
echo "  docker compose -f docker-compose.infrastructure-alt.yml down"

echo ""
print_info "✅ Infrastructure setup complete! Ready for individual service development."

echo ""
print_warning "⚠️  IMPORTANT: Your services need to be configured with these ports:"
echo "   - MongoDB URI: mongodb://admin:password123@localhost:27018/..."
echo "   - MySQL: localhost:3307"
echo "   - PostgreSQL: localhost:5433"
echo "   - Redis: localhost:6380"
echo "   - RabbitMQ: amqp://guest:guest@localhost:5673"
