#!/bin/bash

# Library Management System - Service Startup Script
# This script helps start all services for the microservices library management system

set -e

echo "🚀 Library Management System - Service Startup"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is available
check_docker() {
    if command -v docker &>/dev/null; then
        print_status "Docker is available"
        return 0
    else
        print_error "Docker is not installed or not in PATH"
        return 1
    fi
}

# Check if Docker Compose is available (prioritize new 'docker compose' syntax)
check_docker_compose() {
    if docker compose version &>/dev/null; then
        print_status "docker compose (integrated) is available"
        return 0
    elif command -v docker-compose &>/dev/null; then
        print_status "docker-compose (standalone) is available"
        return 0
    else
        print_error "Docker Compose is not available"
        return 1
    fi
}

# Function to get the correct Docker Compose command
get_compose_cmd() {
    if docker compose version &>/dev/null; then
        echo "docker compose"
    elif command -v docker-compose &>/dev/null; then
        echo "docker-compose"
    else
        print_error "No Docker Compose command available"
        exit 1
    fi
}

# Function to start with Docker
start_with_docker() {
    print_status "Starting services with Docker..."

    COMPOSE_CMD=$(get_compose_cmd)
    print_status "Using: $COMPOSE_CMD"

    # Start dependencies first
    print_status "Starting databases and message broker..."
    $COMPOSE_CMD up -d mongodb mysql postgresql redis rabbitmq

    # Wait for databases to be ready
    print_status "Waiting for databases to be ready..."
    sleep 10

    # Start application services
    print_status "Starting application services..."
    $COMPOSE_CMD up -d user-service admin-service book-service reservation-service notification-service

    # Wait for services to start
    sleep 5

    # Show status
    $COMPOSE_CMD ps

    print_status "All services started! 🎉"
    echo ""
    echo "Service URLs:"
    echo "  - User Service: http://localhost:3001/health"
    echo "  - Admin Service: http://localhost:3003/health"
    echo "  - Book Service: http://localhost:8000/api/v1/health"
    echo "  - Reservation Service: http://localhost:3000/api/v1/health"
    echo "  - Notification Service: http://localhost:8001/health"
    echo "  - RabbitMQ Management: http://localhost:15672 (admin/password123)"
    echo ""
    echo "To initialize the system:"
    echo "  $COMPOSE_CMD exec admin-service npm run create-super-admin"
    echo ""
    echo "To view logs:"
    echo "  $COMPOSE_CMD logs -f [service-name]"
}

# Function to check service dependencies for local development
check_local_dependencies() {
    print_status "Checking local development dependencies..."

    # Check Node.js
    if command -v node &>/dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js: $NODE_VERSION"
    else
        print_warning "Node.js not found (required for user-service and admin-service)"
    fi

    # Check PHP
    if command -v php &>/dev/null; then
        PHP_VERSION=$(php --version | head -n 1)
        print_status "PHP: $PHP_VERSION"
    else
        print_warning "PHP not found (required for book-service)"
    fi

    # Check Composer
    if command -v composer &>/dev/null; then
        COMPOSER_VERSION=$(composer --version | head -n 1)
        print_status "Composer: $COMPOSER_VERSION"
    else
        print_warning "Composer not found (required for book-service)"
    fi

    # Check Ruby
    if command -v ruby &>/dev/null; then
        RUBY_VERSION=$(ruby --version)
        print_status "Ruby: $RUBY_VERSION"
    else
        print_warning "Ruby not found (required for reservation-service)"
    fi

    # Check Python
    if command -v python3 &>/dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_status "Python: $PYTHON_VERSION"
    else
        print_warning "Python3 not found (required for notification-service)"
    fi
}

# Function to start dependencies only
start_dependencies_only() {
    print_status "Starting dependencies only (for local development)..."

    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD up -d mongodb mysql postgresql redis rabbitmq

    print_status "Dependencies started! Now you can run services locally:"
    echo ""
    echo "User Service (Port 3001):"
    echo "  cd services/user-service && npm install && npm run dev"
    echo ""
    echo "Admin Service (Port 3003):"
    echo "  cd services/admin-service && npm install && npm run dev"
    echo ""
    echo "Book Service (Port 8000):"
    echo "  cd services/book-service && composer install && php artisan serve --port=8000"
    echo ""
    echo "Reservation Service (Port 3000):"
    echo "  cd services/reservation-service && bundle install && rails server -p 3000"
    echo ""
    echo "Notification Service (Port 8001):"
    echo "  cd services/notification-service && pip install -r requirements.txt && uvicorn app.main:app --port 8001"
}

# Function to stop all services
stop_services() {
    print_status "Stopping all services..."

    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD down

    print_status "All services stopped."
}

# Main menu
show_menu() {
    echo ""
    echo "Choose an option:"
    echo "1) Start all services with Docker (recommended)"
    echo "2) Start dependencies only (for local development)"
    echo "3) Stop all services"
    echo "4) Check local development dependencies"
    echo "5) Exit"
    echo ""
    read -p "Enter your choice [1-5]: " choice
}

# Main execution
main() {
    while true; do
        show_menu

        case $choice in
        1)
            if check_docker && check_docker_compose; then
                start_with_docker
            else
                print_error "Docker or Docker Compose not available"
            fi
            ;;
        2)
            if check_docker && check_docker_compose; then
                start_dependencies_only
                check_local_dependencies
            else
                print_error "Docker or Docker Compose not available"
            fi
            ;;
        3)
            stop_services
            ;;
        4)
            check_local_dependencies
            ;;
        5)
            print_status "Goodbye! 👋"
            exit 0
            ;;
        *)
            print_error "Invalid option. Please choose 1-5."
            ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
    done
}

# Check if running as source or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
