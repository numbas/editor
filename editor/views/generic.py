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

from django.conf import settings
from django.core.servers.basehttp import FileWrapper
from django.http import HttpResponse, HttpResponseServerError
from django.views.generic import DetailView

from examparser import ExamParser, ParseError

class CompileError(Exception):
    def __init__(self, status):
        self.status = status
    def __str__(self):
        return repr(self.status)
    
    
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

        try:
            process = subprocess.Popen(numbas_command, stdout = subprocess.PIPE, stdin=subprocess.PIPE)
            status = process.communicate(source)
            code = process.poll()
            if code != 0:
                raise OSError("Compilation failed. %s %s" %
                              tuple(status))

        except (NameError, OSError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            raise CompileError(status)
        else:
            return output_location
    

class PreviewView(DetailView,CompileObject):
    def preview(self,obj):
        source = obj.as_source()    #need to catch errors
        location = obj.filename
        switches = ['-c']
        try:
            fsLocation = self.compile(source, switches, location, obj)
        except CompileError as err:
            return HttpResponseServerError(json.dumps(err.status),
                                           content_type='application/json')
        else:
            status = {
                "result": "success",
                "url": settings.GLOBAL_SETTINGS['PREVIEW_URL'] +
                       location + '/index.html'
            }
            return HttpResponse(json.dumps(status),
                                content_type='application/json')
        
        
class ZipView(DetailView,CompileObject):
    def download(self,obj,scorm=False):
        source = obj.as_source()    #need to catch errors
        switches = ['-cz']
        if scorm:
            switches.append('-s')
        location = obj.filename + '.zip'
        try:
            fsLocation = self.compile(source, switches, location, obj)
        except CompileError as err:
            return HttpResponseServerError(json.dumps(err.status),
                                           content_type='application/json')
        else:
            wrapper = FileWrapper(file(fsLocation,'rb'))
            response = HttpResponse(wrapper, content_type='application/zip')
            response['Content-Disposition'] = 'attachment; filename=%s.zip' % obj.slug
            response['Content-Length'] = os.path.getsize(fsLocation)
            return response


class SourceView(DetailView):
    def source(self,obj):
        source = obj.as_source()
        response = HttpResponse(source, 'text/plain')
        response['Content-Disposition'] = 'attachment; filename=%s.exam' % obj.slug
        return response
