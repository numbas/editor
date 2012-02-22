from django import forms
from django.forms.models import inlineformset_factory

from editor.models import Exam, Question, ExamQuestion

class QuestionForm(forms.ModelForm):
    
    """Form for a question."""
    
    class Meta:
        model = Question
        
        
class ExamForm(forms.ModelForm):
    
    """Form for an exam."""
    
    class Meta:
        model = Exam


class ExamPreviewForm(ExamForm):
    
    """Form for an exam preview.
    
    Used in exam previews, so that the form data are always taken to be
    valid
    """
    
    def clean(self):
        return self.cleaned_data
        
        
class ExamQuestionForm(forms.ModelForm):
    
    """Form linking exams and questions."""
    
    qn_order = forms.IntegerField(label='Order')
    
    class Meta:
        model = ExamQuestion


class ExamQuestionPreviewForm(ExamQuestionForm):    
    
    """Form for an exam question preview.
    
    Used in exam previews, so that the form data are always taken to be
    valid.
    """
    
    def clean(self):
        return self.cleaned_data
        
    
class ExamSearchForm(forms.Form):
    
    """Search form for an exam."""
    
    name = forms.CharField()
        
        
ExamQuestionFormSet = inlineformset_factory(Exam, ExamQuestion, form=ExamQuestionForm)