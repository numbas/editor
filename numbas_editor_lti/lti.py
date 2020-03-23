from pylti.common import verify_request_common, LTIBase, LTIException, LTINotInSessionException, LTI_PROPERTY_LIST
from django.conf import settings

LTI_SETTINGS = settings.LTI_SETTINGS

from .models import LTIContext
from .roles import normalise_role

LTI_ROLES = {
    'staff': ['Administrator', 'Instructor', ],
    'instructor': ['Instructor', ],
    'administrator': ['Administrator', ],
    'student': ['Student', 'Learner', ]
}

class ConsumerGetter(object):
    def get(self,key):
        if key!=LTI_SETTINGS['key']:
            return None
        return {'key': key, 'secret': LTI_SETTINGS['secret']}

class LTI(LTIBase):
    def __init__(self, request, request_type='any', context=None):
        self.request = request
        self.session = {}
        self.lti_context = context
        lti_kwargs = {'request': request_type}
        super().__init__([],lti_kwargs)

    @property
    def session_key(self):
        return 'LTI_'+str(self.lti_context.pk)

    def _consumers(self):
        return ConsumerGetter()

    @property
    def response_url(self):
        return self.session.get('lis_outcome_service_url','')

    def verify_request(self):
        request = self.request
        if request.method != 'POST':
            raise LTIException("LTI Launch request did not use the POST method")
        params = dict(request.POST.items())
        try:
            verify_request_common(ConsumerGetter(), request.build_absolute_uri(), request.method, request.META, params)
            lti_session = {k: params.get(k) for k in LTI_PROPERTY_LIST}
            self.session = lti_session
            resource_link_id = params['resource_link_id']
            context_id = params['context_id']
            instance_guid = params['tool_consumer_instance_guid']
            name = params['resource_link_title']
            self.lti_context, created = LTIContext.objects.get_or_create(
                resource_link_id=resource_link_id,
                context_id=context_id,
                instance_guid=instance_guid
            )
            if self.lti_context.name != name:
                self.lti_context.name = name
                self.lti_context.save()
            request.session[self.session_key] = lti_session
        except LTIException:
            raise

    def _verify_session(self):
        if self.lti_context is None:
            raise LTIException("No matching LTI context.")
        if self.session_key not in self.request.session:
            raise LTINotInSessionException("LTI data not in session.")
        self.session = self.request.session[self.session_key]

    def _verify_any(self):
        try:
            self.verify_request()
        except LTIException:
            self._verify_session()

    @property
    def roles(self):
        return set(normalise_role(r) for r in self.session.get('roles','').split(','))

    def is_role(self, role):
        allowed_roles = LTI_ROLES.get(role,[role])

        allowed = set(normalise_role(r) for r in allowed_roles)

        is_user_allowed = set(allowed) & self.roles
        
        return bool(is_user_allowed)

    @property
    def is_instructor(self):
        return self.is_role('instructor')

    @property
    def resource_link_id(self):
        return self.session.get('resource_link_id','')

    @property
    def context(self):
        context,created = LTIContext.objects.get_or_create(resource_link_id=self.resource_link_id)
        return context
