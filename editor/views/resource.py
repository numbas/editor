import json

from django.shortcuts import redirect
from django.conf import settings
from django import http

from editor.models import Resource, NewQuestion

def upload_resource(request, **kwargs):
    if request.method != 'POST':
        return http.HttpResponseNotAllowed(['POST'])

    file = request.FILES['files[]']
    r = Resource.objects.create(owner=request.user, file=file)

    return http.HttpResponse(json.dumps(r.as_json()), content_type='application/json')

def view_resource(request, **kwargs):
    q = NewQuestion.objects.get(pk=kwargs['pk'])
    filename = kwargs['resource']
    resource = q.resources.get(filename=filename)
    return redirect(settings.MEDIA_URL+resource.file.name)
