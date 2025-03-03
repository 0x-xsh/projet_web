#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the Minikube IP
MINIKUBE_IP=$(minikube ip)
if [ -z "$MINIKUBE_IP" ]; then
    echo -e "${RED}Error: Could not get Minikube IP. Is Minikube running?${NC}"
    exit 1
fi

echo -e "${GREEN}Testing Nginx API Gateway on $MINIKUBE_IP${NC}"
echo

# Test Auth Service
echo -e "${YELLOW}Testing Auth Service...${NC}"
echo -e "GET /auth/ response:"
curl -s -X GET -H "Content-Type: application/json" http://$MINIKUBE_IP/auth/ | jq . || echo "Raw response: $(curl -s -X GET http://$MINIKUBE_IP/auth/)"
echo

# Test CORS headers
echo -e "${YELLOW}Testing CORS headers...${NC}"
echo -e "OPTIONS request to check CORS headers:"
curl -s -X OPTIONS -i http://$MINIKUBE_IP/auth/ | grep -i "Access-Control"
echo

# Test Users Service
echo -e "${YELLOW}Testing Users Service...${NC}"
echo -e "GET /users/ response:"
curl -s -X GET -H "Content-Type: application/json" http://$MINIKUBE_IP/users/ | jq . || echo "Raw response: $(curl -s -X GET http://$MINIKUBE_IP/users/)"
echo

# Test Posts Service
echo -e "${YELLOW}Testing Posts Service...${NC}"
echo -e "GET /posts/ response:"
curl -s -X GET -H "Content-Type: application/json" http://$MINIKUBE_IP/posts/ | jq . || echo "Raw response: $(curl -s -X GET http://$MINIKUBE_IP/posts/)"
echo

echo -e "${GREEN}API Gateway testing complete!${NC}" 