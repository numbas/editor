from django.conf import settings
from django.core.files.base import ContentFile
from django.contrib import messages
from django.http import HttpRequest
from editor.models import Project
from editor.slugify import slugify
from huey.contrib.djhuey import db_task, task
import os
import zipfile


@db_task()
def do_export(de, filename, exporter_cls, exporter_kwargs, request_META):
    try:
        de.status = 'inprogress'
        de.save(update_fields=('status',))
    
        name, ext = os.path.splitext(filename)
        filename = slugify(name)+ext

        de.outfile.save(filename, ContentFile(''))

        request = HttpRequest()
        request.META = request_META

        zf = zipfile.ZipFile(de.outfile.path,'w')

        exporter = exporter_cls(request, zf, **exporter_kwargs)

        exporter.export()

        zf.close()

        de.status = 'complete'
        de.save()
    except Exception as e:
        import traceback
        traceback.print_exception(e)
        de.status = 'error'
        de.error_message = str(e)
        de.save(update_fields=('status','error_message',))
