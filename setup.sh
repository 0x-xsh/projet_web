#!/bin/bash

# Run migrations for each service
echo "Running migrations for auth_service..."
docker-compose run --rm auth_service python manage.py migrate

echo "Running migrations for users_service..."
docker-compose run --rm users_service python manage.py migrate

echo "Running migrations for posts_service..."
docker-compose run --rm posts_service python manage.py migrate

echo "Setup complete! You can now start the services with: docker-compose up" 