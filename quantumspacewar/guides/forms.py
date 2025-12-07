from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import authenticate  # 添加这行导入
from django.core.exceptions import ValidationError
from .models import Guide
import re

class RegisterForm(forms.ModelForm):
    """用户注册表单（增强版）"""
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': '请输入密码（至少6位）',
            'class': 'form-control'
        }),
        min_length=6,
        label='密码',
        help_text='密码长度至少6位，建议包含字母和数字'
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': '请再次输入密码',
            'class': 'form-control'
        }),
        min_length=6,
        label='确认密码'
    )
    
    class Meta:
        model = User
        fields = ['username', 'email']
        widgets = {
            'username': forms.TextInput(attrs={
                'placeholder': '请输入用户名（3-20位）',
                'class': 'form-control'
            }),
            'email': forms.EmailInput(attrs={
                'placeholder': '请输入邮箱地址',
                'class': 'form-control'
            }),
        }
        labels = {
            'username': '用户名',
            'email': '邮箱地址',
        }
        help_texts = {
            'username': '3-20位字符，只能包含字母、数字和下划线',
        }
    
    def clean_username(self):
        username = self.cleaned_data.get('username')
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', username):
            raise ValidationError('用户名格式不正确，只能包含字母、数字和下划线，长度3-20位')
        if User.objects.filter(username=username).exists():
            raise ValidationError('用户名已存在')
        return username
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise ValidationError('邮箱已被注册')
        return email
    
    def clean_confirm_password(self):
        password = self.cleaned_data.get('password')
        confirm_password = self.cleaned_data.get('confirm_password')
        if password and confirm_password and password != confirm_password:
            raise ValidationError('两次输入的密码不一致')
        return confirm_password
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])
        if commit:
            user.save()
        return user

class LoginForm(AuthenticationForm):
    """用户登录表单（增强版）"""
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            'placeholder': '请输入用户名',
            'class': 'form-control',
            'autofocus': True
        }),
        label='用户名'
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': '请输入密码',
            'class': 'form-control'
        }),
        label='密码'
    )
    remember_me = forms.BooleanField(
        required=False,
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input'
        }),
        label='记住密码'
    )
    
    def clean(self):
        username = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')
        
        if username and password:
            self.user_cache = authenticate(
                self.request,
                username=username,
                password=password
            )
            if self.user_cache is None:
                raise ValidationError('用户名或密码错误')
            elif not self.user_cache.is_active:
                raise ValidationError('账号已被禁用')
        return self.cleaned_data

class GuideForm(forms.ModelForm):
    """发布攻略表单（增强版）"""
    class Meta:
        model = Guide
        fields = ['title', 'content', 'category', 'tags']
        widgets = {
            'title': forms.TextInput(attrs={
                'placeholder': '请输入攻略标题（简洁明了）',
                'class': 'form-control'
            }),
            'content': forms.Textarea(attrs={
                'placeholder': '请输入详细的攻略内容，支持Markdown格式',
                'class': 'form-control',
                'rows': 12
            }),
            'category': forms.Select(attrs={
                'class': 'form-control'
            }),
            'tags': forms.TextInput(attrs={
                'placeholder': '标签1, 标签2, 标签3（用逗号分隔）',
                'class': 'form-control'
            }),
        }
        labels = {
            'title': '攻略标题',
            'content': '攻略内容',
            'category': '攻略分类',
            'tags': '标签',
        }
        help_texts = {
            'title': '建议标题长度在10-50字之间',
            'content': '详细的攻略内容，可以包含战术分析、操作步骤等',
            'tags': '添加相关标签，方便其他玩家搜索',
        }
    
    def clean_title(self):
        title = self.cleaned_data.get('title')
        if len(title) < 5:
            raise ValidationError('标题太短了，至少需要5个字符')
        if len(title) > 200:
            raise ValidationError('标题太长了，不能超过200个字符')
        
        # 检查是否重复发布相同标题
        if Guide.objects.filter(title=title).exists():
            raise ValidationError('已存在相同标题的攻略')
        
        return title
    
    def clean_content(self):
        content = self.cleaned_data.get('content')
        if len(content) < 20:
            raise ValidationError('内容太短了，至少需要20个字符')
        if len(content) > 10000:
            raise ValidationError('内容太长了，不能超过10000个字符')
        return content
    
    def clean_tags(self):
        tags = self.cleaned_data.get('tags')
        if tags:
            tags_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
            if len(tags_list) > 10:
                raise ValidationError('标签不能超过10个')
            for tag in tags_list:
                if len(tag) > 20:
                    raise ValidationError(f'标签"{tag}"太长了，不能超过20个字符')
        return tags