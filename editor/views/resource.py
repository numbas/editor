import json

from django.shortcuts import redirect
from django.conf import settings
from django import http

from editor.models import Resource, NewQuestion

def view_resource(request, **kwargs):
    q = NewQuestion.objects.get(pk=kwargs['pk'])
    filename = kwargs['resource']
    resource = q.resources.get(filename=filename)
    return redirect(settings.MEDIA_URL+resource.file.name)
