#!/bin/bash

# FileDrop Production Deployment Script for drop.nguyenh.work
set -e

echo "🚀 FileDrop Production Deployment"
echo "=================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with your configuration."
    exit 1
fi

# Load environment variables
source .env

# Generate TURN secret if not set
if [ "$TURN_SECRET" = "REPLACE_WITH_STRONG_SECRET" ] || [ -z "$TURN_SECRET" ]; then
    echo "🔑 Generating TURN secret..."
    TURN_SECRET=$(openssl rand -base64 32)
    # Update .env file
    sed -i.bak "s/TURN_SECRET=.*/TURN_SECRET=$TURN_SECRET/" .env
    echo "✅ TURN secret generated and saved to .env"
fi

# Check SSL certificates
if [ ! -f ssl/fullchain.pem ] || [ ! -f ssl/privkey.pem ]; then
    echo "⚠️  SSL certificates not found in ssl/ directory"
    echo "Please place your SSL certificates:"
    echo "  ssl/fullchain.pem - Full certificate chain"
    echo "  ssl/privkey.pem   - Private key"
    echo ""
    echo "For Let's Encrypt certificates, run:"
    echo "  sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/"
    echo "  sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/"
    echo "  sudo chown \$(whoami):\$(whoami) ssl/*.pem"
    exit 1
fi

echo "✅ SSL certificates found"

# Validate nginx configuration
echo "🔍 Checking nginx configuration..."
if ! sudo nginx -t; then
    echo "❌ nginx configuration test failed"
    echo "Please fix your nginx configuration before deploying"
    exit 1
fi

echo "✅ nginx configuration is valid"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Pull latest images
echo "📦 Pulling latest base images..."
docker-compose -f docker-compose.prod.yml pull coturn || true

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo ""
echo "📋 Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo ""
echo "🎉 Deployment complete!"
echo "Your FileDrop instance should be available at: https://$DOMAIN"
echo ""
echo "To monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "To stop services: docker-compose -f docker-compose.prod.yml down"
echo "To update: git pull && ./deploy.sh"