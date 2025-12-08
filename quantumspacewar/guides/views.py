from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, F  # 添加F导入
from django.views.decorators.cache import cache_page
from django.utils import timezone
from datetime import timedelta
from django.db import models  # 添加models导入


from django.contrib.auth.forms import AuthenticationForm

from .models import Guide, ChatMessage
from .forms import RegisterForm, LoginForm, GuideForm

def home(request):
    """主页 - 显示所有攻略列表（支持搜索和分页）"""
    # 获取搜索参数
    search_query = request.GET.get('q', '')
    sort_by = request.GET.get('sort', '-created_at')
    
    # 基础查询集，使用select_related优化查询
    guides = Guide.objects.select_related('author')
    
    # 搜索功能
    if search_query:
        guides = guides.filter(
            Q(title__icontains=search_query) | 
            Q(content__icontains=search_query) |
            Q(author__username__icontains=search_query)
        )
    
    # 排序
    valid_sort_fields = ['-created_at', 'created_at', 'title', '-title']
    if sort_by in valid_sort_fields:
        guides = guides.order_by(sort_by)
    
    # 分页
    paginator = Paginator(guides, 10)  # 每页10条
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search_query': search_query,
        'sort_by': sort_by,
        'total_count': paginator.count
    }
    
    return render(request, 'home.html', context)

@cache_page(60 * 15)  # 缓存15分钟
def register(request):
    """用户注册（带缓存）"""
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            try:
                user = form.save()
                login(request, user)
                messages.success(request, f'🎉 欢迎注册成功，{user.username}! 开始分享你的量子战术吧！')
                return redirect('guides:home')
            except Exception as e:
                messages.error(request, f'注册失败：{str(e)}')
    else:
        form = RegisterForm()
    
    return render(request, 'register.html', {'form': form})

def user_login(request):
    """用户登录（增强安全性）"""
    if request.method == 'POST':
        form = LoginForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            
            # 检查用户是否活跃
            if not user.is_active:
                messages.error(request, '账号已被禁用，请联系管理员')
                return render(request, 'login.html', {'form': form})
            
            # 获取记住密码选项
            remember_me = form.cleaned_data.get('remember_me', False)
            
            # 设置会话过期时间
            if remember_me:
                # 记住密码：会话保持2周
                request.session.set_expiry(1209600)  # 2周 = 1209600秒
            else:
                # 不记住密码：浏览器关闭时会话过期
                request.session.set_expiry(0)
            
            login(request, user)
            
            # 更新最后登录时间
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            messages.success(request, f'👋 欢迎回来，{user.username}!')
            
            # 重定向到next参数或首页
            next_url = request.GET.get('next', 'home')
            if next_url and next_url.startswith('/'):
                return redirect(next_url)
            return redirect('guides:home')
        else:
            messages.error(request, '用户名或密码错误')
    else:
        form = LoginForm()
    
    return render(request, 'login.html', {'form': form})

def user_logout(request):
    """用户登出"""
    username = request.user.username if request.user.is_authenticated else '游客'
    logout(request)
    messages.info(request, f'{username}，您已成功退出登录 👋')
    return redirect('guides:home')

@login_required
def add_guide(request):
    """发布攻略（需登录，带防重复提交）"""
    if request.method == 'POST':
        form = GuideForm(request.POST)
        if form.is_valid():
            try:
                # 检查是否短时间内重复提交
                recent_guides = Guide.objects.filter(
                    author=request.user,
                    created_at__gte=timezone.now() - timedelta(minutes=1)
                )
                
                if recent_guides.exists():
                    messages.warning(request, '发布太频繁了，请稍后再试')
                    return render(request, 'add_guide.html', {'form': form})
                
                guide = form.save(commit=False)
                guide.author = request.user
                guide.save()
                
                messages.success(request, f'🚀 攻略《{guide.title}》发布成功！')
                return redirect('guides:guide_detail', pk=guide.pk)  # 确保使用guides:前缀
                
            except Exception as e:
                messages.error(request, f'发布失败：{str(e)}')
    else:
        form = GuideForm()
    
    return render(request, 'add_guide.html', {'form': form})

def guide_detail(request, pk):
    """攻略详情页"""
    try:
        guide = Guide.objects.select_related('author').get(pk=pk)
        
        # 增加浏览量（简单实现）
        if not request.session.get(f'viewed_guide_{pk}'):
            Guide.objects.filter(pk=pk).update(
                views=models.F('views') + 1
            )
            request.session[f'viewed_guide_{pk}'] = True
        
        context = {
            'guide': guide,
            'related_guides': Guide.objects.filter(
                author=guide.author
            ).exclude(pk=pk)[:5]
        }
        
        return render(request, 'guide_detail.html', context)
        
    except Guide.DoesNotExist:
        messages.error(request, '攻略不存在')
        return redirect('guides:home')

@login_required
def my_guides(request):
    """我的攻略列表"""
    guides = Guide.objects.filter(
        author=request.user
    ).order_by('-created_at')
    
    paginator = Paginator(guides, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'my_guides.html', {'page_obj': page_obj})

@login_required
def delete_guide(request, pk):
    """删除攻略"""
    if request.method == 'POST':
        try:
            guide = Guide.objects.get(pk=pk, author=request.user)
            title = guide.title
            guide.delete()
            messages.success(request, f'攻略《{title}》已删除')
        except Guide.DoesNotExist:
            messages.error(request, '攻略不存在或无权限删除')
    
    return redirect('guides:my_guides')


@login_required
def chat_room(request, room_name='general'):
    """聊天室页面"""
    # 获取最近的聊天消息（最多50条）
    messages = ChatMessage.objects.select_related('sender').filter(
        room_name=room_name
    ).order_by('-timestamp')[:50][::-1]  # 反转顺序，使最新的消息在底部
    
    # 获取所有活跃的聊天室
    active_rooms = ChatMessage.objects.values_list('room_name', flat=True).distinct()
    
    context = {
        'room_name': room_name,
        'messages': messages,
        'active_rooms': active_rooms,
    }
    
    return render(request, 'chat/chat_room.html', context)


@login_required
def send_message(request, room_name='general'):
    """发送聊天消息"""
    if request.method == 'POST':
        content = request.POST.get('content', '').strip()
        
        if content:
            # 创建新消息
            new_message = ChatMessage.objects.create(
                sender=request.user,
                content=content,
                room_name=room_name
            )
            
            # 返回新消息的HTML格式
            return render(request, 'chat/message_item.html', {
                'message': new_message,
                'is_current_user': True
            })
    
    # 如果请求无效，返回空响应
    return render(request, 'chat/message_item.html', {'message': None})


@login_required
def get_messages(request, room_name='general'):
    """获取最新的聊天消息（用于AJAX轮询）"""
    last_message_id = request.GET.get('last_id', 0)
    
    # 获取最新的消息
    new_messages = ChatMessage.objects.select_related('sender').filter(
        room_name=room_name,
        id__gt=last_message_id
    ).order_by('created_at')
    
    # 标记消息为已读
    if new_messages.exists():
        ChatMessage.objects.filter(
            id__in=new_messages.values_list('id', flat=True)
        ).update(is_read=True)
    
    # 获取所有活跃的聊天室
    active_rooms = ChatMessage.objects.values_list('room_name', flat=True).distinct()
    
    return render(request, 'chat/messages_list.html', {
        'messages': new_messages,
        'room_name': room_name,
        'active_rooms': active_rooms
    })


@login_required
def create_room(request):
    """创建新的聊天室"""
    if request.method == 'POST':
        room_name = request.POST.get('room_name', '').strip()
        
        if room_name:
            # 检查聊天室是否已存在
            if not ChatMessage.objects.filter(room_name=room_name).exists():
                # 创建一个空消息来初始化聊天室
                ChatMessage.objects.create(
                    sender=request.user,
                    content=f'聊天室 {room_name} 已创建',
                    room_name=room_name
                )
                return redirect('guides:chat_room', room_name=room_name)
            else:
                messages.error(request, '该聊天室名称已存在')
        else:
            messages.error(request, '聊天室名称不能为空')
    
    return redirect('guides:chat_room')