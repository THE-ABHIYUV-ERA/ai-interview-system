from rest_framework import permissions

class IsCandidateOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.candidate == request.user
