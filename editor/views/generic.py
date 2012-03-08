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
import git
import json
import os
import subprocess
import traceback

from django.conf import settings
from django.core.servers.basehttp import FileWrapper
from django.http import HttpResponse, HttpResponseServerError
from django.views.generic import DetailView

from editor.models import Exam, ExamQuestion, Question
from examparser import ExamParser, ParseError

class SaveContentMixin():
    
    """Save exam or question content to a git repository and to a database."""
    
    def write_content(self, directory, form):
        parser = ExamParser()
        try:
            content = parser.parse(self.object.content)
            self.object.name = content['name']
            repo = git.Repo(settings.GLOBAL_SETTINGS['REPO_PATH'])
            os.environ['GIT_AUTHOR_NAME'] = 'Numbas'
            os.environ['GIT_AUTHOR_EMAIL'] = 'numbas@ncl.ac.uk'
            path_to_file = os.path.join(settings.GLOBAL_SETTINGS['REPO_PATH'],
                                        directory, self.object.filename)
            fh = open(path_to_file, 'w')
            fh.write(self.object.content)
            fh.close()
            repo.index.add([os.path.join(directory, self.object.filename)])
            repo.index.commit('Made some changes to %s' % self.object.name)
        except (IOError, OSError, IndexError, ParseError) as err:
            status = {
                "result": "error",
                "message": str(err),
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        self.object = form.save()
        if isinstance(self.object, Exam):
            try:
                self.object.questions.clear()
                for i,q in enumerate(self.questions):
                    question = Question.objects.get(pk=q['id'])
                    exam_question = ExamQuestion(exam=self.object,
                                                 question=question, qn_order=i)
                    exam_question.save()
            except:
                status = {
                    "result": "error",
                    "message": "Something went wrong saving questions for exam",
                    "traceback": traceback.format_exc(),}
                return HttpResponseServerError(json.dumps(status),
                                               content_type='application/json')
        status = {"result": "success"}
        return HttpResponse(json.dumps(status), content_type='application/json')
    
    
#class JSONResponseMixin(object):
#    def render_to_response(self, context):
#        """Returns a JSON response containing 'context' as payload."""
#        return self.get_json_response(self.convert_context_to_json(context))
#
#    def get_json_response(self, content, **httpresponse_kwargs):
#        """Construct an `HttpResponse` object."""
#        return HttpResponse(content,
#                                 content_type='application/json',
#                                 **httpresponse_kwargs)
#
#    def convert_context_to_json(self, context):
#        """Convert the context dictionary into a JSON object."""
#        # Note: This is *EXTREMELY* naive; in reality, you'll need
#        # to do much more complex handling to ensure that arbitrary
#        # objects -- such as Django model instances or querysets
#        # -- can be serialized as JSON.
#        return json.dumps(context)
#    
#    
#class JSONListView(JSONResponseMixin, BaseListView):
#    pass
    

class CompileError(Exception):
    def __init__(self, status):
        self.status = status
    def __str__(self):
        return repr(self.status)
    
class CompileObject():
    
    """Compile an exam or question."""

    def compile(self,source,switches,location):
        """
            Construct a temporary exam/question file and compile it.
            Returns the path to the output produced
        """

        try:
            fh = open(settings.GLOBAL_SETTINGS['TEMP_EXAM_FILE'], 'w')
            fh.write(source)
            fh.close()

        except IOError:
            status = {
                "result": "error",
                "message": "Could not save exam to temporary file.",
                "traceback": traceback.format_exc(),}
            raise CompileError(status)

        else:
            location = os.path.join(settings.GLOBAL_SETTINGS['PREVIEW_PATH'], location)
            numbas_command = [
                settings.GLOBAL_SETTINGS['PYTHON_EXEC'],
                os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'],
                             os.path.normpath('bin/numbas.py')),
                settings.GLOBAL_SETTINGS['TEMP_EXAM_FILE'],
                '-p'+settings.GLOBAL_SETTINGS['NUMBAS_PATH'],
                '-o'+location
            ] + switches

            try:
                status = subprocess.Popen(numbas_command, stdout = subprocess.PIPE)
                stat = status.communicate()
                if status.returncode != 0:
                    raise OSError("numbas.py execution failed. %s %s" %
                                  tuple(stat))
            except (NameError, OSError) as err:
                status = {
                    "result": "error",
                    "message": str(err),
                    "traceback": traceback.format_exc(),}
                raise CompileError(status)
            else:
                return location
    

class PreviewView(DetailView,CompileObject):
    def preview(self,obj):
        source = obj.as_source()    #need to catch errors
        location = obj.filename
        switches = ['-c']
        try:
            fsLocation = self.compile(source, switches, location)
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
        
class DownloadView(DetailView,CompileObject):
    def download(self,obj):
        source = obj.as_source()    #need to catch errors
        switches = ['-c','-sz']
        location = obj.filename + '.zip'
        try:
            fsLocation = self.compile(source, switches, location)
        except CompileError as err:
            return HttpResponseServerError(json.dumps(err.status),
                                           content_type='application/json')
        else:
            wrapper = FileWrapper(file(fsLocation,'rb'))
            response = HttpResponse(wrapper, content_type='application/zip')
            response['Content-Disposition'] = 'attachment; filename=%s.zip' % obj.slug
            response['Content-Length'] = os.path.getsize(fsLocation)
            return response
