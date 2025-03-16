# Microservices Social Media Application

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Backend Services](#backend-services)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Deployment Guide](#deployment-guide)
   - [Prerequisites](#prerequisites)
   - [Building and Pushing Docker Images](#building-and-pushing-docker-images)
   - [Creating AKS Cluster](#creating-aks-cluster)
   - [Development Deployment](#development-deployment)
     - [Deploying Backend Services](#deploying-backend-services)
     - [Setting Up NGINX Ingress Gateway](#setting-up-nginx-ingress-gateway)
     - [Securing with HTTPS](#securing-with-https)
   - [Production Deployment](#production-deployment)
     - [Deploying to Production](#deploying-to-production)
     - [Istio Gateway Setup](#istio-gateway-setup)
7. [Security Features](#security-features)
8. [Local Development](#local-development)

## Project Overview

This application is built using a microservices architecture with Django-based backend services and a React frontend. The services communicate with each other through REST APIs and are deployed on Azure Kubernetes Service (AKS).

## Technology Stack

### Frontend
- **React**: Modern component-based UI library for building interactive user interfaces
- **Material UI**: Comprehensive component library implementing Google's Material Design
- **React Router**: Declarative routing for React applications
- **Axios**: Promise-based HTTP client for making API requests
- **Formik & Yup**: Form handling and validation libraries
- **Context API**: For state management across components (auth, user data)

### Backend
- **Django**: High-level Python web framework that encourages rapid development
- **Django REST Framework**: Powerful toolkit for building Web APIs on top of Django
- **PostgreSQL**: Advanced open-source relational database
- **JWT Authentication**: Secure token-based authentication system
- **Modular Architecture**: Each service is built as a separate Django application:
  - **Auth Service**: Handles user authentication, JWT token generation and validation
  - **Users Service**: Manages user profiles with Django's built-in User model
  - **Posts Service**: Implements social content features with custom models for posts, comments, and likes

### DevOps & Infrastructure
- **Docker**: Containerization of all services
- **Kubernetes**: Container orchestration on Azure Kubernetes Service
- **NGINX Ingress**: API Gateway for routing and load balancing
- **Let's Encrypt**: Automated TLS certificate management
- **Azure Container Registry**: Private registry for Docker images

## Architecture

```
                ┌───────────────┐
                │   Frontend    │
                │  (Vercel)     │
                └───────┬───────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                   Azure                              │
│                                                      │
│               ┌───────────────┐                      │
│               │    Gateway    │                      │
│               │  (NGINX/Istio)│                      │
│               └───────┬───────┘                      │
│                       │                              │
│                       ▼                              │
│  ┌─────────────┬─────────────┬─────────────┐         │
│  │             │             │             │         │
│  │Auth Service │Users Service│Posts Service│         │
│  │  (2+ pods)  │  (2+ pods)  │  (2+ pods)  │         │
│  │             │             │             │         │
│  └──────┬──────┴──────┬──────┴──────┬──────┘         │
│         │              │             │               │
│         │              │             │               │
│         └──────────────┼─────────────┘               │
│                        │                             │
│                        ▼                             │
│                 ┌─────────────┐                      │
│                 │             │                      │
│                 │ PostgreSQL  │                      │
│                 │  Database   │                      │
│                 │             │                      │
│                 └─────────────┘                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

All components of the application, including the API Gateway (NGINX/Istio), the three microservices, and the PostgreSQL database, are deployed on Azure. Each service runs with multiple replicas for high availability and horizontal scalability. Only the frontend is hosted externally on Vercel for optimal global content delivery.

## Backend Services

The application consists of three core microservices:

1. **Auth Service** - Handles authentication, JWT token generation and validation
2. **Users Service** - Manages user profiles and user data 
3. **Posts Service** - Handles posts, comments, and social interactions

Each service is containerized and deployed independently with multiple replicas on Azure Kubernetes Service for high availability and horizontal scaling.
Each service handles its security on its own because I apply the ZERO-TRUST policy, so each one handles the received request's jwt before proceeding.

## API Endpoints Reference

### Auth Service

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/auth/register/` | POST | Register a new user | `{username, email, password}` | `{id, username, email}` |
| `/auth/login/` | POST | Obtain JWT tokens | `{username, password}` | `{access, refresh}` |
| `/auth/token/refresh/` | POST | Refresh access token | `{refresh}` | `{access}` |
| `/auth/verify-token/` | GET | Verify token validity | - | `{valid: true/false}` |
| `/auth/health/` | GET | Health check | - | `{status: "ok"}` |

### Users Service

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/users/api/users/` | POST | Create a user | `{username, email, password}` | `{id, username, email}` |
| `/users/api/users/me/` | GET | Get current user profile | - | User object |
| `/users/api/users/<id>/` | GET | Get user by ID | - | User object |
| `/users/api/users/<id>/` | PUT | Update user | `{username, email, etc}` | Updated user object |
| `/users/api/users/<id>/` | DELETE | Delete user | - | `204 No Content` |

### Posts Service

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/posts/api/posts/` | GET | List all posts | - | Array of posts |
| `/posts/api/posts/` | POST | Create a post | `{title, content}` | Post object |
| `/posts/api/posts/<id>/` | GET | Get post by ID | - | Post object |
| `/posts/api/posts/<id>/` | PUT | Update post | `{title, content}` | Updated post object |
| `/posts/api/posts/<id>/` | DELETE | Delete post | - | `204 No Content` |
| `/posts/api/posts/<id>/like/` | POST | Like a post | - | `{status: "liked"}` |
| `/posts/api/posts/<id>/unlike/` | POST | Unlike a post | - | `{status: "unliked"}` |
| `/posts/api/posts/<id>/likes/` | GET | Get post likes | - | Array of likes |
| `/posts/api/posts/<id>/comment/` | POST | Add a comment | `{content}` | Comment object |
| `/posts/api/posts/<id>/comments/` | GET | Get post comments | - | Array of comments |

## Detailed API Documentation

This section provides detailed examples of request bodies and responses for each service.

### Auth Service

**Base URL**: `https://74.178.207.4.nip.io/auth/`

#### Register
- **URL**: `https://74.178.207.4.nip.io/auth/register/`
- **Method**: POST
- **Example Request Body**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "SecurePass123!"
}

#### Login
- **URL**: `https://74.178.207.4.nip.io/auth/login/`
- **Method**: POST
- **Example Request Body**:
```json
{
  "username": "existinguser",
  "password": "YourPassword123!"
}
```

```


### Users Service

**Base URL**: `https://74.178.207.4.nip.io/users/`

#### Get Current User
- **URL**: `https://74.178.207.4.nip.io/users/api/users/me/`
- **Method**: GET
- **Headers**: `Authorization: Bearer your-access-token`
- **Example Response**:
```json
{
  "id": 1,
  "username": "existinguser",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "date_joined": "2023-04-15T10:30:45Z"
}
```

#### Update User
- **URL**: `https://74.178.207.4.nip.io/users/api/users/me/`
- **Method**: PUT
- **Headers**: `Authorization: Bearer your-access-token`
- **Example Request Body**:
```json
{
  "email": "updated@example.com",
  "first_name": "Updated",
  "last_name": "User"
}
```


### Posts Service

**Base URL**: `https://74.178.207.4.nip.io/posts/`

#### Create Post
- **URL**: `https://74.178.207.4.nip.io/posts/api/posts/`
- **Method**: POST
- **Headers**: `Authorization: Bearer your-access-token`
- **Example Request Body**:
```json
{
  "title": "My New Post",
  "content": "This is the content of my new post."
}
```

#### Add Comment
- **URL**: `https://74.178.207.4.nip.io/posts/api/posts/42/comment/`
- **Method**: POST
- **Headers**: `Authorization: Bearer your-access-token`
- **Example Request Body**:
```json
{
  "content": "This is my comment on this post."
}
```

## Authentication Notes

- All endpoints except for auth service registration and login require authentication
- Authentication is done via Bearer token in the Authorization header
- Tokens expire after 60 minutes (as configured in settings)
- Use the refresh token endpoint to get a new access token when it expires
- Store tokens securely in your application (the frontend uses secure localStorage with expiration checks)

## Deployment Guide

### Prerequisites

- Azure subscription
- Azure CLI installed and logged in
- kubectl installed
- Docker installed
- Helm installed

### Building and Pushing Docker Images

1. **Build Docker images for each service**:
   ```bash
   docker build -t projetwebacr.azurecr.io/auth-service:v3 ./auth_service
   docker build -t projetwebacr.azurecr.io/users-service:v2 ./users_service
   docker build -t projetwebacr.azurecr.io/posts-service:v2 ./posts_service
   ```

2. **Log in to Azure Container Registry**:
   ```bash
   az acr login --name projetwebacr
   ```

3. **Push images to registry**:
   ```bash
   docker push projetwebacr.azurecr.io/auth-service:v3
   docker push projetwebacr.azurecr.io/users-service:v2
   docker push projetwebacr.azurecr.io/posts-service:v2
   ```

## Step-by-Step Azure Deployment Process

This section provides a detailed walkthrough of the entire deployment process on Azure Kubernetes Service (AKS), from initial Azure login to HTTPS setup.

### Azure Setup and Login

1. **Install Azure CLI** (if not already installed):
   ```bash
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Login to Azure account**:
   ```bash
   az login
   ```

3. **Create a resource group** (one-time setup):
   ```bash
   az group create --name projetWebResourceGroup --location westeurope
   ```

4. **Create an Azure Container Registry (ACR)** (one-time setup):
   ```bash
   az acr create --resource-group projetWebResourceGroup --name projetwebacr --sku Basic
   ```

5. **Create an AKS cluster** (one-time setup):
   ```bash
   az aks create \
     --resource-group projetWebResourceGroup \
     --name projetWebAKS \
     --node-count 2 \
     --generate-ssh-keys \
     --attach-acr projetwebacr
   ```

6. **Get credentials for kubectl**:
   ```bash
   az aks get-credentials --resource-group projetWebResourceGroup --name projetWebAKS
   ```

7. **Verify connection to the cluster**:
   ```bash
   kubectl get nodes
   ```

### Kubernetes Namespace and Secret Setup

1. **Create the application namespace**:
   ```bash
   kubectl create namespace app
   ```

2. **Create a secret for ACR access** (allows Kubernetes to pull images from your ACR):
   ```bash
   kubectl create secret docker-registry acr-secret \
     --namespace app \
     --docker-server=projetwebacr.azurecr.io \
     --docker-username=$(az acr credential show -n projetwebacr --query "username" -o tsv) \
     --docker-password=$(az acr credential show -n projetwebacr --query "passwords[0].value" -o tsv)
   ```

3. **Setup environment variables for deployment**:
   ```bash
   export AUTH_SECRET_KEY=""
   export USERS_SECRET_KEY=""
   export POSTS_SECRET_KEY=""
   export JWT_SECRET_KEY=""
   export DB_NAME=""
   export DB_USER=""
   export DB_PASSWORD=""
   export DB_HOST=""
   ```

### Deploying Services in Order

Since my microservices have dependencies on each other, I needed to deploy them in the correct order:

1. **Deploy the backend services** (using environment substitution):
   ```bash
   envsubst < k8s/app-deploy.yaml | kubectl apply -f -
   ```

2. **Verify that pods are running** (ensure auth service starts first):
   ```bash
   kubectl get pods -n app
   ```

3. **Check the logs of each service to ensure they started successfully**:
   ```bash
   # Check auth service logs
   kubectl logs -f deployment/auth -n app
   
   # Check users service logs
   kubectl logs -f deployment/users -n app
   
   # Check posts service logs
   kubectl logs -f deployment/posts -n app
   ```

### High Availability and Horizontal Scaling

My Kubernetes deployment is configured for high availability and dynamic horizontal scaling:

1. **Multiple Replicas**: Each service is deployed with 2 replicas by default for redundancy:
   ```yaml
   # From app-deploy.yaml
   spec:
     replicas: 2
   ```

2. **Automatic Horizontal Scaling**: I've implemented Horizontal Pod Autoscalers (HPA) for all services to automatically scale based on workload:
   ```bash
   # View current HPA configuration
   kubectl get hpa -n app
   ```

3. **Implementation Files**: The HPA configurations are stored in version control:
   - `k8s/auth-hpa.yaml`
   - `k8s/users-hpa.yaml`
   - `k8s/posts-hpa.yaml`


### Setting Up NGINX Ingress Gateway

1. **Add the NGINX Ingress Controller Helm repository**:
   ```bash
   helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
   helm repo update
   ```

2. **Install NGINX Ingress Controller with Helm**:
   ```bash
   helm install nginx-ingress ingress-nginx/ingress-nginx \
     --namespace ingress-nginx \
     --create-namespace \
     --set controller.replicaCount=2 \
     --set controller.nodeSelector."kubernetes\.io/os"=linux \
     --set defaultBackend.nodeSelector."kubernetes\.io/os"=linux
   ```

3. **Get the external IP address of the Ingress Controller**:
   ```bash
   kubectl get service nginx-ingress-ingress-nginx-controller -n ingress-nginx
   ```

4. **Apply the Ingress configuration**:
   ```bash
   kubectl apply -f k8s/app-ingress.yaml
   ```

### DNS Configuration (with nip.io)

I initially tried to configure a custom domain in Azure, but encountered DNS propagation delays. As a quick alternative, I chose to use nip.io which allows me to create DNS entries that resolve to specific IP addresses without DNS configuration.

The nip.io service automatically maps any subdomain of nip.io to the corresponding IP address, making it perfect for testing without DNS configuration.

### Implementing HTTPS with Let's Encrypt and cert-manager

1. **Install cert-manager using Helm**:
   ```bash
   helm repo add jetstack https://charts.jetstack.io
   helm repo update
   
   helm install cert-manager jetstack/cert-manager \
     --namespace cert-manager \
     --create-namespace \
     --set installCRDs=true
   ```

2. **Verify cert-manager installation**:
   ```bash
   kubectl get pods -n cert-manager
   ```

3. **Create a ClusterIssuer for Let's Encrypt**:
   ```bash
   kubectl apply -f k8s/cert-issuer.yaml
   ```

4. **Verify the ClusterIssuer is ready**:
   ```bash
   kubectl get clusterissuer letsencrypt -o wide
   ```

5. **Update the Ingress to use TLS and the Let's Encrypt ClusterIssuer**:
   ```yaml
   # Update app-ingress.yaml to include:
   annotations:
     cert-manager.io/cluster-issuer: "letsencrypt"
     nginx.ingress.kubernetes.io/ssl-redirect: "true"
   
   spec:
     tls:
     - hosts:
       - 74.178.207.4.nip.io
       secretName: api-tls-cert
   ```

6. **Apply the updated Ingress configuration**:
   ```bash
   kubectl apply -f k8s/app-ingress.yaml
   ```

7. **Verify certificate issuance**:
   ```bash
   kubectl get certificate -n app
   kubectl get certificaterequest -n app
   kubectl describe certificate api-tls-cert -n app
   ```

8. **Check certificate orders and challenges**:
   ```bash
   kubectl get orders --all-namespaces
   kubectl get challenges --all-namespaces
   ```

## Security Features

Security is a fundamental aspect of this application's architecture, implemented at multiple levels from code to infrastructure. The application follows industry best practices for both frontend and backend security.

### Secure Coding Practices

Security begins at the code level with several key practices:

1. **Input Validation**: All user inputs are validated both client-side and server-side to prevent injection attacks
2. **CSRF Protection**: Django's built-in CSRF protection is enabled for all forms
.. etc

### Network Security Architecture

The application implements a defense-in-depth approach to network security:

1. **Gateway-Only Exposure**: Only the NGINX Ingress Gateway is exposed externally, with all microservices unreachable from outside the cluster
2. **Network Policies**: Strict network policies control which services can communicate with each other
3. **HTTPS Everywhere**: All external traffic is encrypted using HTTPS with Let's Encrypt certificates

### Zero-Trust Architecture

The application follows a zero-trust security model:

1. **Independent Authentication**: Each microservice independently validates JWT tokens
2. **Service Isolation**: Services operate with minimal required permissions
3. **No Implicit Trust**: Services verify the identity and authorization of every request

### JWT Security Implementation

The application uses a robust JWT-based authentication system:

1. **Short-Lived Access Tokens**: Access tokens have a 60-minute lifetime, limiting the window of opportunity for token misuse
2. **Refresh Token Rotation**: Refresh tokens have a 24-hour lifetime and are used to obtain new access tokens

### Kubernetes RBAC and OIDC Integration

Access to the Kubernetes cluster is tightly controlled:

1. **RBAC Enabled**: Role-Based Access Control restricts permissions to the cluster with the current role using default one for azure, least privileged
2. **OIDC Integration**: OpenID Connect integration with Azure AD provides secure identity management


### Secrets Management

Sensitive information is securely managed:

1. **Kubernetes Secrets**: All credentials and keys are stored as Kubernetes secrets
2. **Azure Cloud Storage**: Secrets are stored in Azure's secure cloud infrastructure
3. **No Hardcoded Secrets**: No secrets are hardcoded in application code or Docker images
4. **Environment Variables**: Secrets are injected at runtime as environment variables

### Container Registry and Image Management

I use Azure Container Registry (ACR) as a secure, private registry for all Docker images:

1. **Private Image Storage**: All my microservice images are stored in a private Azure Container Registry, preventing unauthorized access
2. **Versioned Deployments**: Each service is tagged with specific versions (e.g., `v1`, `v2`, `v3`) enabling controlled rollouts and rollbacks
3. **Integration with AKS**: My AKS cluster is configured with ACR pull permissions, simplifying deployment workflows
4. **Secure Image Access**: Kubernetes uses a dedicated secret (`acr-secret`) to authenticate with ACR, following the principle of least privilege



