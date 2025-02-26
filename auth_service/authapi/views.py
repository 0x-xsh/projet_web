from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.conf import settings
import requests
import logging
from .service_registry import service_registry

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')

        if not username or not password:
            return Response({'detail': 'Username and password are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'detail': 'Username already exists'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password, email=email)
        
        # Sync user to users service using service discovery
        try:
            response = service_registry.request_service(
                'users-service',
                '/api/users/sync/',
                method='POST',
                json={
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            )
            if not response or not response.ok:
                logger.error(f"Failed to sync user to users service: {response.text if response else 'No response'}")
        except Exception as e:
            logger.error(f"Error syncing user to users service: {str(e)}")

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'detail': 'Username and password are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials'}, 
                          status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'detail': 'Invalid credentials'}, 
                          status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_token(request):
    """
    Verify the provided JWT token and return user information if valid.
    This can be used by other services to validate authentication.
    """
    try:
        token = request.data.get('token')
        if not token:
            return Response({'detail': 'Token is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
            
        # The authentication middleware will validate the token
        # If we reach here, the token is valid
        return Response({
            'valid': True,
            'user_id': request.user.id,
            'username': request.user.username
        })
    except Exception as e:
        return Response({
            'valid': False,
            'detail': str(e)
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for the auth service.
    """
    return Response({
        'status': 'healthy',
        'service': 'auth-service'
    }, status=status.HTTP_200_OK) 