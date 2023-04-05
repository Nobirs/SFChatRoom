from django.contrib.auth.models import User
from django.db import models


class Message(models.Model):
    message = models.TextField()
    time_added = models.TimeField(auto_now=True)
    from_user = models.ForeignKey(to=User, on_delete=models.DO_NOTHING)
    group = models.ForeignKey(to='Room', on_delete=models.DO_NOTHING)


class Room(models.Model):
    name = models.CharField(max_length=255)
    users = models.ManyToManyField(to=User)


