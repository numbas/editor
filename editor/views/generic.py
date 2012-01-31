from django.conf import settings
from django.shortcuts import render
from django.http import HttpResponseRedirect
import git
import os

class SaveContent():
#    object = None
#    request = None
#    template_name = None
    
    def write_content(self, form, directory):
        try:
            repo = git.Repo(settings.GLOBAL_SETTINGS['REPO_PATH'])
            path_to_file = os.path.join(settings.GLOBAL_SETTINGS['REPO_PATH'], directory, self.object.filename)
            fh = open(path_to_file, 'w')
            fh.write(self.object.content)
            fh.close()
            repo.index.add([os.path.join(directory, self.object.filename)])
            repo.index.commit('Made some changes to %s' % self.object.name)
        except IOError:
            save_error = "Could not save file."
            print "here"
            return render(self.request, self.template_name, {'form': form, 'save_error': save_error, 'object': self.object})
        print "there"
        self.object = form.save()
        return HttpResponseRedirect(self.get_success_url())