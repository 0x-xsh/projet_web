#!/bin/bash

# Stop all running containers
echo "Stopping all running containers..."
docker-compose down

# Remove all unused containers, networks, images and volumes
echo "Removing unused Docker resources..."
docker system prune -a --volumes -f

echo "Cleanup complete!" 