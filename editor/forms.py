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

import zipfile
import os
import tempfile

from editor.models import Exam, Question, ExamQuestion, QuestionAccess, ExamAccess, QuestionHighlight, ExamHighlight, Theme, Extension
from django.contrib.auth.models import User

class FixedSelectMultiple(SelectMultiple):
    def value_from_datadict(self,data,files,name):
        name += '[]'
        v = super(FixedSelectMultiple,self).value_from_datadict(data,files,name)
        return v

class TagField(forms.CharField):
    def clean(self,value):
        tags_string = super(TagField,self).clean(value)
        if len(tags_string.strip()):
            tags = tags_string.split(',')
            return [t.strip() for t in tags]
        else:
            return []

USAGE_OPTIONS = (
    ('any','Any'),
    ('reuse','Free to reuse'),
    ('modify','Free to reuse with modification'),
    ('sell','Free to reuse commercially'),
    ('modify-sell','Free to reuse commercially with modification'),
)

class QuestionSearchForm(forms.Form):
    query = forms.CharField(initial='', required=False)
    author = forms.CharField(initial='', required=False)
    usage = forms.ChoiceField(choices=USAGE_OPTIONS, required=False)
    filter_copies = forms.BooleanField(initial=False)
    tags = TagField(initial='', required=False, widget=forms.TextInput(attrs={'placeholder': 'Tags separated by commas'}))

class QuestionAccessForm(forms.ModelForm):
    class Meta:
        model = QuestionAccess
        exclude = []

class QuestionSetAccessForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ['public_access']

    def is_valid(self):
        v = super(QuestionSetAccessForm,self).is_valid()
        for f in self.user_access_forms:
            if not f.is_valid():
                return False
        return v
    
    def clean(self):
        cleaned_data = super(QuestionSetAccessForm,self).clean()

        user_ids = self.data.getlist('user_ids[]')
        access_levels = self.data.getlist('access_levels[]')
        self.user_access_forms = []

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

class ExamAccessForm(forms.ModelForm):
    class Meta:
        model = ExamAccess
        exclude = []

class ExamSetAccessForm(forms.ModelForm):
    class Meta:
        model = Exam
        fields = ['public_access']

    def is_valid(self):
        v = super(ExamSetAccessForm,self).is_valid()
        for f in self.user_access_forms:
            if not f.is_valid():
                return False
        return v
    
    def clean(self):
        cleaned_data = super(ExamSetAccessForm,self).clean()

        user_ids = self.data.getlist('user_ids[]')
        access_levels = self.data.getlist('access_levels[]')
        self.user_access_forms = []

        for i,(user,access_level) in enumerate(zip(user_ids,access_levels)):
            f = ExamAccessForm({'user':user,'access':access_level,'exam':self.instance.pk})
            f.full_clean()
            self.user_access_forms.append(f)
            for key,messages in f.errors.items():
                self._errors[('user %i: ' % i)+key]=messages

        return cleaned_data

    def save(self):
        self.instance.access_rights.clear()
        for f in self.user_access_forms:
            f.save()
        return super(ExamSetAccessForm,self).save()
        
class QuestionForm(forms.ModelForm):
    
    """Form for a question."""

    class Meta:
        model = Question
        exclude = ('name','author','tags','public_access','copy_of','metadata','licence')

class QuestionHighlightForm(forms.ModelForm):
    note = forms.CharField(widget=forms.Textarea(attrs={'data-bind':'text:note'}), label='Write a note explaining why you\'re highlighting this question.')

    class Meta:
        model = QuestionHighlight
        fields = ['note']
        
class NewQuestionForm(forms.ModelForm):
    
    """Form for a new question only, not including some fields."""
    
    class Meta:
        model = Question
        fields = ('name','author')
        
        
class ExamForm(forms.ModelForm):
    
    """Form for an exam."""
    
    class Meta:
        model = Exam
        exclude = ('name','author','public_access','metadata','licence')
        
        
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
        exclude = []

ExamQuestionFormSet = inlineformset_factory(Exam, ExamQuestion, form=ExamQuestionForm)

class ExamHighlightForm(forms.ModelForm):
    note = forms.CharField(widget=forms.Textarea(attrs={'data-bind':'text:note'}), label='Write a note explaining why you\'re highlighting this exam.')

    class Meta:
        model = ExamHighlight
        fields = ['note']
        

class ExamSearchForm(forms.Form):
    
    """Search form for an exam."""
    
    query = forms.CharField(initial='', required=False)
    author = forms.CharField(initial='', required=False)
    usage = forms.ChoiceField(choices=USAGE_OPTIONS, required=False)
        
class ValidateZipField:
    def clean_zipfile(self):
        zip = self.cleaned_data['zipfile']
        if not zipfile.is_zipfile(zip):
            raise forms.ValidationError('Uploaded file is not a zip file')
        return zip
        
class NewThemeForm(forms.ModelForm,ValidateZipField):
    
    """Form for a new theme."""
    
    class Meta:
        model = Theme
        fields = ['name','zipfile']

    def __init__(self,*args,**kwargs):
        self._user= kwargs.pop('author')
        super(NewThemeForm,self).__init__(*args,**kwargs)

    def save(self, commit=True):
        theme = super(NewThemeForm,self).save(commit=False)
        theme.public = False
        theme.author = self._user
        if commit:
            theme.save()
            self.save_m2m()
        return theme

class UpdateThemeForm(forms.ModelForm,ValidateZipField):
    
    """Form to edit a theme."""
    
    class Meta:
        model = Theme
        fields = ['name','zipfile']

class UpdateExtensionForm(forms.ModelForm):
    
    """Form to edit an extension."""
    
    class Meta:
        model = Extension
        fields = ['name','location','url','zipfile']
        widgets = {
            'zipfile': forms.FileInput()
        }

    def clean_zipfile(self):
        file = self.cleaned_data['zipfile']
        if not zipfile.is_zipfile(file):
            name, extension = os.path.splitext(file.name)
            if extension.lower() == '.js':
                return file
            else:
                raise forms.ValidationError('Uploaded file is not a .zip file or .js file')
        else:
            return file

class NewExtensionForm(UpdateExtensionForm):
    
    """Form for a new extension."""
    
    def __init__(self,*args,**kwargs):
        self._user= kwargs.pop('author')
        super(NewExtensionForm,self).__init__(*args,**kwargs)

    def save(self, commit=True):
        extension = super(NewExtensionForm,self).save(commit=False)
        extension.public = False
        extension.author = self._user
        if commit:
            print("SAVE",extension)
            extension.save()
            self.save_m2m()
        return extension

