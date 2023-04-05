from django.db import models
from django.contrib.auth.models import User


# Create your models here.
class UserIcons(models.Model):
    user_id = models.ForeignKey(to=User, on_delete=models.DO_NOTHING)
    user_icon_path = models.ImageField(upload_to='icons/')