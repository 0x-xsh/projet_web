# Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Backend Services](#backend-services)
   - [Auth Service](#auth-service)
   - [Users Service](#users-service)
   - [Posts Service](#posts-service)
4. [Frontend](#frontend)
   - [Structure](#frontend-structure)
   - [Pages and Components](#pages-and-components)
   - [State Management](#state-management)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Authentication Flow](#authentication-flow)
8. [Development Workflow](#development-workflow)
9. [Deployment](#deployment)

## Project Overview

This social media application is built using a microservices architecture, with multiple backend services written in Django and a React frontend. The application allows users to register, log in, create posts, comment on posts, like posts, and manage their profile.

The project is designed with scalability in mind, separating concerns into distinct services that communicate with each other via APIs.

## Architecture

The application is composed of the following components:

```
┌─────────────┐      ┌─────────────┐
│             │      │             │
│   Frontend  │◄────►│ Auth Service│
│  (React)    │      │  (Django)   │
│             │      │             │
└───────┬─────┘      └──────┬──────┘
        │                   │
        │                   │
        │                   │
┌───────▼─────┐      ┌──────▼──────┐
│             │      │             │
│Posts Service│◄────►│Users Service│
│  (Django)   │      │  (Django)   │
│             │      │             │
└───────┬─────┘      └──────┬──────┘
        │                   │
        │                   │
        └─────────┬─────────┘
                  │
                  │
          ┌───────▼───────┐
          │               │
          │  PostgreSQL   │
          │   Database    │
          │               │
          └───────────────┘
```

All services communicate with each other via REST APIs. The frontend makes requests directly to each service as needed.

## Backend Services

### Auth Service

**Responsibilities:**
- User authentication (login)
- Token generation and validation
- Registration forwarding to User Service
- Token refresh

**Technologies:**
- Django 4.2
- Django REST Framework
- Django REST Framework SimpleJWT
- PostgreSQL

**Key Files:**
- `auth_service/authapi/views.py`: Authentication endpoints
- `auth_service/core/settings.py`: Service configuration

**API Endpoints:**
- `POST /api/token/`: Obtain JWT tokens
- `POST /api/token/refresh/`: Refresh JWT tokens
- `POST /api/register/`: Forward registration to User Service
- `GET /api/verify-token/`: Verify JWT token validity

### Users Service

**Responsibilities:**
- User registration
- User profile management
- User data retrieval

**Technologies:**
- Django 4.2
- Django REST Framework
- PostgreSQL

**Key Files:**
- `users_service/users/views.py`: User management endpoints
- `users_service/users/serializers.py`: User data serialization
- `users_service/users/authentication.py`: JWT authentication
- `users_service/core/settings.py`: Service configuration

**API Endpoints:**
- `POST /api/users/`: Create new user
- `GET /api/users/{id}/`: Get user by ID
- `PUT /api/users/{id}/`: Update user profile
- `DELETE /api/users/{id}/`: Delete user account

### Posts Service

**Responsibilities:**
- Post creation, retrieval, update, and deletion
- Comment management
- Like functionality

**Technologies:**
- Django 4.2
- Django REST Framework
- PostgreSQL

**Key Files:**
- `posts_service/posts/views.py`: Post management endpoints
- `posts_service/posts/models.py`: Post, Comment, and Like models
- `posts_service/posts/serializers.py`: Data serialization
- `posts_service/core/settings.py`: Service configuration

**API Endpoints:**
- `GET /api/posts/`: List all posts
- `POST /api/posts/`: Create new post
- `GET /api/posts/{id}/`: Get post by ID
- `PUT /api/posts/{id}/`: Update post
- `DELETE /api/posts/{id}/`: Delete post
- `POST /api/posts/{id}/like/`: Like a post
- `POST /api/posts/{id}/unlike/`: Unlike a post
- `GET /api/posts/{id}/likes/`: Get post likes
- `POST /api/posts/{id}/comment/`: Add comment to post
- `GET /api/posts/{id}/comments/`: Get post comments

## Frontend

### Frontend Structure

The frontend is built using React with Material-UI for styling. It follows a component-based architecture and uses React Context for state management.

**Key Technologies:**
- React
- Material-UI
- React Router
- Axios (for API calls)

**Directory Structure:**
```
frontend/
├── public/              # Static assets
├── src/
│   ├── App.js           # Main application component
│   ├── index.js         # Entry point
│   ├── components/      # Reusable components
│   │   ├── auth/        # Authentication components
│   │   ├── layout/      # Layout components (Header, Footer)
│   │   └── posts/       # Post-related components
│   ├── contexts/        # React contexts for state management
│   └── services/        # API service functions
```

### Pages and Components

**Main Pages:**
- Home: Displays posts feed with filtering capabilities
- Login: User login form
- Register: User registration form
- Profile: User profile with posts, about, friends sections
- Post Detail: Detailed view of a post with comments

**Key Components:**
- `Header.js`: Navigation bar with user menu
- `Footer.js`: Application footer
- `PostItem.js`: Displays a single post with interactions
- `PostList.js`: Renders a list of posts
- `PostForm.js`: Form for creating/editing posts
- `QuickPostForm.js`: Simplified post creation form
- `Login.js`: Login form
- `Register.js`: Registration form
- `Profile.js`: User profile component with Facebook-like tabs

### State Management

The application uses React Context API for state management:

- `AuthContext.js`: Manages authentication state, including login/logout and token management
  - Stores user data
  - Handles authentication with tokens
  - Provides login/logout functions

## API Reference

### Auth API

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/token/` | POST | Obtain JWT tokens | `{username, password}` | `{access, refresh}` |
| `/api/token/refresh/` | POST | Refresh JWT token | `{refresh}` | `{access}` |
| `/api/register/` | POST | Register new user | `{username, email, password}` | `{id, username, email}` |
| `/api/verify-token/` | GET | Verify token validity | - | `{valid: true/false}` |

### Users API

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/users/` | POST | Create user | `{username, email, password}` | `{id, username, email}` |
| `/api/users/{id}/` | GET | Get user by ID | - | `{id, username, email}` |
| `/api/users/{id}/` | PUT | Update user | `{username, email}` | `{id, username, email}` |
| `/api/users/{id}/` | DELETE | Delete user | - | `204 No Content` |

### Posts API

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/posts/` | GET | List posts | - | Array of posts |
| `/api/posts/` | POST | Create post | `{title, content}` | Post object |
| `/api/posts/{id}/` | GET | Get post | - | Post object |
| `/api/posts/{id}/` | PUT | Update post | `{title, content}` | Post object |
| `/api/posts/{id}/` | DELETE | Delete post | - | `204 No Content` |
| `/api/posts/{id}/like/` | POST | Like post | - | `{status: 'liked'}` |
| `/api/posts/{id}/unlike/` | POST | Unlike post | - | `{status: 'unliked'}` |
| `/api/posts/{id}/comment/` | POST | Add comment | `{content}` | Comment object |
| `/api/posts/{id}/comments/` | GET | Get comments | - | Array of comments |

## Database Schema

### Users Table
- id (PK)
- username
- email
- password
- date_joined
- last_login

### Posts Table
- id (PK)
- title
- content
- author (FK to Users)
- created_at
- updated_at

### Comments Table
- id (PK)
- post (FK to Posts)
- author (FK to Users)
- content
- created_at
- updated_at

### Likes Table
- id (PK)
- post (FK to Posts)
- user (FK to Users)
- created_at

## Authentication Flow

1. User enters credentials in the login form
2. Frontend sends credentials to Auth Service (`/api/token/`)
3. Auth Service validates credentials and returns JWT tokens (access and refresh)
4. Frontend stores tokens securely (httpOnly cookies)
5. For subsequent requests, the access token is sent in the Authorization header
6. When the access token expires, the refresh token is used to obtain a new one

## Development Workflow

### Running the Backend Services

1. Start all services with Docker Compose:
   ```bash
   docker-compose up
   ```

2. Individual services can be started with:
   ```bash
   docker-compose up auth_service
   docker-compose up users_service
   docker-compose up posts_service
   ```

3. Database migrations:
   ```bash
   docker-compose exec auth_service python manage.py migrate
   docker-compose exec users_service python manage.py migrate
   docker-compose exec posts_service python manage.py migrate
   ```

### Running the Frontend

The frontend is not included in Docker Compose and is run locally:

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Access the frontend at http://localhost:3000

### Making Changes

- Backend changes are automatically detected and the service reloads (Django's development server)
- Frontend changes are automatically detected and hot-reloaded (React development server)

## Deployment

The application can be deployed using:

1. Docker Compose for local/development environments
2. Kubernetes for production environments (check `k8s-setup.sh` and YAML files)

For Kubernetes deployment:
1. Build and push Docker images for each service
2. Apply Kubernetes manifests
3. Configure ingress for external access

---

This documentation provides a high-level overview of the project. For more detailed information, refer to the code comments and specific service documentation. 