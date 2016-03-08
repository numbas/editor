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
from django.forms.models import inlineformset_factory,modelformset_factory
from django.forms.widgets import SelectMultiple
from django.core.exceptions import ValidationError
from django.utils.html import conditional_escape, format_html, html_safe
from django.utils.safestring import mark_safe
from django.utils.encoding import (
    force_str, force_text, python_2_unicode_compatible,
)
from django.db.models import Q, Count

import zipfile
import os
import tempfile

from editor.models import NewExam, NewQuestion, EditorItem, Access, ExamQuestion, Theme, Extension, QuestionPullRequest
import editor.models
from django.contrib.auth.models import User
from accounts.util import find_users

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

class ShowMoreCheckboxRenderer(forms.widgets.CheckboxFieldRenderer):
    outer_html = """
    <div{id_attr}>
        <ul class="initial-list list-unstyled">{first_content}</ul>
        {more}
    </div>
    """
    inner_html = '<li class="checkbox">{choice_value}{sub_widgets}</li>'
    more_html = """
        <div class="show-more collapse" id="{collapse_id}">
            <ul class="list-unstyled">
                {more_content}
            </ul>
        </div>
        <div>
            <a role="button" class="btn btn-link" data-toggle="collapse" href="#{collapse_id}">Show more</a>
        </div>
    """

    def render(self):
        """
        Outputs a <ul> for this set of choice fields.
        If an id was given to the field, it is applied to the <ul> (each
        item in the list will get an id of `$id_$i`).
        """
        id_ = self.attrs.get('id')
        first_output = []
        more_output = []
        num_in = len([1 for choice_value, choice_label in self.choices if force_text(choice_value) in self.value])
        num_unchecked_to_show = max(0,3-num_in)
        unchecked_shown = 0
        for i, choice in enumerate(self.choices):
            choice_value, choice_label = choice
            if force_text(choice_value) in self.value:
                output = first_output
            elif unchecked_shown < num_unchecked_to_show:
                output = first_output
                unchecked_shown += 1
            else:
                output = more_output

            if isinstance(choice_label, (tuple, list)):
                attrs_plus = self.attrs.copy()
                if id_:
                    attrs_plus['id'] += '_{}'.format(i)
                sub_ul_renderer = self.__class__(
                    name=self.name,
                    value=self.value,
                    attrs=attrs_plus,
                    choices=choice_label,
                )
                sub_ul_renderer.choice_input_class = self.choice_input_class
                output.append(format_html(self.inner_html, choice_value=choice_value,
                                          sub_widgets=sub_ul_renderer.render()))
            else:
                w = self.choice_input_class(self.name, self.value,
                                            self.attrs.copy(), choice, i)
                output.append(format_html(self.inner_html,
                                          choice_value=force_text(w), sub_widgets=''))
        if len(more_output):
            more = format_html(self.more_html,
                    collapse_id='{}-show-more'.format(id_) if id_ else 'show-more',
                    more_content=mark_safe('\n'.join(more_output))
            )
        else:
            more = ''
        return format_html(self.outer_html,
                           id_attr=format_html(' id="{}"', id_) if id_ else '',
                           first_content=mark_safe('\n'.join(first_output)), more=more)

class ShowMoreCheckboxSelectMultiple(forms.CheckboxSelectMultiple):
    renderer = ShowMoreCheckboxRenderer

class BootstrapRadioFieldRenderer(forms.widgets.RadioFieldRenderer):
    outer_html = """<div{id_attr}>{content}</div>"""
    inner_html = """<div class="radio">{choice_value}{sub_widgets}</div>"""

class BootstrapRadioSelect(forms.RadioSelect):
    renderer = BootstrapRadioFieldRenderer

class BootstrapSelect(forms.Select):
    def build_attrs(self,extra_attrs=None,**kwargs):
        attrs = super(BootstrapSelect,self).build_attrs(extra_attrs,**kwargs)
        attrs['class'] = 'form-control input-sm'
        return attrs

class EditorItemSearchForm(forms.Form):
    query = forms.CharField(initial='', required=False)
    item_types = forms.MultipleChoiceField(initial=('questions','exams'),choices=(('questions','Questions'),('exams','Exams')), widget=ShowMoreCheckboxSelectMultiple, required=False)
    author = forms.CharField(initial='', required=False)
    usage = forms.ChoiceField(initial='any',choices=USAGE_OPTIONS, required=False, widget=BootstrapRadioSelect)
    subjects = forms.ModelMultipleChoiceField(queryset=editor.models.Subject.objects.all(), required=False, widget=ShowMoreCheckboxSelectMultiple)
    topics = forms.ModelMultipleChoiceField(queryset=editor.models.Topic.objects.all(), required=False, widget=ShowMoreCheckboxSelectMultiple)
    ability_framework = forms.ModelChoiceField(queryset=editor.models.AbilityFramework.objects.all(), required=False, widget=forms.Select(attrs={'class':'form-control input-sm'}),empty_label=None)
    ability_levels = forms.ModelMultipleChoiceField(queryset=editor.models.AbilityLevel.objects.all(), widget=forms.CheckboxSelectMultiple, required=False)
    status = forms.ChoiceField(choices=[('any','Any status')]+list(editor.models.STAMP_STATUS_CHOICES),required=False, widget=BootstrapRadioSelect)
    order_by = forms.ChoiceField(choices=[('last_modified','Last modified'),('name','Name'),('licence','Usage rights'),('author','Author')],required=False, widget=BootstrapSelect,initial='last_modified')

    tags = TagField(initial='', required=False, widget=forms.TextInput(attrs={'placeholder': 'Tags separated by commas'}))
    exclude_tags = TagField(initial='', required=False, widget=forms.TextInput(attrs={'placeholder': 'Tags separated by commas'}))

    def __init__(self,data,*args,**kwargs):
        super(EditorItemSearchForm,self).__init__(data,*args,**kwargs)
        subjects = data.getlist('subjects')
        if len(subjects):
            self.fields['topics'].queryset = editor.models.Topic.objects.filter( Q(subjects__pk__in=subjects) | Q(pk__in=data.getlist('topics')) ).distinct()
        else:
            self.fields['topics'].queryset = editor.models.Topic.objects.annotate(num_editoritems=Count('editoritem')).order_by('-num_editoritems')

class AccessForm(forms.ModelForm):
    given_by = forms.ModelChoiceField(queryset=User.objects.all())

    class Meta:
        model = Access
        exclude = []

    def save(self,commit=True):
        self.instance.given_by = self.cleaned_data.get('given_by')
        super(AccessForm,self).save(commit)

class SetAccessForm(forms.ModelForm):
    given_by = forms.ModelChoiceField(queryset=User.objects.all())

    class Meta:
        model = EditorItem
        fields = ['public_access']

    def is_valid(self):
        v = super(SetAccessForm,self).is_valid()
        for f in self.user_access_forms:
            if not f.is_valid():
                return False
        return v
    
    def clean(self):
        cleaned_data = super(SetAccessForm,self).clean()

        self.user_ids = self.data.getlist('user_ids[]')
        self.access_levels = self.data.getlist('access_levels[]')
        self.user_access_forms = []

        for i,(user,access_level) in enumerate(zip(self.user_ids,self.access_levels)):
            f = AccessForm({'user':user,'access':access_level,'item':self.instance.pk,'given_by':self.cleaned_data.get('given_by').pk}, instance=Access.objects.filter(item=self.instance,user=user).first())
            f.full_clean()
            self.user_access_forms.append(f)
            for key,messages in f.errors.items():
                self._errors[('user %i: ' % i)+key]=messages

        return cleaned_data

    def save(self):
        access_to_remove = Access.objects.filter(item=self.instance).exclude(user__in=self.user_ids)
        access_to_remove.delete()
        for f in self.user_access_forms:
            f.save()
        return super(SetAccessForm,self).save()
        
class QuestionForm(forms.ModelForm):
    
    """Form for a question."""

    content = forms.CharField()

    subjects = forms.ModelMultipleChoiceField(queryset=editor.models.Subject.objects.all(),required=False)
    topics = forms.ModelMultipleChoiceField(queryset=editor.models.Topic.objects.all(),required=False)
    ability_levels = forms.ModelMultipleChoiceField(queryset=editor.models.AbilityLevel.objects.all(),required=False)

    class Meta:
        model = NewQuestion
        fields = ('resources','extensions')

    def save(self,commit=True):
        question = super(QuestionForm,self).save(commit=commit)
        question.editoritem.content = self.cleaned_data['content']
        question.editoritem.save()
        return question

class NewQuestionForm(forms.ModelForm):
    class Meta:
        model = EditorItem
        fields = ('name','author','project')
        widgets = {
            'name': forms.TextInput(attrs={'class':'form-control','placeholder':'e.g. "Solve an equation in two variables"'}),
            'author': forms.HiddenInput(),
            'project': BootstrapSelect,
        }
        
class ExamForm(forms.ModelForm):
    
    """Form for an exam."""

    subjects = forms.ModelMultipleChoiceField(queryset=editor.models.Subject.objects.all(),required=False)
    topics = forms.ModelMultipleChoiceField(queryset=editor.models.Topic.objects.all(),required=False)
    ability_levels = forms.ModelMultipleChoiceField(queryset=editor.models.AbilityLevel.objects.all(),required=False)

    content = forms.CharField()
    
    class Meta:
        model = NewExam
        fields = ('theme','custom_theme','locale')

    def save(self,commit=True):
        exam = super(ExamForm,self).save(commit=commit)
        exam.editoritem.content = self.cleaned_data['content']
        exam.editoritem.save()
        return exam
        
class NewExamForm(forms.ModelForm):
    class Meta:
        model = EditorItem
        fields = ('name','author','project')
        widgets = {
            'name': forms.TextInput(attrs={'class':'form-control','placeholder':'e.g. "Week 4 homework"'}),
            'author': forms.HiddenInput(),
            'project': BootstrapSelect,
        }

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
            extension.save()
            self.save_m2m()
        return extension

class UserField(forms.Field):
    def from_db_value(self,value,expression,connection,context):
        return value.get_full_name()

    def to_python(self, value):
        if value is None:
            return None
        return find_users(value).first()

class UserSearchMixin(object):
    user_search = UserField()
    user_attr = 'user'

    def __init__(self,*args,**kwargs):
        super(UserSearchMixin,self).__init__(*args,**kwargs)
        self.fields['user_search'] = UserField()

    def save(self, force_insert=False, force_update=False, commit=True):
        m = super(UserSearchMixin, self).save(commit=False)
        setattr(m,self.user_attr,self.cleaned_data['user_search'])
        if commit:
            m.save()
        return m

class AddMemberForm(UserSearchMixin,forms.ModelForm):
    class Meta:
        model = editor.models.ProjectAccess
        fields = ('project','access')

    def clean(self):
        cleaned_data = super(AddMemberForm,self).clean()
        if cleaned_data['user_search'] == cleaned_data['project'].owner:
            raise forms.ValidationError("Can't give separate access to the project owner")

    def save(self, force_insert=False, force_update=False, commit=True):
        m = super(AddMemberForm, self).save(commit=False)
        if commit:
            pa = editor.models.ProjectAccess.objects.filter(project=m.project,user=m.user).first()
            if pa is not None:
                pa.access = m.access
                m = pa
            m.save()
        return m

class TransferOwnershipForm(UserSearchMixin,forms.ModelForm):
    user_attr = 'owner'
    class Meta:
        model = editor.models.Project 
        fields = []

ProjectAccessFormset = inlineformset_factory(editor.models.Project,editor.models.ProjectAccess,fields=('access',),extra=0,can_delete=True)
