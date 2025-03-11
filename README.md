# Microservices Social Media Application

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Backend Services](#backend-services)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Deployment Guide](#deployment-guide)
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
6. [Security Features](#security-features)
7. [Local Development](#local-development)

## Project Overview

This application is built using a microservices architecture with Django-based backend services and a React frontend. The services communicate with each other through REST APIs and are deployed on Azure Kubernetes Service (AKS).

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
   export AUTH_SECRET_KEY="django-insecure-auth-service-prod-7y_z@1wz*@bpj=m*_z3u*u2e9h82t*5d@e6k6^s1b6m"
   export USERS_SECRET_KEY="django-insecure-users-service-prod-7y_z@1wz*@bpj=m*_z3u*u2e9h82t*5d@e6k6^s1b6m"
   export POSTS_SECRET_KEY="django-insecure-posts-service-prod-7y_z@1wz*@bpj=m*_z3u*u2e9h82t*5d@e6k6^s1b6m"
   export JWT_SECRET_KEY="SHARED-JWT-SECRET-KEY-FOR-ALL-MICROSERVICES-PROD-7y_z@1wz*@bpj=m*_z3u*u2e9h82t*5d"
   export DB_NAME="microservices_db"
   export DB_USER="postgres"
   export DB_PASSWORD="PostgresPass123!"
   export DB_HOST="projet-web-db.postgres.database.azure.com"
   ```

### Deploying Services in Order

Since our microservices have dependencies on each other, we need to deploy them in the correct order:

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

Our Kubernetes deployment is configured for high availability and dynamic horizontal scaling:

1. **Multiple Replicas**: Each service is deployed with 2 replicas by default for redundancy:
   ```yaml
   # From app-deploy.yaml
   spec:
     replicas: 2
   ```

2. **Automatic Horizontal Scaling**: We've implemented Horizontal Pod Autoscalers (HPA) for all services to automatically scale based on workload:
   ```bash
   # View current HPA configuration
   kubectl get hpa -n app
   ```

3. **HPA Configuration**: Each service uses the following scaling parameters:
   - Minimum 2 replicas to maintain high availability
   - Maximum 5 replicas to handle traffic spikes
   - CPU utilization target of 70%
   - Memory utilization target of 80%

   Example output:
   ```
   NAME       REFERENCE          TARGETS                        MINPODS   MAXPODS   REPLICAS   AGE
   auth-hpa   Deployment/auth    67%/70%, 52%/80%              2         5         2          14h
   users-hpa  Deployment/users   45%/70%, 30%/80%              2         5         2          14h
   posts-hpa  Deployment/posts   72%/70%, 65%/80%              2         5         3          14h
   ```

4. **Resource Requests and Limits**: All deployments have defined resource requests to enable effective HPA operation:
   ```yaml
   resources:
     requests:
       cpu: "100m"     # Request 0.1 CPU cores
       memory: "128Mi" # Request 128MB memory
     limits:
       cpu: "500m"     # Limit to 0.5 CPU cores
       memory: "512Mi" # Limit to 512MB memory
   ```

5. **Gradual Scaling Behavior**: We've configured stabilization windows to prevent thrashing:
   - Scale down: 300-second stabilization window to prevent premature scale-down
   - Scale up: 60-second stabilization window for quicker response to traffic spikes

6. **Implementation Files**: The HPA configurations are stored in version control:
   - `k8s/auth-hpa.yaml`
   - `k8s/users-hpa.yaml`
   - `k8s/posts-hpa.yaml`

This autoscaling approach ensures optimal resource utilization and automatically adjusts capacity based on actual workload patterns, improving both cost efficiency and performance.

7. **Manual Scaling (if needed)**: You can still manually scale services in exceptional circumstances:
   ```bash
   # Scale up auth service to 3 replicas
   kubectl scale deployment auth -n app --replicas=3
   
   # Verify the change (HPA will eventually override this unless you disable it)
   kubectl get pods -n app
   ```

### Setting Up NGINX Ingress Controller

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
   
   Example output:
   ```
   NAME                                     TYPE           CLUSTER-IP    EXTERNAL-IP     PORT(S)                      AGE
   nginx-ingress-ingress-nginx-controller   LoadBalancer   10.0.73.155   74.178.207.4    80:30222/TCP,443:32607/TCP   12h
   ```

4. **Apply the Ingress configuration**:
   ```bash
   kubectl apply -f k8s/app-ingress.yaml
   ```

### DNS Configuration (with nip.io)

We initially tried to configure a custom domain in Azure, but encountered DNS propagation delays. As a quick alternative, we chose to use nip.io which allows us to create DNS entries that resolve to specific IP addresses without DNS configuration.

1. **Get the external IP of your Ingress Controller**:
   ```bash
   EXTERNAL_IP=$(kubectl get service nginx-ingress-ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
   echo $EXTERNAL_IP
   ```

2. **Using nip.io for quick DNS resolution**:
   The format is: <ip-address>.nip.io
   
   For example, with the IP address 74.178.207.4, we used:
   ```
   74.178.207.4.nip.io
   ```

3. **Update Ingress configuration to use nip.io**:
   ```bash
   # Example of manually editing app-ingress.yaml to use:
   # - host: 74.178.207.4.nip.io
   kubectl apply -f k8s/app-ingress.yaml
   ```

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

9. **Test HTTPS endpoint**:
   ```bash
   curl -v https://74.178.207.4.nip.io/auth/health/
   ```

### Troubleshooting Tips

If you encounter issues during the deployment process:

1. **Check pod status and logs**:
   ```bash
   kubectl get pods -n app
   kubectl describe pod <pod-name> -n app
   kubectl logs <pod-name> -n app
   ```

2. **Check Ingress status**:
   ```bash
   kubectl get ingress -n app
   kubectl describe ingress api-ingress -n app
   ```

3. **Check certificate status**:
   ```bash
   kubectl get certificate -n app
   kubectl describe certificate api-tls-cert -n app
   ```

4. **Verify connectivity between services**:
   ```bash
   # Use a temporary pod to test connectivity
   kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- sh
   # Then from inside the pod
   curl http://auth.app.svc.cluster.local:9000/auth/health/
   ```

### Database Migrations

Migrations are handled directly in the Dockerfile's CMD instruction, NOT through a separate entrypoint script as previously mentioned. The actual implementation is:

```dockerfile
# In each service's Dockerfile:
CMD bash -c "python manage.py migrate && python manage.py runserver 0.0.0.0:9000"
```

This means:
1. Every time a container starts, it runs migrations first
2. Only after migrations complete successfully does the service start
3. Services must be started in sequence due to database dependencies:

```
# Service startup MUST follow this order
1. Auth Service first → Base tables and authentication models
2. Users Service second → Depends on Auth tables 
3. Posts Service last → Depends on both Auth and Users tables
```

The Docker Compose file enforces this dependency order with:
```yaml
users_service:
  # ...
  depends_on:
    - db
    - auth_service

posts_service:
  # ...
  depends_on:
    - db
    - auth_service
    - users_service
```

If you need to manually trigger migrations (after schema changes), use:
```bash
# Auth Service migrations
kubectl exec -it $(kubectl get pods -n app -l app=auth -o jsonpath='{.items[0].metadata.name}') -n app -- python manage.py migrate

# Users Service migrations (after auth completes)
kubectl exec -it $(kubectl get pods -n app -l app=users -o jsonpath='{.items[0].metadata.name}') -n app -- python manage.py migrate

# Posts Service migrations (after both auth and users complete)
kubectl exec -it $(kubectl get pods -n app -l app=posts -o jsonpath='{.items[0].metadata.name}') -n app -- python manage.py migrate
```

This migration sequence is critical - running them out of order will cause database reference errors.

## Security Features

The application implements several security features, including:

1. **Authentication**: Users must log in to access the application.
2. **Authorization**: Users can only access resources they are authorized to access.
3. **Data Encryption**: All data is encrypted in transit and at rest.
4. **Rate Limiting**: To prevent abuse, the application implements rate limiting for certain endpoints.
5. **Auditing**: All actions are logged for auditing purposes.

### Zero Trust Architecture

The application follows a Zero Trust security model where no service or user is trusted by default, regardless of their location within the network. Key implementation details include:

1. **Independent JWT Validation**: Each microservice validates JWT tokens independently rather than relying on a gateway or another service's validation. This ensures that:
   - If one service is compromised, it doesn't automatically grant access to other services
   - There's no single point of failure in the authentication chain
   - Each service can implement specific authorization policies

2. **Shared JWT Secret Management**: 
   - The JWT secret key is stored in Azure Key Vault for secure management
   - Each service retrieves the secret at runtime from the vault
   - The secret is injected into the Kubernetes environment through:
     ```yaml
     env:
       - name: JWT_SECRET_KEY
         valueFrom:
           secretKeyRef:
             name: app-secrets
             key: JWT_SECRET_KEY
     ```

3. **Token Validation Process**:
   - Each request containing a JWT is verified with the shared secret
   - Tokens are checked for expiration, issuer validity, and signature integrity
   - Services verify specific claims relevant to their domain
   - Failed validation immediately rejects the request, regardless of source

This approach ensures that even if traffic reaches a service through internal networking, it still requires proper authentication and authorization before any data access is permitted.

## Local Development

The application can be run locally using Docker Compose. To do this, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/microservices-social-media-app.git
   cd microservices-social-media-app
   ```

2. **Build Docker images**:
   ```bash
   docker-compose build
   ```

3. **Run Docker Compose**:
   ```bash
   docker-compose up
   ```

This will start all the services locally.

