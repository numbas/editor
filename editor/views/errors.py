from django.shortcuts import render

def forbidden(request,message=''):
    response = render(request, '403.html', {'message': message})
    response.status_code = 403
    return response
