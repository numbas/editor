from django.conf import settings
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseServerError
from django.shortcuts import render
from django.views.generic import CreateView, DeleteView, UpdateView
from editor.models import Exam
from editor.views.generic import SaveContentMixin
import os
import subprocess
import uuid

def preview(request, **kwargs):
    """
    Retrieve the contents of an exam and compile it.  If this is successful, the exam will be shown in a new window by virtue of some JS.
    """
    if request.is_ajax():
        try:
            e = Exam.objects.get(slug=kwargs['slug'])
            print e.questions.count()
            fh = open(settings.GLOBAL_SETTINGS['TEMP_EXAM_FILE'], 'w')
            fh.write(request.POST['content'])
            fh.close()
        except IOError:
            message = 'Could not save exam to temporary file.'
            return HttpResponseServerError(message)
        else:
            status = subprocess.Popen(
                [
                    os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'], os.path.normpath('bin/numbas.py')),
                    '-p'+settings.GLOBAL_SETTINGS['NUMBAS_PATH'],
                    '-c',
                    '-o'+os.path.join(settings.GLOBAL_SETTINGS['PREVIEW_PATH'], 'exam'),
                    settings.GLOBAL_SETTINGS['TEMP_EXAM_FILE']
                ], stdout = subprocess.PIPE
            )
            output = status.communicate()[0]
            message = 'Exam preview loaded in new window.'
        return HttpResponse(message + "\n" + output)
    

class ExamCreateView(CreateView, SaveContentMixin):
    """
    Create an exam.
    """
    model = Exam
    template_name = 'exam/new.html'
    
    def form_valid(self, form):
        self.object = form.save(commit=False)
        self.object.filename = str(uuid.uuid4())
        return self.write_content(form, settings.GLOBAL_SETTINGS['EXAM_SUBDIR'])
    
    def get_success_url(self):
        return reverse('exam_edit', args=(self.object.slug,))


class ExamDeleteView(DeleteView):
    """
    Delete an exam
    """
    model = Exam
    template_name = 'exam/delete.html'
    
    def get_success_url(self):
        return reverse('exam_index')
    

class ExamUpdateView(UpdateView, SaveContentMixin):
    """
    Edit an exam.
    """
    model = Exam
    template_name = 'exam/edit.html'
    
    def form_valid(self, form):
        self.object = form.save(commit=False)
        return self.write_content(form, settings.GLOBAL_SETTINGS['EXAM_SUBDIR'])
    
    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        form_class = self.get_form_class()
        form = self.get_form(form_class)
        try:
            examfile = open(os.path.join(settings.GLOBAL_SETTINGS['REPO_PATH'], settings.GLOBAL_SETTINGS['EXAM_SUBDIR'], self.object.filename), 'r')
            self.object.content = examfile.read()
            examfile.close()
        except IOError:
            error = "Could not read from exam file."
            return render(self.request, self.template_name, {'form': form, 'error': error, 'object': self.object})
        return self.render_to_response(self.get_context_data(form=form))

        
    def get_success_url(self):
        return reverse('exam_edit', args=(self.object.slug,))