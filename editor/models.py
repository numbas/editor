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
    questions = models.ManyToManyField(Question)
    name = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    filename = models.CharField(max_length=200)
    metadata = models.TextField()
    
    def __unicode(self):
        return self.name
    
class QuestionForm(ModelForm):
    class Meta:
        model = Question
        
class ExamForm(ModelForm):
    class Meta:
        model = Exam