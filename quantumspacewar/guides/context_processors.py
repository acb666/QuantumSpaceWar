from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from .models import Guide

def global_stats(request):
    """全局统计数据上下文处理器，为所有模板提供统一的统计信息"""
    # 计算总攻略数
    total_guides = Guide.objects.count()
    
    # 计算活跃用户数（最近30天内登录的用户）
    thirty_days_ago = timezone.now() - timedelta(days=30)
    active_users = User.objects.filter(last_login__gte=thirty_days_ago).count()
    
    return {
        'total_guides': total_guides,
        'active_users': active_users
    }