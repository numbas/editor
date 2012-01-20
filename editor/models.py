from django.template.defaultfilters import slugify
from django.db import models
from django.forms import ModelForm

class Question(models.Model):
    name = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    filename = models.CharField(max_length=200)
    metadata = models.TextField()
    tags = models.TextField()
    
    def __unicode__(self):
        return self.name
    

class Exam(models.Model):
    questions = models.ManyToManyField(Question, blank=True)
    name = models.CharField(max_length=200)
    slug = models.SlugField(editable=False)
    author = models.CharField(max_length=200)
    filename = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    metadata = models.TextField()
    
    def __unicode(self):
        return self.name
    
    def save(self, *args, **kwargs):
#        if not self.pk:
        self.slug = slugify(self.name)
            
        super(Exam, self).save(*args, **kwargs)
    
class QuestionForm(ModelForm):
    class Meta:
        model = Question
        
class ExamForm(ModelForm):
    class Meta:
        model = Exam