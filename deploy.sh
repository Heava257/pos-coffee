#!/bin/bash
# 🚀 Production Deployment Script for AWS EC2

echo "============================================="
echo "   POS COFFEE DEPLOYMENT ON AWS EC2"
echo "============================================="

# 1. Build and start services in detached mode (Docker Compose builds first, then replaces containers with near-zero downtime)
echo "⚙️ Building and starting new production containers..."
docker-compose -f docker-compose.prod.yml up --build -d

# 3. Wait for database to start up and become healthy
echo "⏳ Waiting for MySQL to become healthy..."
docker exec pos_mysql_prod mysqladmin ping -h localhost -u prod_user -pproduction_user_pass --silent
while [ $? -ne 0 ]; do
    sleep 2
    docker exec pos_mysql_prod mysqladmin ping -h localhost -u prod_user -pproduction_user_pass --silent
done
echo "✅ MySQL is healthy!"

# 4. Run database migrations inside the server container
echo "🗄️ Running database migrations..."
docker exec pos_server_prod node scripts/migrate.js

echo "============================================="
echo "🎉 Deployment successful!"
echo "Your app is now running on ports 80 (HTTP) and 443 (HTTPS)."
echo "============================================="
