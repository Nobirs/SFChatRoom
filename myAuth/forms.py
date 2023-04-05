from django.contrib.auth.models import User
from django import forms
from .models import *


class UserIconForm(forms.ModelForm):
    class Meta:
        model = UserIcons
        fields = ['user_id', 'user_icon_path']


class UsernameForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username']