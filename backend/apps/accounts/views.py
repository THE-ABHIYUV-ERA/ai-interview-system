from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.conf import settings
import requests

from .serializers import UserSerializer, RegisterSerializer

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": tokens["access"],
            "refresh": tokens["refresh"]
        }, status=status.HTTP_201_CREATED)

class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


# OAuth Views

class GoogleLogin(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        token = request.data.get('token') # Code or Access token, depending on frontend flow
        # In this simple implementation we'll expect the frontend to pass an access_token 
        # or we can exchange the code here. Let's assume frontend sends access_token for simplicity, 
        # or code which we need to exchange.
        # Actually, standard flow: frontend gets 'code', backend exchanges it.
        code = request.data.get('code')
        if not code:
            return Response({"error": "Code is required"}, status=400)
            
        redirect_uri = getattr(settings, 'CORS_ALLOWED_ORIGINS', ['http://localhost:3000'])[0] + '/auth/callback/google'
        
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": getattr(settings, 'GOOGLE_CLIENT_ID', ''),
            "client_secret": getattr(settings, 'GOOGLE_CLIENT_SECRET', ''),
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        
        response = requests.post(token_url, data=data)
        if not response.ok:
            return Response({"error": "Failed to obtain token from Google"}, status=400)
            
        access_token = response.json().get('access_token')
        
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        user_info = requests.get(user_info_url, headers={"Authorization": f"Bearer {access_token}"}).json()
        
        email = user_info.get('email')
        if not email:
            return Response({"error": "Email not provided by Google"}, status=400)
            
        user, created = User.objects.get_or_create(email=email, defaults={
            'name': user_info.get('name', ''),
            'avatar': user_info.get('picture', '')
        })
        
        tokens = get_tokens_for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": tokens["access"],
            "refresh": tokens["refresh"]
        })

class GithubLogin(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({"error": "Code is required"}, status=400)
            
        token_url = "https://github.com/login/oauth/access_token"
        data = {
            "client_id": getattr(settings, 'GITHUB_CLIENT_ID', ''),
            "client_secret": getattr(settings, 'GITHUB_CLIENT_SECRET', ''),
            "code": code
        }
        headers = {'Accept': 'application/json'}
        
        response = requests.post(token_url, data=data, headers=headers)
        if not response.ok:
            return Response({"error": "Failed to obtain token from GitHub"}, status=400)
            
        access_token = response.json().get('access_token')
        if not access_token:
            return Response({"error": "No access token from GitHub"}, status=400)
            
        user_url = "https://api.github.com/user"
        user_info = requests.get(user_url, headers={"Authorization": f"token {access_token}"}).json()
        
        email = user_info.get('email')
        if not email:
            # fetch emails
            emails_url = "https://api.github.com/user/emails"
            emails = requests.get(emails_url, headers={"Authorization": f"token {access_token}"}).json()
            for e in emails:
                if e.get('primary') and e.get('verified'):
                    email = e.get('email')
                    break
                    
        if not email:
            return Response({"error": "No verified email found on GitHub"}, status=400)
            
        user, created = User.objects.get_or_create(email=email, defaults={
            'name': user_info.get('name') or user_info.get('login', ''),
            'avatar': user_info.get('avatar_url', '')
        })
        
        tokens = get_tokens_for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": tokens["access"],
            "refresh": tokens["refresh"]
        })
