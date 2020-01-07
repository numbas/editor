import re

re_sub_delims = r'[!$&\'()*+,;=]'
re_pct_encoded = r'%[0-9A-FA-F]{2}'
re_unreserved = r'[0-9A-Za-z\-._~]'
re_pchar = r'(?:{unreserved}|{pct_encoded}|{sub_delims}|:|@)'.format(unreserved=re_unreserved,pct_encoded=re_pct_encoded,sub_delims=re_sub_delims)
re_alphanum = '[0-9a-zA-Z]'
re_ldh = r'{alphanum}|-'.format(alphanum=re_alphanum)
re_nss = r'{pchar}(?:{pchar}|/)*'.format(pchar=re_pchar)
re_nid = r'{alphanum}({ldh}){{0,30}}{alphanum}'.format(alphanum=re_alphanum,ldh=re_ldh)
re_urn = r'^urn:(?P<NID>{NID}):(?P<NSS>{NSS})'.format(NID=re_nid,NSS=re_nss)

def parse_urn(urn):
    m = re.match(re_urn,urn)
    return m.groupdict() if m else None

re_imsrole = re.compile(r'(?P<roletype>role|sysrole|instrole):ims/lis/(?P<role>.*)')

LTI_ROLES = {
  "SysAdmin": "urn:lti:sysrole:ims/lis/SysAdmin",
  "SysSupport": "urn:lti:sysrole:ims/lis/SysSupport",
  "Creator": "urn:lti:sysrole:ims/lis/Creator",
  "AccountAdmin": "urn:lti:sysrole:ims/lis/AccountAdmin",
  "User": "urn:lti:sysrole:ims/lis/User",
  "Administrator": "urn:lti:role:ims/lis/Administrator",
  "None": "urn:lti:instrole:ims/lis/None",
  "Student": "urn:lti:instrole:ims/lis/Student",
  "Faculty": "urn:lti:instrole:ims/lis/Faculty",
  "Member": "urn:lti:role:ims/lis/Member",
  "Learner": "urn:lti:role:ims/lis/Learner",
  "Instructor": "urn:lti:role:ims/lis/Instructor",
  "Mentor": "urn:lti:role:ims/lis/Mentor",
  "Staff": "urn:lti:instrole:ims/lis/Staff",
  "Alumni": "urn:lti:instrole:ims/lis/Alumni",
  "ProspectiveStudent": "urn:lti:instrole:ims/lis/ProspectiveStudent",
  "Guest": "urn:lti:instrole:ims/lis/Guest",
  "Other": "urn:lti:instrole:ims/lis/Other",
  "Observer": "urn:lti:instrole:ims/lis/Observer",
  "Learner/Learner": "urn:lti:role:ims/lis/Learner/Learner",
  "Learner/NonCreditLearner": "urn:lti:role:ims/lis/Learner/NonCreditLearner",
  "Learner/GuestLearner": "urn:lti:role:ims/lis/Learner/GuestLearner",
  "Learner/ExternalLearner": "urn:lti:role:ims/lis/Learner/ExternalLearner",
  "Learner/Instructor": "urn:lti:role:ims/lis/Learner/Instructor",
  "Instructor/PrimaryInstructor": "urn:lti:role:ims/lis/Instructor/PrimaryInstructor",
  "Instructor/Lecturer": "urn:lti:role:ims/lis/Instructor/Lecturer",
  "Instructor/GuestInstructor": "urn:lti:role:ims/lis/Instructor/GuestInstructor",
  "Instructor/ExternalInstructor": "urn:lti:role:ims/lis/Instructor/ExternalInstructor",
  "ContentDeveloper": "urn:lti:role:ims/lis/ContentDeveloper",
  "ContentDeveloper/ContentDeveloper": "urn:lti:role:ims/lis/ContentDeveloper/ContentDeveloper",
  "ContentDeveloper/Librarian": "urn:lti:role:ims/lis/ContentDeveloper/Librarian",
  "ContentDeveloper/ContentExpert": "urn:lti:role:ims/lis/ContentDeveloper/ContentExpert",
  "ContentDeveloper/ExternalContentExpert": "urn:lti:role:ims/lis/ContentDeveloper/ExternalContentExpert",
  "Member/Member": "urn:lti:role:ims/lis/Member/Member",
  "Manager": "urn:lti:role:ims/lis/Manager",
  "Manager/AreaManager": "urn:lti:role:ims/lis/Manager/AreaManager",
  "Manager/CourseCoordinator": "urn:lti:role:ims/lis/Manager/CourseCoordinator",
  "Manager/Observer": "urn:lti:role:ims/lis/Manager/Observer",
  "Manager/ExternalObserver": "urn:lti:role:ims/lis/Manager/ExternalObserver",
  "Mentor/Mentor": "urn:lti:role:ims/lis/Mentor/Mentor",
  "Mentor/Reviewer": "urn:lti:role:ims/lis/Mentor/Reviewer",
  "Mentor/Advisor": "urn:lti:role:ims/lis/Mentor/Advisor",
  "Mentor/Auditor": "urn:lti:role:ims/lis/Mentor/Auditor",
  "Mentor/Tutor": "urn:lti:role:ims/lis/Mentor/Tutor",
  "Mentor/LearningFacilitator": "urn:lti:role:ims/lis/Mentor/LearningFacilitator",
  "Mentor/ExternalMentor": "urn:lti:role:ims/lis/Mentor/ExternalMentor",
  "Mentor/ExternalReviewer": "urn:lti:role:ims/lis/Mentor/ExternalReviewer",
  "Mentor/ExternalAdvisor": "urn:lti:role:ims/lis/Mentor/ExternalAdvisor",
  "Mentor/ExternalAuditor": "urn:lti:role:ims/lis/Mentor/ExternalAuditor",
  "Mentor/ExternalTutor": "urn:lti:role:ims/lis/Mentor/ExternalTutor",
  "Mentor/ExternalLearningFacilitator": "urn:lti:role:ims/lis/Mentor/ExternalLearningFacilitator",
  "Administrator/Administrator": "urn:lti:role:ims/lis/Administrator/Administrator",
  "Administrator/Support": "urn:lti:role:ims/lis/Administrator/Support",
  "Administrator/Developer": "urn:lti:role:ims/lis/Administrator/Developer",
  "Administrator/SystemAdministrator": "urn:lti:role:ims/lis/Administrator/SystemAdministrator",
  "Administrator/ExternalSystemAdministrator": "urn:lti:role:ims/lis/Administrator/ExternalSystemAdministrator",
  "Administrator/ExternalDeveloper": "urn:lti:role:ims/lis/Administrator/ExternalDeveloper",
  "Administrator/ExternalSupport": "urn:lti:role:ims/lis/Administrator/ExternalSupport",
  "TeachingAssistant": "urn:lti:role:ims/lis/TeachingAssistant",
  "TeachingAssistant/TeachingAssistant": "urn:lti:role:ims/lis/TeachingAssistant/TeachingAssistant",
  "TeachingAssistant/TeachingAssistantSection": "urn:lti:role:ims/lis/TeachingAssistant/TeachingAssistantSection",
  "TeachingAssistnat/TeachingAssistantSectionAssociation": "urn:lti:role:ims/lis/TeachingAssistant/TeachingAssistantSectionAssociation",
  "TeachingAssistant/TeachingAssistantOffering": "urn:lti:role:ims/lis/TeachingAssistant/TeachingAssistantOffering",
  "TeachingAssistant/TeachingAssistantTemplate": "urn:lti:role:ims/lis/TeachingAssistant/TeachingAssistantTemplate",
  "TeachingAssistant/TeachingAssistantGroup": "urn:lti:role:ims/lis/TeachingAssistant/TeachingAssistantGroup",
  "TeachingAssistant/Grader": "urn:lti:role:ims/lis/TeachingAssistant/Grader"
}



def normalise_role(role):
    """
        Normalise a role name, returning the fully-qualified URN for the role.
        If `role` is not one of the LTI standard roles, it's returned unmodified.
    """
    if parse_urn(role):
        return role
    m = re_imsrole.match(role)
    if m:
        return 'urn:lti:'+role
    elif role in LTI_ROLES:
        return LTI_ROLES[role]
    else:
        return role

def parse_role(urn):
    """ 
        If `urn` is a role defined in the LTI standard vocabularies, return its handle (the short part).
        The LTI standard vocabularies are defined at http://www.imsglobal.org/specs/ltiv1p1p1/implementation-guide#toc-8
        If not, `urn` is returned unmodified (it's not necessarily a urn)
    """
    urn = normalise_role(urn)
    m_urn = parse_urn(urn)
    if not m_urn:
        return urn
    nss = m_urn['NSS']
    m_nss = re_imsrole.match(nss)
    if not m_nss:
        return urn
    return m_nss.group('role')
