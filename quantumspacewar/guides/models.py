from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Guide(models.Model):
    """攻略模型"""
    CATEGORY_CHOICES = [
        ('beginner', '新手入门'),
        ('strategy', '进阶攻略'),
        ('advanced', '高级技巧'),
        ('character', '角色分析'),
        ('equipment', '装备指南'),
        ('team', '团队配合'),
        ('other', '其他')
    ]
    
    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='作者')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other', verbose_name='分类')
    tags = models.CharField(max_length=500, blank=True, verbose_name='标签')
    views = models.PositiveIntegerField(default=0, verbose_name='浏览量')
    liked_by = models.ManyToManyField(User, related_name='liked_guides', blank=True, verbose_name='点赞用户')
    cover_image = models.URLField(max_length=500, blank=True, verbose_name='封面图片')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '攻略'
        verbose_name_plural = '攻略'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def likes_count(self):
        return self.liked_by.count()

class ChatMessage(models.Model):
    """聊天消息模型"""
    ROOM_CHOICES = [
        ('general', '综合讨论'),
        ('strategy', '攻略交流'),
        ('newbie', '新手指导'),
        ('team', '组队开黑')
    ]
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='发送者')
    content = models.TextField(max_length=1000, verbose_name='内容')
    room_name = models.CharField(max_length=50, choices=ROOM_CHOICES, default='general', verbose_name='聊天室')
    timestamp = models.DateTimeField(default=timezone.now, verbose_name='发送时间')
    
    class Meta:
        verbose_name = '聊天消息'
        verbose_name_plural = '聊天消息'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f'{self.sender.username}: {self.content[:50]}'

class UserProfile(models.Model):
    """用户扩展资料模型"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name='用户')
    avatar = models.URLField(max_length=500, blank=True, verbose_name='头像')
    bio = models.TextField(max_length=500, blank=True, verbose_name='个人简介')
    level = models.PositiveIntegerField(default=1, verbose_name='等级')
    experience = models.PositiveIntegerField(default=0, verbose_name='经验值')
    games_played = models.PositiveIntegerField(default=0, verbose_name='游戏场次')
    wins = models.PositiveIntegerField(default=0, verbose_name='胜利场次')
    
    class Meta:
        verbose_name = '用户资料'
        verbose_name_plural = '用户资料'
    
    def __str__(self):
        return f'{self.user.username} 的资料'
    
    @property
    def win_rate(self):
        if self.games_played > 0:
            return round((self.wins / self.games_played) * 100, 2)
        return 0.00