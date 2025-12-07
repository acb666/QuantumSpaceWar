from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Guide

# 自定义用户管理界面
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'last_login')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-last_login',)
    
    # 添加自定义CSS
    class Media:
        css = {
            'all': ('css/admin.css',)
        }

# 注销默认的UserAdmin并注册自定义的UserAdmin
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass
admin.site.register(User, CustomUserAdmin)

# 自定义Guide管理界面
@admin.register(Guide)
class GuideAdmin(admin.ModelAdmin):
    # 列表视图优化
    list_display = ['title', 'author', 'category', 'views', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at', 'author', 'category']
    search_fields = ['title', 'content', 'author__username', 'tags']
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    list_per_page = 20
    actions_on_top = True
    actions_on_bottom = True
    
    # 详情页优化
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'content', 'author', 'category'),
            'classes': ('wide',),
        }),
        ('标签与统计', {
            'fields': ('tags', 'views'),
            'classes': ('wide', 'collapse'),
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('wide', 'collapse'),
            'description': '这些字段由系统自动生成，通常不需要手动修改。',
        }),
    )
    
    # 禁用某些字段的编辑
    readonly_fields = ('created_at', 'updated_at', 'views')
    
    # 搜索和过滤增强
    autocomplete_fields = ['author']  # 启用作者字段的自动完成
    
    # 添加自定义CSS
    class Media:
        css = {
            'all': ('css/admin.css',)
        }

# 自定义管理站点
admin.site.site_header = '量子太空杀攻略站 - 管理后台'
admin.site.site_title = '量子太空杀攻略站管理'
admin.site.index_title = '欢迎使用量子太空杀攻略站管理系统'
admin.site.site_url = '/'  # 设置首页链接

# 添加自定义CSS到整个admin站点
admin.site.login_template = 'admin/login.html'

# 创建一个自定义的base_site.html模板钩子
# 注意：在实际部署中，还需要创建或修改admin/base_site.html模板文件