from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

# Create your models here.

class Feature(models.Model):
    object_content_type = models.ForeignKey(ContentType, related_name='features', on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    object = GenericForeignKey('object_content_type', 'object_id')

    feature = models.CharField(max_length=1000)

    date_observed = models.DateTimeField(auto_now=True)
