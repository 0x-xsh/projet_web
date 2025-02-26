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
    echo -e "${YELLOW}kubectl is not installed. Using existing kubectl in the project...${NC}"
    chmod +x ./kubectl
    sudo mv ./kubectl /usr/local/bin/
fi

# Start minikube
echo -e "${GREEN}Starting minikube...${NC}"
minikube start --driver=docker

# Enable ingress addon
echo -e "${GREEN}Enabling ingress addon...${NC}"
minikube addons enable ingress

# Install Helm if not installed
if ! command -v helm &> /dev/null; then
    echo -e "${YELLOW}Helm is not installed. Installing Helm...${NC}"
    chmod +x ./get_helm.sh
    ./get_helm.sh
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
kubectl apply -f ingress.yaml

# Wait for services to be ready
echo -e "${GREEN}Waiting for services to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/auth-service
kubectl wait --for=condition=available --timeout=300s deployment/users-service
kubectl wait --for=condition=available --timeout=300s deployment/posts-service
kubectl wait --for=condition=available --timeout=300s deployment/db

# Get the ingress IP
echo -e "${GREEN}Getting the ingress URL...${NC}"
minikube service list

echo -e "${GREEN}To access the services, run: ${YELLOW}minikube service api-gateway${NC}"
echo -e "${GREEN}Kubernetes setup complete!${NC}" 