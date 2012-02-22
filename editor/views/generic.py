import git
import os

from django.conf import settings
from django.http import HttpResponseRedirect
from django.shortcuts import render

from examparser import ExamParser

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
        except (IOError, OSError, IndexError) as err:
            error = 'Error: ' + str(err)
            return render(self.request, self.template_name,
                          {'form': form, 'inlines': inlines, 'error': error,
                           'object': self.object})
        self.object = form.save()
        if inlines is not None:
            for formset in inlines:
                formset.save()
        return HttpResponseRedirect(self.get_success_url())