from rest_framework import serializers
from .models import Post, Comment, Like

class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = Comment
        fields = ('id', 'content', 'author', 'author_username', 'created_at', 'updated_at')
        read_only_fields = ('id', 'author', 'created_at', 'updated_at')

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ('id', 'user', 'post', 'created_at')
        read_only_fields = ('id', 'user', 'post', 'created_at')

class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    like_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ('id', 'title', 'content', 'author', 'author_username', 'created_at', 
                 'updated_at', 'comments', 'like_count', 'is_liked')
        read_only_fields = ('id', 'author', 'created_at', 'updated_at', 'like_count', 'is_liked')

    def get_like_count(self, obj):
        return obj.like_count
    
    def get_is_liked(self, obj):
        user = self.context.get('request').user
        if user.is_anonymous:
            return False
        return user.id in obj.liked_by

    def create(self, validated_data):
        # Set the author to the current authenticated user
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data) 