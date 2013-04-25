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
from django.forms.widgets import SelectMultiple
from django.core.exceptions import ValidationError

from editor.models import Exam, Question, ExamQuestion, QuestionAccess
from django.contrib.auth.models import User

class FixedSelectMultiple(SelectMultiple):
    def value_from_datadict(self,data,files,name):
        name += '[]'
        v = super(FixedSelectMultiple,self).value_from_datadict(data,files,name)
        return v

class QuestionAccessForm(forms.ModelForm):
    class Meta:
        model = QuestionAccess

class QuestionSetAccessForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ['public_access']

    def is_valid(self):
        v = super(QuestionSetAccessForm,self).is_valid()
        for f in self.user_access_forms:
            if not f.is_valid():
                print(f.errors)
                return False
        return v
    
    def clean(self):
        cleaned_data = super(QuestionSetAccessForm,self).clean()

        user_ids = self.data.getlist('user_ids[]')
        access_levels = self.data.getlist('access_levels[]')
        self.user_access_forms = []
        print(user_ids)

        for i,(user,access_level) in enumerate(zip(user_ids,access_levels)):
            f = QuestionAccessForm({'user':user,'access':access_level,'question':self.instance.pk})
            f.full_clean()
            self.user_access_forms.append(f)
            for key,messages in f.errors.items():
                self._errors[('user %i: ' % i)+key]=messages

        return cleaned_data

    def save(self):
        self.instance.access_rights.clear()
        for f in self.user_access_forms:
            f.save()
        return super(QuestionSetAccessForm,self).save()
        
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
