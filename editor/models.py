from django.db import models
from django.forms import ModelForm
from django.template.defaultfilters import slugify

class Question(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(editable=False)
    author = models.CharField(max_length=200)
    filename = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    metadata = models.TextField(blank=True)
    tags = models.TextField(blank=True)
    
    def __unicode__(self):
        return self.name
    
    def save(self, *args, **kwargs):
#        if not self.pk:
        self.slug = slugify(self.name)
            
        super(Question, self).save(*args, **kwargs)


class Exam(models.Model):
    questions = models.ManyToManyField(Question, blank=True)
    name = models.CharField(max_length=200)
    slug = models.SlugField(editable=False)
    author = models.CharField(max_length=200)
    filename = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    metadata = models.TextField(blank=True)
    
    def __unicode(self):
        return self.name
    
    def save(self, *args, **kwargs):
#        if not self.pk:
        self.slug = slugify(self.name)
            
        super(Exam, self).save(*args, **kwargs)
        
#class ExamQuestion(models.Model):
#    exam = models.ForeignKey(Exam)
#    question = models.ForeignKey(Question)
    
class QuestionForm(ModelForm):
    class Meta:
        model = Question
        
class ExamForm(ModelForm):
    class Meta:
        model = Exam