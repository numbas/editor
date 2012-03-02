import git
import json
import os
import subprocess
import traceback

from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseServerError
from django.shortcuts import render

from editor.models import Exam, ExamQuestion, Question
from examparser import ExamParser, ParseError

class SaveContentMixin():
    
    """Save exam or question content to a git repository and to a database."""
    
#    object = None
#    request = None
#    template_name = None
    
    def write_content(self, directory, form, inlines=None):
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
            error = 'Error: ' + str(err)
            return render(self.request, self.template_name,
                          {'form': form, 'inlines': inlines, 'error': error,
                           'object': self.object})
        self.object = form.save()
        if inlines is not None:
            for formset in inlines:
                formset.save()
        return HttpResponseRedirect(self.get_success_url())
    
    def write_content2(self, directory, form):
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
    
class Preview():
    
    """Exam or question preview."""
        
    def preview_compile(self, template, context, uuid):
        """Compile an exam or question preview."""
        try:
            fh = open(settings.GLOBAL_SETTINGS['TEMP_EXAM_FILE'], 'w')
            fh.write(template.render(context))
            fh.close()
        except IOError:
            status = {
                "result": "error",
                "message": "Could not save exam to temporary file.",
                "traceback": traceback.format_exc(),}
            return HttpResponseServerError(json.dumps(status),
                                           content_type='application/json')
        else:
            status = subprocess.Popen(
                [
                    settings.GLOBAL_SETTINGS['PYTHON_EXEC'],
                    os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'],
                                 os.path.normpath('bin/numbas.py')),
                    '-p'+settings.GLOBAL_SETTINGS['NUMBAS_PATH'],
                    '-c',
                    '-o'+os.path.join(settings.GLOBAL_SETTINGS['PREVIEW_PATH'],
                                      uuid),
                    settings.GLOBAL_SETTINGS['TEMP_EXAM_FILE']
                ], stdout = subprocess.PIPE
            )
            output = status.communicate()[0]
            if status.returncode != 0:
                status = {
                    "result": "error",
                    "message": "Something went wrong.",
                    "traceback": output,}
                return HttpResponseServerError(json.dumps(status),
                                               content_type='application/json')
        status = {"result": "success", "url": uuid}
        return HttpResponse(json.dumps(status), content_type='application/json')
