# Generated by Django 4.1.7 on 2023-03-30 01:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myAuth', '0002_alter_usericons_user_icon_path'),
    ]

    operations = [
        migrations.AlterField(
            model_name='usericons',
            name='user_icon_path',
            field=models.ImageField(upload_to='icons/'),
        ),
    ]
