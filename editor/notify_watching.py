from notifications import notify

def notify_watching(actor,target,**kwargs):
    for user in target.watching_users.all():
        if user!=actor:
            notify.send(actor,target=target,recipient=user,**kwargs)
