#!/bin/bash

# FileDrop Management Script
set -e

COMPOSE_FILE="docker-compose.prod.yml"

case "$1" in
    start)
        echo "🚀 Starting FileDrop services..."
        docker-compose -f $COMPOSE_FILE up -d
        ;;
    stop)
        echo "🛑 Stopping FileDrop services..."
        docker-compose -f $COMPOSE_FILE down
        ;;
    restart)
        echo "🔄 Restarting FileDrop services..."
        docker-compose -f $COMPOSE_FILE restart
        ;;
    logs)
        echo "📋 Showing logs (Ctrl+C to exit)..."
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    status)
        echo "📊 Service Status:"
        docker-compose -f $COMPOSE_FILE ps
        ;;
    update)
        echo "🔄 Updating FileDrop..."
        git pull
        docker-compose -f $COMPOSE_FILE down
        docker-compose -f $COMPOSE_FILE up --build -d
        ;;
    backup)
        echo "💾 Creating backup..."
        timestamp=$(date +%Y%m%d_%H%M%S)
        mkdir -p backups
        tar -czf "backups/filedrop_backup_$timestamp.tar.gz" .env ssl/
        echo "✅ Backup created: backups/filedrop_backup_$timestamp.tar.gz"
        ;;
    clean)
        echo "🧹 Cleaning up unused Docker resources..."
        docker system prune -f
        docker volume prune -f
        ;;
    shell)
        echo "🐚 Opening shell in filedrop container..."
        docker-compose -f $COMPOSE_FILE exec filedrop sh
        ;;
    *)
        echo "FileDrop Management Script"
        echo ""
        echo "Usage: $0 {start|stop|restart|logs|status|update|backup|clean|shell}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  logs    - View real-time logs"
        echo "  status  - Show service status"
        echo "  update  - Pull latest code and rebuild"
        echo "  backup  - Create backup of configuration"
        echo "  clean   - Clean up Docker resources"
        echo "  shell   - Open shell in container"
        exit 1
        ;;
esac