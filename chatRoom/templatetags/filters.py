from django import template

register = template.Library()


@register.filter(name='dIconPath')
def dIconPath(d, key_name):
    if d[key_name] is not None:
        return d[key_name].user_icon_path.url
    else:
        return ""


@register.filter(name='dkey')
def dkey(d, key_name):
    if d[key_name] is not None:
        return d[key_name]
    else:
        return ""