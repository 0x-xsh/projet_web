from rest_framework_simplejwt.authentication import JWTAuthentication
from django.urls import resolve

class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # Skip authentication for register endpoint
        if resolve(request.path).url_name == 'register':
            return None
        return super().authenticate(request) 