#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Kubernetes Cluster...${NC}"

# Check if minikube is installed
if ! command -v minikube &> /dev/null; then
    echo -e "${YELLOW}Minikube is not installed. Installing minikube...${NC}"
    curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
    sudo install minikube-linux-amd64 /usr/local/bin/minikube
    rm minikube-linux-amd64
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}kubectl is not installed. Using package manager to install it...${NC}"
    sudo apt-get update && sudo apt-get install -y kubectl
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Failed to install kubectl with apt. Trying snap...${NC}"
        sudo snap install kubectl --classic
    fi
fi

# Start minikube with specific version to avoid issues
echo -e "${GREEN}Starting minikube...${NC}"
minikube start --driver=docker --kubernetes-version=v1.25.0

# Enable ingress addon
echo -e "${GREEN}Enabling and configuring Nginx Ingress Controller...${NC}"
minikube addons enable ingress

# Wait for Nginx Ingress Controller to be ready
echo -e "${GREEN}Waiting for Nginx Ingress Controller to be ready...${NC}"
kubectl -n ingress-nginx wait --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=180s || true

# Apply the Nginx Ingress Controller advanced configuration
echo -e "${GREEN}Applying Nginx Ingress Controller API Gateway configuration...${NC}"
kubectl apply -f nginx-config.yaml

# Install Helm if not installed
if ! command -v helm &> /dev/null; then
    echo -e "${YELLOW}Helm is not installed. Installing Helm...${NC}"
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# Build Docker images for services
echo -e "${GREEN}Building Docker images for services...${NC}"
eval $(minikube docker-env)
docker build -t auth_service:latest ./auth_service
docker build -t users_service:latest ./users_service
docker build -t posts_service:latest ./posts_service

# Apply Kubernetes configurations
echo -e "${GREEN}Applying Kubernetes configurations...${NC}"
kubectl apply -f db.yaml
kubectl apply -f auth.yaml
kubectl apply -f users.yaml
kubectl apply -f posts.yaml

# Wait for services to be ready
echo -e "${GREEN}Waiting for services to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/auth-service
kubectl wait --for=condition=available --timeout=300s deployment/users-service
kubectl wait --for=condition=available --timeout=300s deployment/posts-service
kubectl wait --for=condition=available --timeout=300s deployment/db

# Apply the Ingress configuration last to make sure all services are ready
echo -e "${GREEN}Applying Ingress API Gateway configuration...${NC}"
kubectl apply -f ingress.yaml

# Restart the Nginx Ingress Controller to apply the config
echo -e "${GREEN}Restarting Nginx Ingress Controller to apply configuration...${NC}"
kubectl -n ingress-nginx rollout restart deployment ingress-nginx-controller

# Get the ingress IP and display access information
echo -e "${GREEN}Getting the Nginx Ingress Controller information...${NC}"
minikube service list

# Get ingress address
INGRESS_HOST=$(minikube ip)
echo -e "${GREEN}Your API Gateway endpoints:${NC}"
echo -e "${YELLOW}Authentication Service: http://$INGRESS_HOST/auth/${NC}"
echo -e "${YELLOW}Users Service: http://$INGRESS_HOST/users/${NC}"
echo -e "${YELLOW}Posts Service: http://$INGRESS_HOST/posts/${NC}"

echo -e "${GREEN}Kubernetes setup with Nginx Ingress API Gateway complete!${NC}" 