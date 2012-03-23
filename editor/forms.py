#Copyright 2012 Newcastle University
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
from django import forms
from django.forms.models import inlineformset_factory

from editor.models import Exam, Question, ExamQuestion
from django.contrib.auth.models import User

class QuestionForm(forms.ModelForm):
    
    """Form for a question."""

    class Meta:
        model = Question
        exclude = ('name','author','tags')
        
        
class NewQuestionForm(forms.ModelForm):
    
    """Form for a new question only, not including some fields."""
    
    class Meta:
        model = Question
        fields = ('name','author')
        
        
class ExamForm(forms.ModelForm):
    
    """Form for an exam."""
    
    class Meta:
        model = Exam
        exclude = ('name','author')
        
        
class NewExamForm(forms.ModelForm):
    
    """Form for a new exam only, not including some fields."""
    
    class Meta:
        model = Exam
        fields = ('name','author')

        
class ExamQuestionForm(forms.ModelForm):
    
    """Form linking exams and questions."""
    
    qn_order = forms.IntegerField(label='Order')
    
    class Meta:
        model = ExamQuestion


class ExamSearchForm(forms.Form):
    
    """Search form for an exam."""
    
    name = forms.CharField()
        
        
ExamQuestionFormSet = inlineformset_factory(Exam, ExamQuestion, form=ExamQuestionForm)
