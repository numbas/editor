from django.shortcuts import render,redirect
from django.conf import settings
from django.http import HttpResponse, HttpResponseServerError
from django.core.files import File

from editor.models import Image

import json

def upload_resource(request,**kwargs):
	if request.method  != 'POST':
		return HttpResponseServerError(403)

	file = request.FILES['files[]']
	print(file.name)
	i=Image(title=file.name,image=file)
	i.save()

	return HttpResponse(i.summary(),content_type='application/json'
	)

def media_view(request,**kwargs):
	resource = kwargs['resource']
	return redirect(settings.MEDIA_URL+resource)
