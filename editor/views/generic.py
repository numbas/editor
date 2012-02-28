import git
import os
import subprocess

from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseServerError
from django.shortcuts import render

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
    
    
def preview_compile(template, context):
    """Compile an exam or question preview."""
    try:
        fh = open(settings.GLOBAL_SETTINGS['TEMP_EXAM_FILE'], 'w')
        fh.write(template.render(context))
        fh.close()
    except IOError:
        message = 'Could not save exam to temporary file.'
        return HttpResponseServerError(message)
    else:
        status = subprocess.Popen(
            [
                settings.GLOBAL_SETTINGS['PYTHON_EXEC'],
                os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'],
                             os.path.normpath('bin/numbas.py')),
                '-p'+settings.GLOBAL_SETTINGS['NUMBAS_PATH'],
                '-c',
                '-o'+os.path.join(settings.GLOBAL_SETTINGS['PREVIEW_PATH'],
                                  'exam'),
                settings.GLOBAL_SETTINGS['TEMP_EXAM_FILE']
            ], stdout = subprocess.PIPE
        )
        output = status.communicate()[0]
        if status.returncode != 0:
            message = 'Something went wrong.'
            return HttpResponseServerError(message + "\n" + output)
        message = 'Preview loaded in new window.'
    return HttpResponse(message + "\n" + output)