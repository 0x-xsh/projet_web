#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Kubernetes Cluster with Nginx Ingress API Gateway...${NC}"

# Delete any existing minikube cluster
echo -e "${YELLOW}Cleaning up any existing clusters...${NC}"
minikube delete

# Start minikube with reasonable defaults
echo -e "${GREEN}Starting fresh minikube cluster...${NC}"
minikube start --driver=docker --memory=2048mb --cpus=2 --kubernetes-version=v1.26.0 || {
    echo -e "${RED}Failed to start minikube with recommended settings, trying with minimal settings...${NC}"
    minikube start --driver=docker --kubernetes-version=v1.26.0
}

# Wait for the cluster to be ready
echo -e "${GREEN}Waiting for Kubernetes cluster to be ready...${NC}"
sleep 10

# Enable ingress addon - this is the key part for the API gateway
echo -e "${GREEN}Enabling Nginx Ingress Controller...${NC}"
minikube addons enable ingress

# Verify the ingress controller is running
echo -e "${GREEN}Waiting for Nginx Ingress Controller to be ready...${NC}"
kubectl -n ingress-nginx wait --for=condition=available deployment/ingress-nginx-controller --timeout=300s || {
    echo -e "${YELLOW}Waiting for pods to initialize...${NC}"
    sleep 60
    kubectl get pods -n ingress-nginx
}

# Apply services - essential components first
echo -e "${GREEN}Applying database configuration...${NC}"
kubectl apply -f db.yaml

echo -e "${GREEN}Applying services configuration...${NC}"
kubectl apply -f auth.yaml
kubectl apply -f users.yaml
kubectl apply -f posts.yaml

# Wait for services to be ready
echo -e "${GREEN}Waiting for services to be ready...${NC}"
# Use a longer timeout and add || true to prevent script failure if one service takes too long
kubectl wait --for=condition=available --timeout=180s deployment/db || true
kubectl wait --for=condition=available --timeout=180s deployment/auth-service || true
kubectl wait --for=condition=available --timeout=180s deployment/users-service || true
kubectl wait --for=condition=available --timeout=180s deployment/posts-service || true

# Now apply the ingress rule after services are ready
echo -e "${GREEN}Applying API Gateway ingress configuration...${NC}"
kubectl apply -f ingress.yaml

# Get ingress status
echo -e "${GREEN}API Gateway status:${NC}"
kubectl get ingress

# Display endpoint information
MINIKUBE_IP=$(minikube ip)
echo -e "${GREEN}Your API Gateway is available at:${NC}"
echo -e "${YELLOW}http://$MINIKUBE_IP${NC}"
echo
echo -e "${GREEN}Endpoints:${NC}"
echo -e "${YELLOW}- Authentication: http://$MINIKUBE_IP/auth/${NC}"
echo -e "${YELLOW}- Users: http://$MINIKUBE_IP/users/${NC}"
echo -e "${YELLOW}- Posts: http://$MINIKUBE_IP/posts/${NC}"
echo
echo -e "${GREEN}Setup complete!${NC}" 