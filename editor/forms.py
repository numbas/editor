import zipfile
import os

from django import forms
from django.forms.models import inlineformset_factory
from django.forms.widgets import SelectMultiple
from django.core.exceptions import ValidationError
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils.encoding import force_text
from django.db.models import Q, Count
from django.core.validators import validate_email
from django.contrib.auth.models import User

from editor.models import NewExam, NewQuestion, EditorItem, Access, Theme, Extension, PullRequest, CustomPartType
import editor.models
from accounts.util import find_users
from editor import jsonfield

class FixedSelectMultiple(SelectMultiple):
    def value_from_datadict(self, data, files, name):
        name += '[]'
        v = super(FixedSelectMultiple, self).value_from_datadict(data, files, name)
        return v

class TagField(forms.CharField):
    def clean(self, value):
        tags_string = super(TagField, self).clean(value)
        if len(tags_string.strip()):
            tags = tags_string.split(',')
            return [t.strip() for t in tags]
        else:
            return []

USAGE_OPTIONS = (
    ('any', 'Any'),
    ('reuse', 'Free to reuse'),
    ('modify', 'Free to reuse with modification'),
    ('sell', 'Free to reuse commercially'),
    ('modify-sell', 'Free to reuse commercially with modification'),
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
        num_unchecked_to_show = max(0, 3-num_in)
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
    def build_attrs(self, extra_attrs=None, **kwargs):
        attrs = super(BootstrapSelect, self).build_attrs(extra_attrs, **kwargs)
        attrs['class'] = 'form-control input-sm'
        return attrs

class EditorItemSearchForm(forms.Form):
    query = forms.CharField(initial='', required=False)
    item_types = forms.MultipleChoiceField(initial=('questions', 'exams'), choices=(('questions', 'Questions'), ('exams', 'Exams')), widget=ShowMoreCheckboxSelectMultiple, required=False)
    author = forms.CharField(initial='', required=False, widget=forms.TextInput(attrs={'class':'form-control'}))
    usage = forms.ChoiceField(initial='any', choices=USAGE_OPTIONS, required=False, widget=BootstrapRadioSelect)
    taxonomy_nodes = forms.ModelMultipleChoiceField(queryset=editor.models.TaxonomyNode.objects.all(), required=False)
    ability_framework = forms.ModelChoiceField(queryset=editor.models.AbilityFramework.objects.all(), required=False, widget=forms.Select(attrs={'class':'form-control input-sm'}), empty_label=None)
    ability_levels = forms.ModelMultipleChoiceField(queryset=editor.models.AbilityLevel.objects.all(), widget=forms.CheckboxSelectMultiple, required=False)
    status = forms.ChoiceField(choices=[('any', 'Any status'),('draft','Draft')]+list(editor.models.STAMP_STATUS_CHOICES), required=False, widget=BootstrapRadioSelect)
    order_by = forms.ChoiceField(choices=[('last_modified', 'Last modified'), ('name', 'Name'), ('licence', 'Usage rights'), ('author', 'Author')], required=False, widget=BootstrapSelect, initial='last_modified')

    tags = TagField(initial='', required=False, widget=forms.TextInput(attrs={'placeholder': 'Tags separated by commas'}))
    exclude_tags = TagField(initial='', required=False, widget=forms.TextInput(attrs={'placeholder': 'Tags separated by commas'}))

class AccessForm(forms.ModelForm):
    given_by = forms.ModelChoiceField(queryset=User.objects.all())

    class Meta:
        model = Access
        exclude = []

    def save(self, commit=True):
        self.instance.given_by = self.cleaned_data.get('given_by')
        super(AccessForm, self).save(commit)

class SetAccessForm(forms.ModelForm):
    given_by = forms.ModelChoiceField(queryset=User.objects.all())

    class Meta:
        model = EditorItem
        fields = ['public_access']

    def is_valid(self):
        v = super(SetAccessForm, self).is_valid()
        for f in self.user_access_forms:
            if not f.is_valid():
                return False
        return v
    
    def clean(self):
        cleaned_data = super(SetAccessForm, self).clean()

        self.user_ids = self.data.getlist('user_ids[]')
        self.access_levels = self.data.getlist('access_levels[]')
        self.user_access_forms = []

        for i, (user, access_level) in enumerate(zip(self.user_ids, self.access_levels)):
            f = AccessForm({'user':user, 'access':access_level, 'item':self.instance.pk, 'given_by':self.cleaned_data.get('given_by').pk}, instance=Access.objects.filter(item=self.instance, user=user).first())
            f.full_clean()
            self.user_access_forms.append(f)
            for key, warnings in f.errors.items():
                self._errors[('user %i: ' % i)+key] = warnings

        return cleaned_data

    def save(self, commit=True):
        access_to_remove = Access.objects.filter(item=self.instance).exclude(user__in=self.user_ids)
        access_to_remove.delete()
        for f in self.user_access_forms:
            f.save()
        return super(SetAccessForm, self).save()
        
class EditorItemForm(forms.ModelForm):
    content = forms.CharField()

    taxonomy_nodes = forms.ModelMultipleChoiceField(queryset=editor.models.TaxonomyNode.objects.all(), required=False)
    ability_levels = forms.ModelMultipleChoiceField(queryset=editor.models.AbilityLevel.objects.all(), required=False)

    def save(self, commit=True):
        obj = super(EditorItemForm, self).save(commit=commit)
        obj.editoritem.content = self.cleaned_data['content']
        obj.editoritem.save()
        return obj

class CopyEditorItemForm(forms.ModelForm):
    class Meta:
        model = EditorItem
        fields = ('name', 'project')
        widgets = {
            'name': forms.TextInput(attrs={'class':'form-control', 'placeholder':'e.g. "Solve an equation in two variables"'}),
            'project': BootstrapSelect,
        }

class EditorItemMoveProjectForm(forms.ModelForm):
    class Meta:
        model = EditorItem
        fields = ('project',)
        widgets = {
            'project': BootstrapSelect,
        }
        
class QuestionForm(EditorItemForm):
    
    class Meta:
        model = NewQuestion
        fields = ('resources', 'extensions')

class NewQuestionForm(forms.ModelForm):
    class Meta:
        model = EditorItem
        fields = ('name', 'author', 'project')
        widgets = {
            'name': forms.TextInput(attrs={'class':'form-control', 'placeholder':'e.g. "Solve an equation in two variables"'}),
            'author': forms.HiddenInput(),
            'project': BootstrapSelect,
        }

class ExamForm(EditorItemForm):
    class Meta:
        model = NewExam
        fields = ('theme', 'custom_theme', 'locale')
        
class NewExamForm(forms.ModelForm):
    class Meta:
        model = EditorItem
        fields = ('name', 'author', 'project')
        widgets = {
            'name': forms.TextInput(attrs={'class':'form-control', 'placeholder':'e.g. "Week 4 homework"'}),
            'author': forms.HiddenInput(),
            'project': BootstrapSelect,
        }

def validate_exam_file(f):
    try:
        content = f.read().decode('utf-8')
        editor.models.validate_content(content)
        f.seek(0)
    except (UnicodeDecodeError, ValidationError):
        raise ValidationError("Not a valid .exam file")

class UploadExamForm(forms.ModelForm):
    file = forms.FileField(required=True, validators=[validate_exam_file])

    class Meta:
        model = EditorItem
        fields = ('file', 'project',)
        widgets = {
            'author': forms.HiddenInput(),
            'project': BootstrapSelect,
        }

class ValidateZipField:
    def clean_zipfile(self):
        value = self.cleaned_data['zipfile']
        if not zipfile.is_zipfile(value):
            raise forms.ValidationError('Uploaded file is not a zip file')
        return value

class UpdateThemeForm(forms.ModelForm, ValidateZipField):
    
    """Form to edit a theme."""
    
    class Meta:
        model = Theme
        fields = ['name', 'zipfile']
        widgets = {
            'name': forms.TextInput(attrs={'class':'form-control'}),
            'zipfile': forms.FileInput()
        }
        
class NewThemeForm(UpdateThemeForm):
    
    """Form for a new theme."""
    
    def __init__(self, *args, **kwargs):
        self._user = kwargs.pop('author')
        super(NewThemeForm, self).__init__(*args, **kwargs)

    def save(self, commit=True):
        theme = super(NewThemeForm, self).save(commit=False)
        theme.public = False
        theme.author = self._user
        if commit:
            theme.save()
            self.save_m2m()
        return theme

class UpdateExtensionForm(forms.ModelForm):
    
    """Form to edit an extension."""
    
    class Meta:
        model = Extension
        fields = ['name', 'location', 'url', 'zipfile']
        widgets = {
            'name': forms.TextInput(attrs={'class':'form-control'}),
            'location': forms.TextInput(attrs={'class':'form-control'}),
            'url': forms.TextInput(attrs={'class':'form-control'}),
            'zipfile': forms.FileInput()
        }

    def clean_zipfile(self):
        file = self.cleaned_data['zipfile']
        if file is None:
            raise forms.ValidationError("No file uploaded")
        if not zipfile.is_zipfile(file):
            _, extension = os.path.splitext(file.name)
            if extension.lower() == '.js':
                return file
            else:
                raise forms.ValidationError('Uploaded file is not a .zip file or .js file.')
        else:
            return file

    def clean_location(self):
        location = self.cleaned_data.get('location')
        if location == '':
            raise ValidationError('You must give a short name.')

        return location

class NewExtensionForm(UpdateExtensionForm):
    
    """Form for a new extension."""
    
    def __init__(self, *args, **kwargs):
        self._user = kwargs.pop('author')
        super(NewExtensionForm, self).__init__(*args, **kwargs)

    def save(self, commit=True):
        extension = super(NewExtensionForm, self).save(commit=False)
        extension.public = False
        extension.author = self._user
        if commit:
            extension.save()
            self.save_m2m()
        return extension

class UpdateCustomPartTypeForm(forms.ModelForm):
    
    """Form to edit a custom part type."""
    
    class Meta:
        model = CustomPartType
        fields = ['name', 'short_name', 'description', 'input_widget', 'can_be_gap', 'can_be_step', 'settings', 'marking_script']
        widgets = {
            'name': forms.TextInput(attrs={'class':'form-control'}),
            'short_name': forms.TextInput(attrs={'class':'form-control'}),
            'input_widget': forms.widgets.Select(choices=editor.models.CUSTOM_PART_TYPE_INPUT_WIDGETS, attrs={'class':'form-control'}),
            'settings': jsonfield.JSONWidget(),
        }

    def clean_short_name(self):
        short_name = self.cleaned_data.get('short_name')
        built_in_part_types = ['jme','numberentry','patternmatch','matrix','gapfill','information','extension','1_n_2','m_n_2','m_n_x']
        if short_name in built_in_part_types:
            raise ValidationError("The unique identifier you chose is already in use.")
        return short_name

    def clean_marking_script(self):
        marking_script = self.cleaned_data.get('marking_script')
        return marking_script.replace('\r','')

class NewCustomPartTypeForm(UpdateCustomPartTypeForm):
    
    """Form for a new extension."""
    
    def __init__(self, *args, **kwargs):
        self._user = kwargs.pop('author')
        super(NewCustomPartTypeForm, self).__init__(*args, **kwargs)

    def save(self, commit=True):
        custom_part_type = super(NewCustomPartTypeForm, self).save(commit=False)
        custom_part_type.author = self._user
        if commit:
            custom_part_type.save()
            self.save_m2m()
        return custom_part_type

class BootstrapFieldMixin(object):
    def widget_attrs(self, widget):
        attrs = super(BootstrapFieldMixin, self).widget_attrs(widget)
        attrs.update({'class': 'form-control'})
        return attrs

class UserField(BootstrapFieldMixin, forms.Field):
    def from_db_value(self, value, expression, connection, context):
        return value.get_full_name()

    def widget_attrs(self, widget):
        attrs = super(UserField, self).widget_attrs(widget)
        attrs.update({'placeholder': 'Username or full name'})
        return attrs

    def to_python(self, value):
        if value is None:
            return None
        user = find_users(value).first()
        if user is None:
            try:
                validate_email(value)
                return User(email=value)
            except ValidationError:
                raise forms.ValidationError("No user matching query '{}'".format(value))
        return user

class UserSearchMixin(forms.ModelForm):
    """
        Add a user_search field to the form, which resolves a string query to a User object, and set the property user_attr on the model to that user.
    """
    user_search = UserField(label='User')
    user_attr = 'user'
    selected_user = forms.ModelChoiceField(queryset=User.objects.all(), widget=forms.HiddenInput(), required=False)

    def __init__(self, *args, **kwargs):
        super(UserSearchMixin, self).__init__(*args, **kwargs)
        self.fields['user_search'] = UserField()

    def clean_user_search(self):
        user = self.cleaned_data.get('user_search')

        return user

    def clean(self):
        cleaned_data = super(UserSearchMixin, self).clean()
        selected_user = cleaned_data.get('selected_user')
        if selected_user is not None:
            cleaned_data['user_search'] = selected_user

        if cleaned_data['user_search'] is None:
            raise forms.ValidationError("No such user")

        return cleaned_data

    def save(self, commit=True, force_insert=False, force_update=False):
        m = super(UserSearchMixin, self).save(commit=False)
        setattr(m, self.user_attr, self.cleaned_data['user_search'])
        if commit:
            m.save()
        return m

class AddMemberForm(UserSearchMixin, forms.ModelForm):
    invitation = None
    adding_user = forms.ModelChoiceField(queryset=User.objects.all(), widget=forms.HiddenInput())

    class Meta:
        model = editor.models.ProjectAccess
        fields = ('project', 'access')
        widgets = {
            'project': forms.HiddenInput(),
            'access': forms.Select(attrs={'class':'form-control'})
        }

    def clean(self):
        cleaned_data = super(AddMemberForm, self).clean()
        user = cleaned_data.get('user_search')
        if user == cleaned_data.get('project').owner:
            raise forms.ValidationError("Can't give separate access to the project owner")
        return cleaned_data

    def save(self, force_insert=False, force_update=False, commit=True):
        m = super(AddMemberForm, self).save(commit=False)
        if commit:
            if m.user.pk:
                # check if there's an existing ProjectAccess for this user & project
                pa = editor.models.ProjectAccess.objects.filter(project=m.project, user=m.user).first()
                if pa is not None:
                    pa.access = m.access
                    m = pa
                m.save()
            else:   # create email invitation if the user_search field contained an email address
                self.invitation = editor.models.ProjectInvitation.objects.create(invited_by=self.cleaned_data.get('adding_user'), project=m.project, access=m.access, email=m.user.email)
        return m

class ProjectForm(forms.ModelForm):
    class Meta:
        model = editor.models.Project
        fields = ('name', 'description', 'default_licence', 'default_locale', 'public_view')
        widgets = {
            'default_locale': forms.widgets.Select(choices=editor.models.LOCALE_CHOICES, attrs={'class':'form-control'})
        }

class ProjectTransferOwnershipForm(UserSearchMixin, forms.ModelForm):
    user_attr = 'owner'
    class Meta:
        model = editor.models.Project 
        fields = []

class EditorItemTransferOwnershipForm(UserSearchMixin, forms.ModelForm):
    user_attr = 'author'
    class Meta:
        model = editor.models.EditorItem
        fields = []

ProjectAccessFormset = inlineformset_factory(editor.models.Project, editor.models.ProjectAccess, fields=('access',), extra=0, can_delete=True)

class CreatePullRequestForm(forms.ModelForm):
    class Meta:
        model = PullRequest
        fields = ('source', 'destination', 'comment')

class CreateExamFromBasketForm(forms.ModelForm):
    clear_basket = forms.BooleanField(initial=True, label='Empty your basket after creation?', required=False)
    class Meta:
        model = EditorItem
        fields = ('name', 'author', 'project')
        widgets = {
            'name': forms.TextInput(attrs={'class':'form-control', 'placeholder':'e.g. "Week 4 homework"'}),
            'author': forms.HiddenInput(),
            'project': BootstrapSelect,
        }
