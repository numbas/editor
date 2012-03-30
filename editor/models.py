#Copyright 2012 Newcastle University
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
import uuid
import git
import os
import json

from django.conf import settings
from django.db import models
from django.template.defaultfilters import slugify
from django.template import loader, Context
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.forms import model_to_dict

from taggit.managers import TaggableManager

from examparser import ExamParser, ParseError, printdata

class NumbasObject:
    def save(self):
        if self.content:
            parser = ExamParser()
            data = parser.parse(self.content)
            self.name = data['name']
        elif self.name:
            self.content = '{name: %s}' % self.name

    def set_name(self,name):
        self.name = name
        if self.content:
            data = ExamParser().parse(self.content)
            data['name'] = name
            self.content = printdata(data)
        self.save()

class GitObject:

    message = ''

    def repo(self):
        repo = git.Repo(settings.GLOBAL_SETTINGS['REPO_PATH'])

        if repo.heads:
            repo.head.reset(working_tree=True)

        author = getattr(self,'edit_user',self.author)

        os.environ['GIT_AUTHOR_NAME'] = author.get_full_name()
        os.environ['GIT_AUTHOR_EMAIL'] = author.email


        return repo

    def abs_path_to_file(self):
        return os.path.join(self.repo().working_dir,self.path_to_file())
    
    def path_to_file(self):
        return os.path.join(self.git_directory, self.filename)

    def save(self):
        """ if content has changed, save to git repo """

        if not self.filename:
            self.filename = str(uuid.uuid4())

        if self.pk is not None:
            original = self.__class__.objects.get(pk=self.pk)
            if original.content == self.content:    #if content has not changed, do nothing
                return
            if original.name != self.name:
                self.message += 'Renamed %s to %s.\n' % (original.name,self.name)

        repo = self.repo()
        fh = open(self.abs_path_to_file(), 'w')
        fh.write(self.content)
        fh.close()
        repo.index.add([self.path_to_file()])
        self.message += 'Made some changes to %s.\n' % str(self)
        repo.index.commit(self.message)
        
    def delete(self):
        """ Remove file from repository """

        repo = self.repo()
        try:
            repo.index.remove([self.path_to_file()])
            os.remove(self.abs_path_to_file())
            repo.index.commit('Deleted %s' % str(self))
        except Exception as err:
            print(err)


#check that the .exam file for an object is valid and defines at the very least a name
def validate_content(content):
    try:
        data = ExamParser().parse(content)
        if not 'name' in data:
            raise ValidationError('No "name" property in content.')
    except ParseError as err:
        raise ValidationError(err)

class Question(models.Model,NumbasObject,GitObject):
    
    """Model class for a question.
    
    Many-to-many relation with Exam through ExamQuestion.
    
    """
    
    name = models.CharField(max_length=200)
    slug = models.SlugField(editable=False,unique=False)
    author = models.ForeignKey(User)
    filename = models.CharField(max_length=200, editable=False)
    content = models.TextField(blank=True,validators=[validate_content])
    metadata = models.TextField(blank=True)
    tags = TaggableManager()

    git_directory = 'questions'
    
    def __unicode__(self):
        return 'Question "%s"' % self.name
    
    def save(self, *args, **kwargs):
        NumbasObject.save(self)

        self.slug = slugify(self.name)

        GitObject.save(self)

        super(Question, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        GitObject.delete(self)
        super(Question,self).delete(*args, **kwargs)

    def as_source(self):
        t = loader.get_template('question/template.exam')
        return t.render(Context({
            'name': self.name,
            'content': self.content,
            'question': self
        }))

    def as_json(self):
        d = model_to_dict(self)
        d['tags'] = [ti.tag.name for ti in d['tags']]
        return json.dumps(d)

class Exam(models.Model,NumbasObject,GitObject):
    
    """Model class for an Exam.
    
    Many-to-many relation with Question through ExamQuestion.
    
    """
    
    questions = models.ManyToManyField(Question, through='ExamQuestion',
                                       blank=True, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(editable=False,unique=False)
    author = models.ForeignKey(User)
    filename = models.CharField(max_length=200, editable=False)
    content = models.TextField(blank=True, validators=[validate_content])
    metadata = models.TextField(blank=True)

    git_directory = 'exams'
    
    def __unicode__(self):
        return 'Exam "%s"' %self.name
    
    def get_questions(self):
        return self.questions.order_by('examquestion')

    def set_questions(self,question_list=None,**kwargs):
        """ 
            Set the list of questions for this exam. 
            question_list is an ordered list of question IDs
        """

        if 'question_ids' in kwargs:
            question_list = [Question.objects.get(pk=pk) for pk in kwargs['question_ids']]

        self.questions.clear()
        for order,question in enumerate(question_list):
            exam_question = ExamQuestion(exam=self,question=question, qn_order=order)
            exam_question.save()

    
    def save(self, *args, **kwargs):
        NumbasObject.save(self)

        self.slug = slugify(self.name)
            
        GitObject.save(self)

        super(Exam, self).save(*args, **kwargs)
        
    def as_source(self):
        parser = ExamParser()
        data = parser.parse(self.content)
        data['name'] = self.name
        data['questions'] = [parser.parse(q.content) for q in self.get_questions()]
        return printdata(data)
        
class ExamQuestion(models.Model):
    
    """Model class linking exams and questions."""
    
    class Meta:
        ordering = ['qn_order']
        
    exam = models.ForeignKey(Exam)
    question = models.ForeignKey(Question)
    qn_order = models.PositiveIntegerField()
