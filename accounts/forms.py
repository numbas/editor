from registration.forms import RegistrationForm
from django import forms
from django.utils.translation import ugettext_lazy as _

class NumbasRegistrationForm(RegistrationForm):
    first_name = forms.CharField(label=_('First Name(s)'))
    last_name = forms.CharField(label=_('Surname'))

    register_button = _('Register')
