from registration.forms import RegistrationForm
from sanitizer.forms import SanitizedCharField
from django import forms, apps
from django.conf import settings
from django.forms.widgets import PasswordInput, Textarea
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User
from accounts.models import UserProfile
try:
    from urllib.parse import urlparse, urlunparse
except ImportError:
    from urlparse import urlparse, urlunparse
import re

class NumbasRegistrationForm(RegistrationForm):
    first_name = forms.CharField(label=_('First Name(s)'))
    last_name = forms.CharField(label=_('Surname'))
    if apps.registry.apps.is_installed('numbasmailing'):
        subscribe = forms.BooleanField(label=_('Subscribe to the Numbas newsletter'), required=False)

    register_button = _('Register')

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ('first_name', 'last_name', 'email', 'bio', 'language', 'avatar','wrap_lines','mathjax_url')
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
    
    def get_profile(self):
        return UserProfile.objects.get(user=self.instance)

    def save(self, *args, **kwargs):
        self.profile.language = self.cleaned_data.get('language')
        self.profile.bio = self.cleaned_data.get('bio')
        self.profile.wrap_lines = self.cleaned_data.get('wrap_lines')
        self.profile.mathjax_url = self.cleaned_data.get('mathjax_url')
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

class DeactivateUserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = []

    confirm_text = forms.CharField()
    magic_word = 'DEACTIVATE'

    def clean_confirm_text(self):
        magic_word = self.magic_word
        confirm_text = self.cleaned_data.get('confirm_text').strip().upper()
        if confirm_text != magic_word:
            raise forms.ValidationError("You must type {} in the box.".format(magic_word))
        return confirm_text

    def save(self, *args, **kwargs):
        user = self.instance

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
