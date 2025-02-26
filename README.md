# Microservices on Kubernetes

This project contains a microservices architecture running on Kubernetes. It consists of three main services:

- **Auth Service**: Handles authentication and authorization
- **Users Service**: Manages user data and profiles
- **Posts Service**: Manages posts and content

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
- Enable the Nginx ingress controller
- Build Docker images for all services
- Deploy all services to Kubernetes

## Architecture

The application is built as a set of microservices running in Kubernetes:

- **Auth Service**: Handles JWT token generation and validation
- **Users Service**: Manages user profiles and user-related operations
- **Posts Service**: Manages posts creation, updates, and reading
- **Database**: PostgreSQL database for all services
- **Ingress Controller**: Routes external traffic to internal services

## Accessing the Services

After running the setup script, you can access the services through the Ingress:

```bash
minikube service list
```

This will show all available services and their URLs.

To access the services directly, you can use port forwarding:

```bash
# Auth Service
kubectl port-forward svc/auth-service 9000:9000

# Users Service
kubectl port-forward svc/users-service 9002:9002

# Posts Service
kubectl port-forward svc/posts-service 9001:9001
```

## API Endpoints

- Auth Service: `/auth/...`
- Users Service: `/users/...`
- Posts Service: `/posts/...`

## Scaling

To scale a service, use:

```bash
kubectl scale deployment/auth-service --replicas=3
```

## Monitoring

To view logs:

```bash
kubectl logs deployment/auth-service
```

## Troubleshooting

If you encounter issues:

1. Check pod status: `kubectl get pods`
2. Check pod logs: `kubectl logs <pod-name>`
3. Check service status: `kubectl get svc`
4. Check ingress status: `kubectl get ingress`

## Cleanup

To delete the Kubernetes cluster:

```bash
minikube delete
``` 