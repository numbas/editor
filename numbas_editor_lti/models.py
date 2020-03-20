from django.db import models
from django.contrib.auth.models import User
from editor.models import NewExam

class LTIContext(models.Model):
    exam = models.ForeignKey(NewExam, blank=True, null=True, on_delete=models.SET_NULL)
    resource_link_id = models.CharField(max_length=1000)
    context_id = models.CharField(max_length=1000)
    instance_guid = models.CharField(max_length=1000)
    name = models.CharField(max_length=1000,blank=True)
