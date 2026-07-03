#!/bin/bash
# 🚀 Production Deployment Script for AWS EC2 (Decoupled RDS Architecture)

echo "=========================================================="
echo "   POS COFFEE DEPLOYMENT ON AWS EC2 (AWS RDS DATABASE)"
echo "=========================================================="

# 0. Clean up conflicting and unused containers (like old mysql and web)
echo "🧹 Cleaning up old containers and freeing RAM..."
sudo docker stop pos_web_prod pos_mysql_prod 2>/dev/null || true
sudo docker rm pos_web_prod pos_mysql_prod 2>/dev/null || true

# 1. Build and start services in detached mode (Docker Compose builds first, then replaces containers with near-zero downtime)
echo "⚙️ Building and starting production containers (API + Redis + Nginx)..."
sudo docker-compose -f docker-compose.rds.yml up --build -d

# 3. Wait for backend server to start up
echo "⏳ Waiting for API Server container to initialize..."
sleep 5

# 4. Import base schema (seeding) to AWS RDS if it's empty
echo "🌱 Seeding database structure into AWS RDS..."
sudo docker exec pos_server_prod node scripts/seed_db.js

# 5. Run database migrations inside the server container against AWS RDS
echo "🗄️ Running database migrations against AWS RDS..."
sudo docker exec pos_server_prod node scripts/migrate.js

echo "=========================================================="
echo "🎉 Deployment successful!"
echo "Your secure API is now running at https://growme.duckdns.org/api/"
echo "Please make sure to host your Frontend and point it to the API."
echo "=========================================================="
