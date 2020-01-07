from django.db import models
from django.contrib.auth.models import User
from editor.models import NewExam

# Create your models here.
class LTIConsumer(models.Model):
    owner = models.ForeignKey(User,related_name='lticonsumers',on_delete=models.CASCADE)
    key = models.CharField(max_length=80,unique=True)
    secret = models.CharField(max_length=80)

class LTIContext(models.Model):
    consumer = models.ForeignKey(LTIConsumer,related_name='contexts',on_delete=models.CASCADE)
    exam = models.ForeignKey(NewExam, blank=True, null=True, on_delete=models.SET_NULL)
    resource_link_id = models.CharField(max_length=1000)
