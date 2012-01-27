from django.shortcuts import render
from django.http import HttpResponse, HttpResponseServerError, HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.views.generic import CreateView, UpdateView
from django.forms.models import inlineformset_factory
import subprocess
from editor.models import Exam, Question

def create_exam_with_question(request):
    ExamFormSet = inlineformset_factory(Exam, Question)
#    author = Author.objects.get(name=u'Mike Royko')
    formset = ExamFormSet()
    return render(request, 'exam/new2.html', {'formset': formset})

def ajaxtest(request):
    if request.is_ajax():
        try:
            tmp_exam_file = '/tmp/exam.tmp'
            fh = open(tmp_exam_file, 'w')
            fh.write(request.POST['content'])
            fh.close()
        except IOError:
            message = 'Could not save exam to temporary file.'
            return HttpResponseServerError(message)
        else:
            status = subprocess.Popen(['/home/najy2/numbas/bin/numbas.py', '-p/home/najy2/numbas', '-c', '-o/srv/www/countach.ncl.ac.uk80/numbas-previews/exam', tmp_exam_file], stdout = subprocess.PIPE)
            output = status.communicate()[0]
            message = 'Exam preview loaded in new window.'
        return HttpResponse(message + "\n" + output)
    
def save_content_to_file(request, form, **kwargs):
    try:
        examfile = open(form.cleaned_data["filename"], 'w')
        examfile.write(form.cleaned_data["content"])
        examfile.close()
        exam = form.save()
    except IOError:
        save_error = "Could not save exam file."
        if 'exam' in kwargs:
            return render(request, 'exam/edit.html', {'form': form, 'save_error': save_error, 'exam': kwargs['exam']})
        else:
            return render(request, 'exam/new.html', {'form': form, 'save_error': save_error})
    return HttpResponseRedirect(reverse('exam_edit', args=(exam.slug,)))

class ExamCreateView(CreateView):
    model = Exam
    template_name = 'exam/new.html'
    
    def form_valid(self, form):
        return save_content_to_file(self.request, form)


class ExamUpdateView(UpdateView):
    model = Exam
    template_name = 'exam/edit.html'
    
    def form_valid(self, form):
        return save_content_to_file(self.request, form, exam=self.get_object())
    
    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        try:
            examfile = open(self.object.filename, 'r')
            self.object.content = examfile.read()
#            self.object.content = examfile.read()
            examfile.close()
        except IOError:
            self.object.content = "Could not read from exam file."
            
        form_class = self.get_form_class()
        form = self.get_form(form_class)
        return self.render_to_response(self.get_context_data(form=form))
        
    def get_success_url(self):
        return reverse('exam_index')