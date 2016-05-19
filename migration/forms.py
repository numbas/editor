from django.contrib.auth.models import User
from editor.models import EditorItem,Project,Licence
from django.forms.models import inlineformset_factory
from django import forms
from editor.forms import BootstrapSelect

MigrateEditorItemFormset = inlineformset_factory(
    User,
    EditorItem,
    fields=('project','licence','published'),
    widgets = {
        'project': BootstrapSelect(),
        'licence': BootstrapSelect(),
    },
    extra=0,
    fk_name='author',
    can_delete=False
)

class ApplyToAllItemsForm(forms.Form):
    project = forms.ModelChoiceField(queryset=Project.objects.all(),widget=BootstrapSelect())
    licence = forms.ModelChoiceField(queryset=Licence.objects.all(),widget=BootstrapSelect())
