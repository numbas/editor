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
from django.core.servers.basehttp import FileWrapper
from django.http import HttpResponse, HttpResponseServerError
from django.views.generic import DetailView
from django.template.loader import get_template
from django.template import RequestContext

from examparser import ExamParser, ParseError

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

    def compile(self,source,switches,location,obj):
        """
            Construct a temporary exam/question file and compile it.
            Returns the path to the output produced
        """
        theme = obj.theme if hasattr(obj,'theme') else 'default'


        output_location = os.path.join(settings.GLOBAL_SETTINGS['PREVIEW_PATH'], location)
        numbas_command = [
            settings.GLOBAL_SETTINGS['PYTHON_EXEC'],
            os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'],'bin','numbas.py'),
            '--pipein',
            '-p'+settings.GLOBAL_SETTINGS['NUMBAS_PATH'],
            '-o'+output_location,
            '-t'+theme,
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
        return HttpResponseServerError(template.render(RequestContext(self.request,{
            'message': error.message,
            'stdout': error.stdout,
            'stderr': error.stderr,
            'code': error.code,
        })))

class PreviewView(DetailView,CompileObject):
    def preview(self,obj):
        source = obj.as_source()    #need to catch errors
        location = obj.get_filename()
        switches = ['-c']
        try:
            fsLocation = self.compile(source, switches, location, obj)
        except CompileError as err:
            return self.get_error_response(err)
        else:
            url = settings.GLOBAL_SETTINGS['PREVIEW_URL'] + location + '/index.html'
            return redirect(url)
        
        
class ZipView(DetailView,CompileObject):
    def download(self,obj,scorm=False):
        source = obj.as_source()    #need to catch errors
        switches = ['-cz']
        if scorm:
            switches.append('-s')
        location = obj.get_filename() + '.zip'
        try:
            fsLocation = self.compile(source, switches, location, obj)
        except CompileError as err:
            return self.get_error_response(err)
        else:
            wrapper = FileWrapper(file(fsLocation,'rb'))
            response = HttpResponse(wrapper, content_type='application/zip')
            response['Content-Disposition'] = 'attachment; filename=%s.zip' % obj.slug
            response['Content-Length'] = os.path.getsize(fsLocation)
            response['Cache-Control'] = 'max-age=0,no-cache,no-store'
            return response


class SourceView(DetailView):
    def source(self,obj):
        source = obj.as_source()
        response = HttpResponse(source, 'text/plain')
        response['Content-Disposition'] = 'attachment; filename=%s.exam' % obj.slug
        response['Cache-Control'] = 'max-age=0,no-cache,no-store'
        return response
