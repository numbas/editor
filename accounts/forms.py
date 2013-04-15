from django.conf import settings
from registration.forms import RegistrationForm
from django import forms
from django.forms.widgets import PasswordInput
from django.utils.translation import ugettext_lazy as _
from accounts.models import UserProfile

class NumbasRegistrationForm(RegistrationForm):
    first_name = forms.CharField(label=_('First Name(s)'))
    last_name = forms.CharField(label=_('Surname'))

    register_button = _('Register')

class UserProfileForm(forms.ModelForm):
	first_name = forms.CharField(max_length=30)
	last_name = forms.CharField(max_length=30)
	email = forms.EmailField()
	language = forms.ChoiceField(choices=[(x,x) for x in settings.GLOBAL_SETTINGS['NUMBAS_LOCALES']])

	def __init__(self, *args, **kw):
		super(UserProfileForm, self).__init__(*args, **kw)
		self.profile = self.get_profile()
		self.fields['language'].initial = self.profile.language
	
	def get_profile(self):
		return UserProfile.objects.get(user=self.instance)

	def save(self,*args,**kwargs):
		self.profile.language = self.cleaned_data.get('language')
		self.profile = self.profile.save()
		super(UserProfileForm,self).save(self,*args,**kwargs)

class ChangePasswordForm(forms.ModelForm):
	password1 = forms.CharField(widget=PasswordInput,label='New password')
	password2 = forms.CharField(widget=PasswordInput,label='Type new password again')

	def clean(self):
		cleaned_data = super(forms.ModelForm,self).clean()

		password1 = cleaned_data.get('password1')
		password2 = cleaned_data.get('password2')

		if (not password2) or password1 != password2:
			raise forms.ValidationError("You didn't type the same password twice.")

		return cleaned_data


	def save(self,*args,**kwargs):
		print('save!')
		password = self.cleaned_data.get('password1')

		self.instance.set_password(password)
		self.instance.save()
