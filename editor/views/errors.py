from django.shortcuts import render
from django import http

def forbidden(request):
    response = render(request,'403.html')
    response.status_code = 403
    return response
