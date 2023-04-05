import json

from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

from .models import Message, Room
from myAuth.models import UserIcons


class ChatConsumer(WebsocketConsumer):
    def connect(self):
        print(self)
        self.room_group_name = self.scope['url_route']['kwargs']['room_name']
        #self.room_group_name = 'chat_%s' % self.room_name
        if not Room.objects.filter(name=self.room_group_name).exists():
            new_room = Room(name=self.room_group_name)
            new_room.save()

        user = self.scope['user']
        new_room = Room.objects.get(name=self.room_group_name)
        if user not in new_room.users.all():
            new_room.users.add(user)


        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'chat_message',
                'room_name': self.room_group_name,
                'message': message
            }
        )

    def chat_message(self, event):
        message = event['message']

        from_user = self.scope['user']
        print(f"\n\n{self.room_group_name}\n\n")
        new_message = Message(message=message, from_user=from_user, group=Room.objects.get(name=self.room_group_name))
        new_message.save()

        user_icon_path = ''
        try:
            user_icon = UserIcons.objects.get(user_id=from_user.id)
            user_icon_path = user_icon.user_icon_path.url
        except UserIcons.DoesNotExist:
            pass

        self.send(text_data=json.dumps({
            'type': 'chat_message',
            'from_user': from_user.username,
            'message_time': json.dumps((new_message.time_added).strftime('%I:%M %p')),
            'user_icon_path': user_icon_path,
            'room_name': self.room_group_name,
            'message': message
        }))