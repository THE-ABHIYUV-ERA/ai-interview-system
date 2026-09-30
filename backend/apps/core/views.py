from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection

@api_view(['GET'])
def health_check(request):
    return Response({"status": "ok", "service": "ai-interview-backend"})

@api_view(['GET'])
def database_health_check(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return Response({"status": "ok", "database": "postgresql"})
    except Exception:
        return Response({"status": "error", "database": "postgresql", "message": "Database unavailable"}, status=503)
