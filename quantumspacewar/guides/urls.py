from django.urls import path
from . import views

app_name = 'guides'

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('add_guide/', views.add_guide, name='add_guide'),
    path('guide/<int:pk>/', views.guide_detail, name='guide_detail'),
    path('my_guides/', views.my_guides, name='my_guides'),
    path('guide/<int:pk>/delete/', views.delete_guide, name='delete_guide'),
    # 聊天相关URL
    path('chat/', views.chat_room, name='chat_room'),
    path('chat/create/', views.create_room, name='create_room'),
    path('chat/<str:room_name>/', views.chat_room, name='chat_room_with_name'),
    path('chat/<str:room_name>/send/', views.send_message, name='send_message'),
    path('chat/<str:room_name>/get_messages/', views.get_messages, name='get_messages'),
]



