# API URL配置
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken import views as auth_views
from . import views

router = DefaultRouter()
router.register(r'guides', views.GuideViewSet)

urlpatterns = [
    # 认证相关
    path('auth/login/', views.UserLoginView.as_view(), name='user_login'),
    path('auth/register/', views.UserRegisterView.as_view(), name='user_register'),
    path('auth/logout/', views.UserLogoutView.as_view(), name='user_logout'),
    path('auth/profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('auth/token/', auth_views.obtain_auth_token, name='api_token_auth'),
    
    # 攻略相关
    path('guides/category/<str:category>/', views.GuideByCategoryView.as_view(), name='guides_by_category'),
    path('guides/search/', views.GuideSearchView.as_view(), name='guide_search'),
    
    # 聊天相关
    path('chat/rooms/', views.ChatRoomListView.as_view(), name='chat_rooms'),
    path('chat/history/<str:room_name>/', views.ChatHistoryView.as_view(), name='chat_history'),
    path('chat/send/', views.SendMessageView.as_view(), name='send_message'),
    
    # 使用router的URL
    path('', include(router.urls)),
]