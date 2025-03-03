# Social Media Application

This is a simple social media application built with a microservices architecture:
- Frontend: Next.js with Tailwind CSS
- Backend: Multiple Django services (auth, users, posts)
- Database: PostgreSQL

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Setup

1. Clone this repository

2. Run the setup script to run migrations:
```bash
./setup.sh
```

3. Start all services:
```bash
docker-compose up
```

4. Access the application:
   - Frontend: http://localhost:3000
   - Auth Service: http://localhost:9000
   - Posts Service: http://localhost:9001
   - Users Service: http://localhost:9002

## Services

### Frontend
- Next.js with Tailwind CSS
- Runs on port 3000

### Auth Service
- Django application for authentication
- Runs on port 9000

### Users Service
- Django application for user management
- Runs on port 9002

### Posts Service
- Django application for posts management
- Runs on port 9001

### Database
- PostgreSQL
- Port 5435 (exposed) / 5432 (internal)

## Development

To make changes to the frontend:
1. Navigate to the frontend directory
2. Make your changes
3. The changes will be automatically reloaded thanks to Next.js dev server

To make changes to any of the backend services:
1. Navigate to the respective service directory
2. Make your changes
3. The changes will be automatically reloaded thanks to Django's development server
