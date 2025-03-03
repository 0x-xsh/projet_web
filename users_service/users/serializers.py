from django.contrib.auth.models import User
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')
        read_only_fields = ('id',)

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class PublicUserSerializer(serializers.ModelSerializer):
    """
    A limited serializer for public user data, exposing only the ID and username.
    Used when returning user data to non-authenticated requests or other users.
    """
    class Meta:
        model = User
        fields = ('id', 'username')
        read_only_fields = fields 