# Microservices on Kubernetes with Nginx API Gateway

This project contains a microservices architecture running on Kubernetes with an Nginx-based API Gateway. It consists of three main services:

- **Auth Service**: Handles authentication and authorization
- **Users Service**: Manages user data and profiles
- **Posts Service**: Manages posts and content

## API Gateway Architecture

The system uses the Nginx Ingress Controller as an API Gateway with the following features:
- **Path-based routing**: Routes requests to appropriate microservices
- **Cross-Origin Resource Sharing (CORS)**: Configured to allow cross-origin requests
- **Rate limiting**: Protects the API from abuse
- **Request/response transformation**: URL rewriting for clean API paths
- **Security headers**: Additional HTTP security headers on all responses

## Prerequisites

- Docker
- Minikube (for local Kubernetes)
- kubectl
- Helm (optional)

## Setup

1. Clone this repository
2. Run the setup script:

```bash
chmod +x k8s-setup.sh
./k8s-setup.sh
```

This script will:
- Install Minikube if not already installed
- Set up a local Kubernetes cluster
- Enable and configure the Nginx Ingress Controller as an API Gateway
- Build Docker images for all services
- Deploy all services to Kubernetes
- Apply advanced API Gateway configurations

## API Endpoints

All endpoints are accessible through the API Gateway at the Minikube IP address:

- **Auth Service**: `/auth/...`
  - `/auth/register/` - Register a new user
  - `/auth/token/` - Get authentication token

- **Users Service**: `/users/...`
  - `/users/` - List and create users
  - `/users/:id/` - Get, update or delete a user

- **Posts Service**: `/posts/...`
  - `/posts/` - List and create posts
  - `/posts/:id/` - Get, update or delete a post

## Testing the API Gateway

A script is provided to test the API Gateway functionality:

```bash
chmod +x test-api-gateway.sh
./test-api-gateway.sh
```

## Additional API Gateway Features

The API Gateway provides several features to enhance your microservices:

1. **Rate Limiting**: Prevents abuse by limiting requests from a single client
2. **CORS Support**: Allows web applications from other domains to access your API
3. **Security Headers**: Adds security-related HTTP headers to all responses
4. **Path Rewriting**: Creates clean API endpoints without exposing service details
5. **Timeout Configuration**: Custom timeout settings for handling long-running operations

## Accessing the Services

After running the setup script, you can access the services through the API Gateway:

```bash
# Get the Minikube IP
minikube ip
```

Then access the services at:
- `http://<minikube-ip>/auth/`
- `http://<minikube-ip>/users/`
- `http://<minikube-ip>/posts/`

## Monitoring

To view logs:

```bash
# Nginx Ingress Controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Service logs
kubectl logs deployment/auth-service
kubectl logs deployment/users-service
kubectl logs deployment/posts-service
```

## Troubleshooting

If you encounter issues:

1. Check pod status: `kubectl get pods`
2. Check ingress status: `kubectl get ingress`
3. Check Nginx Ingress Controller: `kubectl get pods -n ingress-nginx`
4. View Nginx configuration: `kubectl exec -it -n ingress-nginx $(kubectl get pods -n ingress-nginx -l app.kubernetes.io/component=controller -o jsonpath='{.items[0].metadata.name}') -- cat /etc/nginx/nginx.conf`

## Cleanup

To delete the Kubernetes cluster:

```bash
minikube delete
``` 