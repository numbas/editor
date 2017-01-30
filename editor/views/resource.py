import json

from django.shortcuts import redirect
from django.conf import settings
from django.http import HttpResponse, HttpResponseServerError

from editor.models import Resource

def upload_resource(request, **kwargs):
    if request.method != 'POST':
        return HttpResponseServerError(403)

    file = request.FILES['files[]']
    r = Resource.objects.create(owner=request.user, file=file)

    return HttpResponse(json.dumps(r.as_json()), content_type='application/json')

def view_resource(request, **kwargs):
    resource = kwargs['resource']
    return redirect(settings.MEDIA_URL+resource)
