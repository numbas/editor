from registration.forms import RegistrationForm
from sanitizer.forms import SanitizedCharField
from django import forms, apps
from django.conf import settings
from django.core.validators import validate_email
from django.forms.widgets import PasswordInput, Textarea, TextInput
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User
from accounts.models import UserProfile
from accounts.util import find_users
from editor.models import reassign_content
try:
    from urllib.parse import urlparse, urlunparse
except ImportError:
    from urlparse import urlparse, urlunparse
import re

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
        if not value:
            return None
        user = find_users(value).first()
        if user is None:
            try:
                validate_email(value)
                return User(email=value)
            except forms.ValidationError:
                raise forms.ValidationError("No user matching query '{}'".format(value))
        return user

class UserSearchWidget(TextInput):
    template_name = 'autocomplete/user-search-widget.html'

    class Media:
        js = ('js/user-search-widget.js',)

class UserSearchField(UserField):
    widget = UserSearchWidget

class NumbasRegistrationForm(RegistrationForm):
    first_name = forms.CharField(label=_('First Name(s)'))
    last_name = forms.CharField(label=_('Surname'))
    if apps.registry.apps.is_installed('numbasmailing'):
        subscribe = forms.BooleanField(label=_('Subscribe to the Numbas newsletter'), required=False)

    register_button = _('Register')

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = (
            'first_name', 
            'last_name', 
            'email', 
            'bio', 
            'language', 
            'avatar',
            'wrap_lines',
            'mathjax_url',
            'email_about_stamps',
            'email_about_comments',
            'never_email'
        )
        widgets = {
            'mathjax_url': forms.TextInput(attrs={'class':'form-control','placeholder':settings.MATHJAX_URL})
        }
        help_texts = {
            'mathjax_url': 'This will be used in all questions and exams you compile. Leave blank to use the default.'
        }

    first_name = forms.CharField(max_length=30, widget=forms.TextInput(attrs={'class':'form-control'}))
    last_name = forms.CharField(max_length=30, widget=forms.TextInput(attrs={'class':'form-control'}))
    email = forms.EmailField(widget=forms.TextInput(attrs={'class':'form-control'}))
    language = forms.ChoiceField(choices=[(x, y) for y, x in settings.GLOBAL_SETTINGS['NUMBAS_LOCALES']], widget=forms.Select(attrs={'class':'form-control'}))
    bio = SanitizedCharField(
            widget=Textarea, 
            allowed_tags=settings.SANITIZER_ALLOWED_TAGS, 
            allowed_attributes=settings.SANITIZER_ALLOWED_ATTRIBUTES, 
            required=False
            )

    def clean_mathjax_url(self):
        url = self.cleaned_data['mathjax_url']
        bits = urlparse(url)
        if bits.scheme=='http':
            raise forms.ValidationError("Loading MathJax over HTTP can cause problems when the exam is loaded over HTTPS. If you're absolutely sure you want to do this, use // instead of http://")
        path = re.sub(r'/(MathJax.js)?$','',bits.path)
        return urlunparse((bits.scheme,bits.netloc,path,'','',''))

    def __init__(self, *args, **kw):
        super(UserProfileForm, self).__init__(*args, **kw)
        self.profile = self.get_profile()
        self.fields['language'].initial = self.profile.language
        self.fields['bio'].initial = self.profile.bio
        self.fields['wrap_lines'].initial = self.profile.wrap_lines
        self.fields['mathjax_url'].initial = self.profile.mathjax_url
        self.fields['email_about_stamps'].initial = self.profile.email_about_stamps
        self.fields['email_about_comments'].initial = self.profile.email_about_comments
        self.fields['never_email'].initial = self.profile.never_email
        if self.profile.never_email:
            self.fields['email_about_stamps'].initial = False
            self.fields['email_about_comments'].initial = False
    
    def get_profile(self):
        return UserProfile.objects.get(user=self.instance)

    def save(self, *args, **kwargs):
        self.profile.language = self.cleaned_data.get('language')
        self.profile.bio = self.cleaned_data.get('bio')
        self.profile.wrap_lines = self.cleaned_data.get('wrap_lines')
        self.profile.mathjax_url = self.cleaned_data.get('mathjax_url')
        self.profile.email_about_stamps = self.cleaned_data.get('email_about_stamps')
        self.profile.email_about_comments = self.cleaned_data.get('email_about_comments')
        self.profile.never_email = self.cleaned_data.get('never_email')
        if self.cleaned_data.get('avatar'):
            self.profile.avatar = self.cleaned_data.get('avatar')
        self.profile = self.profile.save()
        super(UserProfileForm, self).save(self, *args, **kwargs)

class ChangePasswordForm(forms.ModelForm):
    class Meta:
        model = User
        fields = []
    password1 = forms.CharField(widget=PasswordInput(attrs={'class':'form-control'}), label='New password')
    password2 = forms.CharField(widget=PasswordInput(attrs={'class':'form-control'}), label='Type new password again')

    def clean(self):
        cleaned_data = super(ChangePasswordForm, self).clean()

        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')

        if (not password2) or password1 != password2:
            raise forms.ValidationError("You didn't type the same password twice.")

        return cleaned_data


    def save(self, *args, **kwargs):
        password = self.cleaned_data.get('password1')

        self.instance.set_password(password)
        self.instance.save()

class MagicWordForm(forms.Form):
    confirm_text = forms.CharField()
    magic_word = 'CONFIRM'

    def clean_confirm_text(self):
        magic_word = self.magic_word
        confirm_text = self.cleaned_data.get('confirm_text').strip().upper()
        if confirm_text != magic_word:
            raise forms.ValidationError("You must type {} in the box.".format(magic_word))
        return confirm_text

class DeactivateUserForm(forms.ModelForm,MagicWordForm):
    class Meta:
        model = User
        fields = []

    if apps.registry.apps.is_installed('numbasmailing'):
        unsubscribe = forms.BooleanField(initial=True, label=_('Unsubscribe from the Numbas newsletter'), required=False)
    magic_word = 'DEACTIVATE'

    reassign_to_user = UserSearchField(label=_('Reassign content to'),required=False)


    def save(self, *args, **kwargs):
        user = self.instance

        reassign_to_user = self.cleaned_data.get('reassign_to_user')
        if reassign_to_user:
            reassign_content(user,reassign_to_user)

        if self.cleaned_data.get('unsubscribe'):
            import numbasmailing.mail
            numbasmailing.mail.delete(user.email)

        user.is_active = False
        user.username = 'deactivated_user_{}!'.format(user.pk)
        user.password = ''
        user.email = ''
        user.last_login = None
        user.first_name = ''
        user.last_name = ''
        user.save()

        user.userprofile.bio = ''
        user.userprofile.question_basket.clear()
        user.userprofile.avatar = None
        user.userprofile.mathjax_url = ''
        user.userprofile.save()

        user.userprofile.personal_project.name = "Deactivated user's workspace"
        user.userprofile.personal_project.save()

class ReassignContentForm(forms.ModelForm,MagicWordForm):
    class Meta:
        model = User
        fields = []

    to_user = UserSearchField(label=_('Reassign content to'))

    magic_word = 'REASSIGN'

    def save(self, *args, **kwargs):
        from_user = self.instance
        to_user = self.cleaned_data.get('to_user')
        reassign_content(from_user,to_user)
