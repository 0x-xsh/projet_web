#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if minikube is running
if ! minikube status | grep -q "host: Running"; then
    echo -e "${RED}Error: Minikube is not running. Please start it with ./simplified-k8s-setup.sh${NC}"
    exit 1
fi

# Get the Minikube IP
MINIKUBE_IP=$(minikube ip)
if [ -z "$MINIKUBE_IP" ]; then
    echo -e "${RED}Error: Could not get Minikube IP${NC}"
    exit 1
fi

echo -e "${GREEN}Testing API Gateway at $MINIKUBE_IP${NC}"
echo

# Check if Nginx Ingress Controller is running
echo -e "${YELLOW}Checking Nginx Ingress Controller...${NC}"
if kubectl get pods -n ingress-nginx | grep -q "ingress-nginx-controller.*Running"; then
    echo -e "${GREEN}✓ Nginx Ingress Controller is running${NC}"
else
    echo -e "${RED}✗ Nginx Ingress Controller is not running${NC}"
    echo -e "${YELLOW}Pods in ingress-nginx namespace:${NC}"
    kubectl get pods -n ingress-nginx
fi
echo

# Check if the ingress resource is configured
echo -e "${YELLOW}Checking Ingress resource...${NC}"
if kubectl get ingress api-gateway &>/dev/null; then
    echo -e "${GREEN}✓ API Gateway ingress is configured${NC}"
    kubectl get ingress api-gateway
else
    echo -e "${RED}✗ API Gateway ingress is not configured${NC}"
fi
echo

# Check if services are running
echo -e "${YELLOW}Checking microservices...${NC}"
services=("db" "auth-service" "users-service" "posts-service")
for svc in "${services[@]}"; do
    if kubectl get service "$svc" &>/dev/null; then
        echo -e "${GREEN}✓ Service $svc is configured${NC}"
    else
        echo -e "${RED}✗ Service $svc is not configured${NC}"
    fi
done
echo

# Test basic connectivity
echo -e "${YELLOW}Testing basic connectivity to API Gateway...${NC}"
if curl -s --connect-timeout 5 "http://$MINIKUBE_IP" &>/dev/null; then
    echo -e "${GREEN}✓ API Gateway is responding${NC}"
else
    echo -e "${RED}✗ Cannot connect to API Gateway${NC}"
fi
echo

# Test endpoints
echo -e "${YELLOW}Testing endpoints (this may take some time if services are still starting)...${NC}"
endpoints=("/auth/" "/users/" "/posts/")
for endpoint in "${endpoints[@]}"; do
    echo -e "Testing $endpoint"
    response=$(curl -s --connect-timeout 10 -o /dev/null -w "%{http_code}" "http://$MINIKUBE_IP$endpoint")
    if [[ "$response" == "200" || "$response" == "404" || "$response" == "401" ]]; then
        echo -e "${GREEN}✓ Endpoint $endpoint is responding (HTTP $response)${NC}"
    else
        echo -e "${RED}✗ Endpoint $endpoint returned HTTP $response${NC}"
    fi
done

echo
echo -e "${GREEN}API Gateway test complete!${NC}" 