from django.views.generic import DeleteView
from django.shortcuts import render,redirect
from django.conf import settings
from django.http import HttpResponse, HttpResponseServerError
from django.core.files import File
from django.core.exceptions import ObjectDoesNotExist

from editor.models import Image

import json

def upload_resource(request,**kwargs):
    if request.method  != 'POST':
        return HttpResponseServerError(403)

    file = request.FILES['files[]']
    i=Image(title=file.name,image=file)
    i.save()

    return HttpResponse(i.summary(),content_type='text/plain'
    )

class ImageDeleteView(DeleteView):
    model = Image

def delete_resource(request,**kwargs):
    pk = int(kwargs['pk'])
    try:
        i = Image.objects.get(pk=pk)
        return HttpResponse(pk)
    except Image.DoesNotExist:
        a=HttpResponseServerError(404)
        return a
    except Exception as e:
        print(e)
        raise


def media_view(request,**kwargs):
    resource = kwargs['resource']
    return redirect(settings.MEDIA_URL+resource)
