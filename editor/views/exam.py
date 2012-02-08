from django.conf import settings
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseServerError
from django.shortcuts import render
from django.template import loader, Context
from django.views.generic import DeleteView
from editor.forms import ExamForm, ExamQuestionFormSet
from editor.models import Exam, ExamQuestion, Question
from editor.views.generic import SaveContentMixin
from extra_views import InlineFormSet, CreateWithInlinesView, UpdateWithInlinesView
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
            t = loader.get_template('temporary.exam')
            c = Context({
                'exam': e
            })
        except Exam.DoesNotExist:
            try:
                q = Question.objects.get(slug=kwargs['slug'])
                q.content = request.POST['content']
                t = loader.get_template('temporary.question')
                c = Context({
                    'question': q
                })
            except Question.DoesNotExist:
                message = 'No such exam or question exists'
                return HttpResponseServerError(message)
        try:
            fh = open(settings.GLOBAL_SETTINGS['TEMP_EXAM_FILE'], 'w')
            fh.write(t.render(c))
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
    
    
def testview(request):
    if request.method == 'POST':
        form = ExamForm(request.POST)
        formset = ExamQuestionFormSet(request.POST)
        if form.is_valid() and formset.is_valid():
            print "valid"
    else:
        form = ExamForm()
        formset = ExamQuestionFormSet()
    return render(request, 'exam/new.html', {'form': form, 'formset': formset})


class ExamQuestionInline(InlineFormSet):
    model = ExamQuestion
    

class ExamCreateView(CreateWithInlinesView, SaveContentMixin):
    """
    Create an exam.
    """
    model = Exam
    template_name = 'exam/new.html'
    inlines = [ExamQuestionInline]
    
    def forms_valid(self, form, inlines):
        self.object = form.save(commit=False)
        self.object.filename = str(uuid.uuid4())
#        return self.write_content(form, inlines, settings.GLOBAL_SETTINGS['EXAM_SUBDIR'])
        return self.write_content(settings.GLOBAL_SETTINGS['EXAM_SUBDIR'], form, inlines=inlines)
    
    def get_context_data(self, **kwargs):
        context = super(ExamCreateView, self).get_context_data(**kwargs)
        print context['inlines'][0].errors
        return context
    
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
    
    
class ExamUpdateView(UpdateWithInlinesView, SaveContentMixin):
    """
    Edit an exam.
    """
    model = Exam
    template_name = 'exam/edit.html'
    inlines = [ExamQuestionInline]
    
    def forms_valid(self, form, inlines):
        self.object = form.save(commit=False)
        return self.write_content(settings.GLOBAL_SETTINGS['EXAM_SUBDIR'], form, inlines=inlines)
    
    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        form_class = self.get_form_class()
        form = self.get_form(form_class)
        inlines = self.construct_inlines()
        try:
            examfile = open(os.path.join(settings.GLOBAL_SETTINGS['REPO_PATH'], settings.GLOBAL_SETTINGS['EXAM_SUBDIR'], self.object.filename), 'r')
            self.object.content = examfile.read()
            examfile.close()
        except IOError:
            error = "Could not read from exam file."
            return render(self.request, self.template_name, {'form': form, 'inlines': inlines, 'error': error, 'object': self.object})
        return self.render_to_response(self.get_context_data(form=form, inlines=inlines))
        
    def get_success_url(self):
        return reverse('exam_edit', args=(self.object.slug,))