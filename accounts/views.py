from accounts.forms import NumbasRegistrationForm
from registration.views import register as original_register

def register(*args,**kwargs):
    kwargs['form_class'] = NumbasRegistrationForm
    return original_register(*args,**kwargs)
