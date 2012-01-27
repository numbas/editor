from django.core.urlresolvers import reverse
from django.views.generic import CreateView
from editor.models import Question

class QuestionCreateView(CreateView):
    model = Question
    template_name = 'question/new.html'
    
    def get_success_url(self):
        return reverse('exam_index')