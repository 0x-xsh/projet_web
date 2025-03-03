import requests
import os
import logging
from django.conf import settings
from rest_framework import authentication
from rest_framework import exceptions
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth.models import User
import jwt
from jwt.exceptions import PyJWTError

logger = logging.getLogger(__name__)

class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        if not auth_header.startswith('Bearer '):
            raise exceptions.AuthenticationFailed('Invalid token header. Token should begin with Bearer')

        try:
            token = auth_header.split(' ')[1]
            
            # Use proper token validation
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Try to find the user
            try:
                user = User.objects.get(id=user_id)
                return (user, None)
            except User.DoesNotExist:
                raise exceptions.AuthenticationFailed('User not found')
                
        except TokenError as e:
            logger.error(f"Token error: {str(e)}")
            raise exceptions.AuthenticationFailed(f'Invalid token: {str(e)}')
        except PyJWTError as e:
            logger.error(f"JWT error: {str(e)}")
            raise exceptions.AuthenticationFailed(f'JWT error: {str(e)}')
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            raise exceptions.AuthenticationFailed(f'Authentication failed: {str(e)}') 