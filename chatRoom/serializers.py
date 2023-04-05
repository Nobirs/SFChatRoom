from django.contrib.auth.models import User

from .models import Room, Message
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['message', 'time_added', 'from_user']


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['name', 'users']