from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.views.generic import CreateView, UpdateView
from editor.models import Exam

class ExamCreateView(CreateView):
    model = Exam
    template_name = 'exam/new.html'
    
    def form_valid(self, form):
        try:
            examfile = open('/space/najy2/tm/exam.txt', 'w')
            examfile.write(form.cleaned_data["content"])
            examfile.close()
            exam = form.save()
        except IOError:
            save_error = "Could not save exam file."
            return render(self.request, 'exam/new.html', {'form': form, 'save_error': save_error})
        return HttpResponseRedirect(reverse('exam_edit', args=(exam.pk,)))


class ExamUpdateView(UpdateView):
    model = Exam
    template_name = 'exam/edit.html'
    
    def form_valid(self, form):
        try:
            examfile = open('/space/najy2/tmp/exam.txt', 'w')
            examfile.write(form.cleaned_data["content"])
            examfile.close()
            exam = form.save()
        except IOError:
            save_error = "Could not save exam file."
            return render(self.request, 'exam/edit.html', {'form': form, 'save_error': save_error, 'exam': self.get_object()})
        return HttpResponseRedirect(reverse('exam_edit', args=(exam.pk,)))
    
    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        try:
            examfile = open('/space/najy2/tmp/exam.txt', 'r')
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