import json

from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponseRedirect
from django.urls import reverse_lazy, reverse
from django.shortcuts import render, redirect
from django.views import generic


from rest_framework.response import Response
from rest_framework.parsers import JSONParser

from io import BytesIO

from myAuth.models import UserIcons
from .models import Message, Room

from rest_framework import viewsets
from rest_framework import permissions
from .serializers import UserSerializer, MessageSerializer, RoomSerializer


class LobbyView(LoginRequiredMixin, generic.View):
    template_name = "chatRoom/index.html"

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name, context=self.get_context_data(request=request))

    def get_context_data(self, **kwargs):
        context = {
            'chat_name': 'global',
            'request': kwargs['request'],
        }
        global_room = Room.objects.get(name='global')
        global_messages = Message.objects.all().filter(group=global_room.id)
        context['messages'] = global_messages

        context['available_rooms'] = kwargs['request'].user.room_set.all()

        all_users = User.objects.all()
        users = {}
        users_id = {}
        for user in all_users:
            try:
                user_icon = UserIcons.objects.get(user_id=user.id)
            except UserIcons.DoesNotExist:
                user_icon = None
            users[user.username] = user_icon
            users_id[user.username] = user.id
        context['users'] = users
        context['users_id'] = users_id
        print(users)

        return context


class UserViewSet(viewsets.ViewSet):

    def list(self, request):
        if not request.user.is_anonymous:
            queryset = Room.objects.get(name=request.GET.get('group', 'global')).users.all()
            serializer = UserSerializer(queryset, many=True)
            return Response(serializer.data)
        else:
            return Response({
                'Error': 'Only for authenticated users'
            })


class RoomViewSet(viewsets.ViewSet):
    def list(self, request):
        if request.GET.get('list', None) == 'all':
            if not request.user.is_anonymous:
                rooms = Room.objects.all()
                serializer = RoomSerializer(rooms, many=True)
                return Response(serializer.data)
            else:
                return Response({
                    'Error': 'Only for authenticated users'
                })
        else:
            if not request.user.is_anonymous:
                user = request.user
                rooms = user.room_set.all()
                serializer = RoomSerializer(rooms, many=True)
                return Response(serializer.data)
            else:
                return Response({
                    'Error': 'Only for authenticated users'
                })

    def create(self, request):
        if not request.user.is_anonymous:
            rooms_names = [room.name for room in Room.objects.all()]
            # post_params = JSONParser().parse(stream=BytesIO(request.body))
            post_params = request.data
            print(post_params)

            if post_params['group_name'] not in rooms_names:
                new_room = Room.objects.create(
                    name=post_params['group_name']
                )
                new_room.users.add(request.user)
                return Response(RoomSerializer(new_room).data)
            else:
                return Response({
                    'Error': 'Room with this name already exists'
                })
        else:
            return Response({
                'Error': 'Only for authenticated users'
            })

    def update(self, request):
        if not request.user.is_anonymous:
            rooms_names = [room.name for room in Room.objects.all()]
            # post_params = JSONParser().parse(stream=BytesIO(request.body))
            post_params = request.data
            print(post_params)
            try:
                room = Room.objects.get(name=post_params['group_name'])
            except Room.DoesNotExist:
                return Response({
                    'Error': 'Room with given name DoesNotExist'
                })
            try:
                user = User.objects.get(username=post_params['username'])
            except User.DoesNotExist:
                return Response({
                    'Error': 'User with given username DoesNotExist'
                })
            if user not in room.users.all():
                room.users.add(user)
            return Response(RoomSerializer(room).data)
        else:
            return Response({
                'Error': 'Only for authenticated users'
            })


class MessageViewSet(viewsets.ViewSet):
    def list(self, request):
        if not request.user.is_anonymous:
            room_name = request.GET.get('group', 'private')
            print(f"\n\n{request.GET.get('group', 'private')}\n\n")
            try:
                room = Room.objects.get(name=room_name)
            except Room.DoesNotExist:
                return Response({
                    'Error': 'Such room does not exist'
                })
            messages = Message.objects.filter(group=room).order_by('time_added').all()
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data)
        else:
            return Response({
                'Error': 'Only for authenticated users'
            })


def home_if_authorized(request):
    if not request.user.is_authenticated:
        return redirect('signUp')
    else:
        return HttpResponseRedirect(reverse('profile', args=(request.user.id,)))