#Copyright 2012 Newcastle University
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
import json
import os
import subprocess
import traceback

from django.shortcuts import render,redirect
from django.conf import settings
from django.core.urlresolvers import reverse
from django.core.servers.basehttp import FileWrapper
from django import http
from django.views import generic
from django.template.loader import get_template
from django.template import RequestContext

from editor.models import Extension,StampOfApproval,Comment

class CompileError(Exception):
    def __init__(self, message, stdout='',stderr='',code=0):
        self.message = message
        self.stdout = stdout
        self.stderr = stderr
        self.code = code
    def __str__(self):
        return 'Compilation failed: %s\n Stdout: %s\nStderr: %s\nExit code: %i' % (self.message, self.stderr, self.stdout, self.code)
    
    
class CompileObject():
    
    """Compile an exam or question."""

    def compile(self,numbasobject,switches,location,obj):
        """
            Construct a temporary exam/question file and compile it.
            Returns the path to the output produced
        """

        numbasobject.data['extensions'] = [e.extracted_path for e in Extension.objects.filter(location__in=numbasobject.data.get('extensions',[]))]
        source = str(numbasobject)

        theme_path = obj.theme_path if hasattr(obj,'theme_path') else 'default'
        locale = obj.locale if hasattr(obj,'locale') else 'en-GB'


        output_location = os.path.join(settings.GLOBAL_SETTINGS['PREVIEW_PATH'], location)
        numbas_command = [
            settings.GLOBAL_SETTINGS['PYTHON_EXEC'],
            os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'],'bin','numbas.py'),
            '--pipein',
            '-p'+settings.GLOBAL_SETTINGS['NUMBAS_PATH'],
            '-o'+output_location,
            '-t'+theme_path,
            '-l'+locale,
        ] + switches

        process = subprocess.Popen(numbas_command, stdout = subprocess.PIPE, stdin=subprocess.PIPE, stderr = subprocess.PIPE)
        stdout,stderr = process.communicate(source.encode('utf-8'))
        code = process.poll()
        if code != 0:
            raise CompileError('Compilation failed.',stdout=stdout,stderr=stderr,code=code)
        else:
            return output_location
    
    def get_error_response(self,error):
        template = get_template("compile/error.html")
        return http.HttpResponseServerError(template.render(RequestContext(self.request,{
            'message': error.message,
            'stdout': error.stdout,
            'stderr': error.stderr,
            'code': error.code,
        })))

class PreviewView(generic.DetailView,CompileObject):
    def preview(self,obj):
        numbasobject = obj.as_numbasobject()    #need to catch errors
        location = obj.get_filename()
        switches = ['-c']
        try:
            fsLocation = self.compile(numbasobject, switches, location, obj)
        except CompileError as err:
            return self.get_error_response(err)
        else:
            url = settings.GLOBAL_SETTINGS['PREVIEW_URL'] + location + '/index.html'
            return redirect(url)
        
        
class ZipView(generic.DetailView,CompileObject):
    def download(self,obj,scorm=False):
        numbasobject= obj.as_numbasobject()    #need to catch errors

        switches = ['-cz']

        if settings.GLOBAL_SETTINGS.get('MINIFIER_PATH'):
            switches+=['--minify',settings.GLOBAL_SETTINGS['MINIFIER_PATH']]
        if scorm:
            switches.append('-s')

        location = obj.get_filename() + '.zip'

        try:
            fsLocation = self.compile(numbasobject, switches, location, obj)
        except CompileError as err:
            return self.get_error_response(err)
        else:
            wrapper = FileWrapper(file(fsLocation,'rb'))
            response = http.HttpResponse(wrapper, content_type='application/zip')
            response['Content-Disposition'] = 'attachment; filename=%s.zip' % obj.slug
            response['Content-Length'] = os.path.getsize(fsLocation)
            response['Cache-Control'] = 'max-age=0,no-cache,no-store'
            return response


class SourceView(generic.DetailView):
    def source(self,obj):
        source = obj.as_source()
        response = http.HttpResponse(source, 'text/plain')
        response['Content-Disposition'] = 'attachment; filename=%s.exam' % obj.slug
        response['Cache-Control'] = 'max-age=0,no-cache,no-store'
        return response

# from http://stackoverflow.com/questions/18172102/object-ownership-validation-in-django-updateview
class AuthorRequiredMixin(object):
    def dispatch(self, request, *args, **kwargs):
        result = super(AuthorRequiredMixin, self).dispatch(request, *args, **kwargs)
        if self.object.author != self.request.user:
            template = get_template("403.html")
            return http.HttpResponseForbidden(template.render(RequestContext(self.request)))
        return result

class StampView(generic.UpdateView):
    def post(self, request, *args, **kwargs):
        object = self.get_object()

        status = request.POST.get('status')

        stamp = StampOfApproval(user=request.user,object=object,status=status)
        stamp.save()

        return http.HttpResponse(json.dumps(stamp_json(stamp)),content_type='application/json')

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')

class CommentView(generic.UpdateView):
    def post(self, request, *args, **kwargs):
        object = self.get_object()

        text = request.POST.get('text')

        comment = Comment(user=request.user,object=object,text=text)
        comment.save()

        return http.HttpResponse(json.dumps(comment_json(comment)),content_type='application/json')

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')

def user_json(user):
    if user is None:
        return {
                'name': 'Anonymous',
                'pk': None
        }
    else:
        return {
                'name': user.get_full_name(),
                'pk': user.pk,
                'profile_url': reverse('view_profile',args=(user.pk,))
        }

# JSON representation of a editor.models.StampOfApproval object
def stamp_json(stamp,**kwargs):
    return {
        'pk': stamp.pk,
        'date': stamp.date.strftime('%Y-%m-%d %H:%M:%S'),
        'status': stamp.status,
        'status_display': stamp.get_status_display(),
        'user': user_json(stamp.user),
        'delete_url': reverse('delete_stamp',args=(stamp.pk,))
    }

# JSON representation of a editor.models.StampOfApproval object
def comment_json(comment,**kwargs):
    return {
        'pk': comment.pk,
        'date': comment.date.strftime('%Y-%m-%d %H:%M:%S'),
        'text': comment.text,
        'user': user_json(comment.user),
        'delete_url': reverse('delete_comment',args=(comment.pk,))
    }

class DeleteCommentView(generic.DeleteView):
    model = Comment
    def delete(self,request,*args,**kwargs):
        self.object = self.get_object()
        if self.object.can_be_deleted_by(self.request.user):
            pk = self.object.pk
            self.object.delete()
            return http.HttpResponse('stamp {} deleted'.format(pk))
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')

class DeleteStampView(generic.DeleteView):
    model = StampOfApproval
    def delete(self,request,*args,**kwargs):
        self.object = self.get_object()
        if self.object.can_be_deleted_by(self.request.user):
            pk = self.object.pk
            self.object.delete()
            return http.HttpResponse('stamp {} deleted'.format(pk))
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')
