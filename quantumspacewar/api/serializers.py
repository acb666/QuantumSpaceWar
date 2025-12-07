from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from guides.models import Guide, ChatMessage

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """用户序列化器"""
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')

class UserRegisterSerializer(serializers.ModelSerializer):
    """用户注册序列化器"""
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name')
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False}
        }
    
    def validate(self, attrs):
        """验证数据"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("两次密码输入不一致")
        
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError("用户名已存在")
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError("邮箱已被注册")
        
        return attrs
    
    def create(self, validated_data):
        """创建用户"""
        validated_data.pop('password_confirm')
        validated_data['password'] = make_password(validated_data['password'])
        return User.objects.create(**validated_data)

class GuideListSerializer(serializers.ModelSerializer):
    """攻略列表序列化器"""
    author = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Guide
        fields = (
            'id', 'title', 'content', 'category', 'tags', 
            'author', 'created_at', 'updated_at', 'views', 
            'likes_count', 'is_liked', 'cover_image'
        )
    
    def get_likes_count(self, obj):
        return obj.liked_by.count()
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.liked_by.filter(id=request.user.id).exists()
        return False

class GuideSerializer(serializers.ModelSerializer):
    """攻略详情序列化器"""
    author = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Guide
        fields = (
            'id', 'title', 'content', 'category', 'tags', 
            'author', 'created_at', 'updated_at', 'views', 
            'liked_by', 'likes_count', 'is_liked', 'cover_image'
        )
        read_only_fields = ('created_at', 'updated_at', 'views', 'liked_by')
    
    def get_likes_count(self, obj):
        return obj.liked_by.count()
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.liked_by.filter(id=request.user.id).exists()
        return False

class ChatMessageSerializer(serializers.ModelSerializer):
    """聊天消息序列化器"""
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ('id', 'sender', 'content', 'timestamp', 'room_name')
        read_only_fields = ('id', 'timestamp')

class SendMessageSerializer(serializers.Serializer):
    """发送消息序列化器"""
    message = serializers.CharField(max_length=1000)
    room_name = serializers.CharField(max_length=50)
    
    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError("消息内容不能为空")
        return value.strip()
    
    def validate_room_name(self, value):
        valid_rooms = ['general', 'strategy', 'newbie', 'team']
        if value not in valid_rooms:
            raise serializers.ValidationError(f"无效的聊天室名称，有效值: {', '.join(valid_rooms)}")
        return value

class ChatRoomSerializer(serializers.Serializer):
    """聊天室序列化器"""
    name = serializers.CharField()
    display_name = serializers.CharField()
    description = serializers.CharField()
    online_users = serializers.IntegerField()