from django.shortcuts import render, get_object_or_404
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from .serializers import UserSerializer, PublicUserSerializer
from .authentication import JWTAuthentication
from django.contrib.auth.models import User

# Create your views here.


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_token(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'detail': 'Invalid token header'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        token = auth_header.split(' ')[1]
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        return Response({
            'id': user_id,
            'is_authenticated': True
        })
    except TokenError:
        return Response({'detail': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception:
        return Response({'detail': 'Authentication failed'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([AllowAny])  # Anyone can fetch basic user info
def get_user_by_id(request, user_id):
    try:
        user = get_object_or_404(User, id=user_id)
        serializer = PublicUserSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception:
        return Response({'detail': 'Error retrieving user'}, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Return the authenticated user
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            # Prevent password update through this endpoint
            if 'password' in serializer.validated_data:
                return Response(
                    {"detail": "Password cannot be updated through this endpoint"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        user = self.get_object()
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
