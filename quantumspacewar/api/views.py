from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone

from guides.models import Guide, ChatMessage
from .serializers import (
    GuideSerializer, GuideListSerializer, UserSerializer, 
    UserRegisterSerializer, ChatMessageSerializer, ChatRoomSerializer
)
from .permissions import IsOwnerOrReadOnly

class GuideViewSet(viewsets.ModelViewSet):
    """
    攻略视图集
    提供攻略的CRUD操作
    """
    queryset = Guide.objects.all()
    serializer_class = GuideSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'author']
    search_fields = ['title', 'content', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'views', 'liked_by']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return GuideListSerializer
        return GuideSerializer
    
    def get_queryset(self):
        queryset = Guide.objects.select_related('author').prefetch_related('liked_by')
        
        # 搜索功能
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(content__icontains=search_query) |
                Q(tags__icontains=search_query)
            )
        
        # 分类筛选
        category = self.request.query_params.get('category', None)
        if category and category != '全部':
            queryset = queryset.filter(category=category)
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """获取攻略详情时增加浏览量"""
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """点赞攻略"""
        guide = self.get_object()
        user = request.user
        
        if guide.liked_by.filter(id=user.id).exists():
            guide.liked_by.remove(user)
            message = '取消点赞成功'
        else:
            guide.liked_by.add(user)
            message = '点赞成功'
        
        return Response({
            'message': message,
            'likes_count': guide.liked_by.count(),
            'is_liked': guide.liked_by.filter(id=user.id).exists()
        })
    
    @action(detail=False, methods=['get'])
    def my_guides(self, request):
        """获取当前用户的攻略"""
        queryset = self.get_queryset().filter(author=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class GuideByCategoryView(APIView):
    """按分类获取攻略"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, category):
        guides = Guide.objects.filter(category=category).order_by('-created_at')
        serializer = GuideListSerializer(guides, many=True)
        return Response(serializer.data)

class GuideSearchView(APIView):
    """搜索攻略"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        search_query = request.query_params.get('q', '')
        if not search_query:
            return Response({'results': []})
        
        guides = Guide.objects.filter(
            Q(title__icontains=search_query) |
            Q(content__icontains=search_query) |
            Q(tags__icontains=search_query)
        ).order_by('-created_at')
        
        serializer = GuideListSerializer(guides, many=True)
        return Response({'results': serializer.data})

class UserLoginView(APIView):
    """用户登录"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        remember_me = request.data.get('remember_me', False)
        
        if not username or not password:
            return Response(
                {'error': '用户名和密码不能为空'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            
            # 设置会话过期时间
            if remember_me:
                request.session.set_expiry(1209600)  # 2周
            else:
                request.session.set_expiry(0)  # 浏览器关闭时过期
            
            # 获取或创建token
            from rest_framework.authtoken.models import Token
            token, created = Token.objects.get_or_create(user=user)
            
            user_serializer = UserSerializer(user)
            return Response({
                'success': True,
                'token': token.key,
                'user': user_serializer.data,
                'message': '登录成功'
            })
        else:
            return Response(
                {'error': '用户名或密码错误'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

class UserRegisterView(APIView):
    """用户注册"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # 获取或创建token
            from rest_framework.authtoken.models import Token
            token, created = Token.objects.get_or_create(user=user)
            
            user_serializer = UserSerializer(user)
            return Response({
                'success': True,
                'token': token.key,
                'user': user_serializer.data,
                'message': '注册成功'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLogoutView(APIView):
    """用户登出"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # 删除token
            request.user.auth_token.delete()
        except:
            pass
        
        logout(request)
        return Response({'message': '登出成功'})

class UserProfileView(APIView):
    """用户资料"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class ChatRoomListView(APIView):
    """聊天室列表"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        rooms = [
            {
                'name': 'general',
                'display_name': '综合讨论',
                'description': '游戏综合讨论区',
                'online_users': 0  # TODO: 实现实时在线人数统计
            },
            {
                'name': 'strategy',
                'display_name': '攻略交流',
                'description': '游戏攻略分享与交流',
                'online_users': 0
            },
            {
                'name': 'newbie',
                'display_name': '新手指导',
                'description': '新手入门指导与帮助',
                'online_users': 0
            },
            {
                'name': 'team',
                'display_name': '组队开黑',
                'description': '寻找队友一起游戏',
                'online_users': 0
            }
        ]
        
        serializer = ChatRoomSerializer(rooms, many=True)
        return Response(serializer.data)

class ChatHistoryView(APIView):
    """聊天记录"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, room_name):
        page = int(request.query_params.get('page', 1))
        page_size = 20
        
        messages = ChatMessage.objects.filter(
            room_name=room_name
        ).order_by('-timestamp')[(page-1)*page_size:page*page_size]
        
        serializer = ChatMessageSerializer(messages, many=True)
        return Response({
            'results': serializer.data,
            'has_next': len(messages) == page_size
        })

class SendMessageView(APIView):
    """发送消息"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        if serializer.is_valid():
            message = ChatMessage.objects.create(
                sender=request.user,
                content=serializer.validated_data['message'],
                room_name=serializer.validated_data['room_name']
            )
            
            # TODO: 通过WebSocket广播消息
            
            return Response({
                'success': True,
                'message': '消息发送成功',
                'data': ChatMessageSerializer(message).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChatViewSet(viewsets.ViewSet):
    """聊天相关视图集"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def rooms(self, request):
        """获取聊天室列表"""
        return ChatRoomListView().get(request)
    
    @action(detail=False, methods=['post'])
    def send(self, request):
        """发送消息"""
        return SendMessageView().post(request)