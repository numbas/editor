from django.shortcuts import render

def forbidden(request):
    response = render(request, '403.html')
    response.status_code = 403
    return response
