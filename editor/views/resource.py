import json

from django.shortcuts import redirect
from django.conf import settings
from django import http

from editor.models import Resource, NewQuestion

def view_resource(request, **kwargs):
    try:
        q = NewQuestion.objects.get(pk=kwargs['pk'])
    except NewQuestion.DoesNotExist:
        raise http.Http404('That question does not exist.')

    filename = kwargs['resource']

    try:
        resource = q.resources.get(filename=filename)
    except Resource.DoesNotExist:
        raise http.Http404('That resource does not exist.')

    return redirect(settings.MEDIA_URL+resource.file.name)
