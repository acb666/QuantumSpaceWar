# emergency_fix.py
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
GUIDES_TEMPLATES = BASE_DIR / 'guides' / 'templates'
TARGET_FILE = GUIDES_TEMPLATES / 'add_guide.html'

# 1. 强制创建目录
GUIDES_TEMPLATES.mkdir(parents=True, exist_ok=True)
print(f"✅ 目录已创建/确认: {GUIDES_TEMPLATES}")

# 2. 写入模板内容（覆盖旧文件，防止编码问题）
TEMPLATE_CONTENT = '''{% extends 'base.html' %}

{% block title %}发布攻略 - 量子太空杀攻略站{% endblock %}

{% block content %}
<div class="card" style="max-width: 800px; margin: 0 auto;">
    <h1 style="margin-bottom: 2rem;">✍️ 发布新攻略</h1>
    
    <form method="post">
        {% csrf_token %}
        
        <div class="form-group">
            <label for="{{ form.title.id_for_label }}">{{ form.title.label }}</label>
            {{ form.title }}
            {% if form.title.errors %}
                <div class="error">{{ form.title.errors }}</div>
            {% endif %}
        </div>
        
        <div class="form-group">
            <label for="{{ form.content.id_for_label }}">{{ form.content.label }}</label>
            {{ form.content }}
            {% if form.content.errors %}
                <div class="error">{{ form.content.errors }}</div>
            {% endif %}
        </div>
        
        <div style="display: flex; gap: 1rem;">
            <button type="submit" class="btn">发布攻略</button>
            <a href="{% url 'home' %}" class="btn" style="background: #95a5a6;">返回首页</a>
        </div>
    </form>
</div>
{% endblock %}
'''

TARGET_FILE.write_text(TEMPLATE_CONTENT, encoding='utf-8')
print(f"✅ 模板已强制写入: {TARGET_FILE}")

# 3. 验证文件存在并显示绝对路径
if TARGET_FILE.exists():
    print(f"\n🎉 修复成功！文件绝对路径：")
    print(f"   {TARGET_FILE.absolute()}")
    print(f"\n文件大小: {TARGET_FILE.stat().st_size} 字节")
else:
    print("\n❌ 致命错误：文件写入失败")
    sys.exit(1)

# 4. 列出 guides/templates 目录内容
print(f"\n📂 当前 guides/templates 目录内容：")
for f in GUIDES_TEMPLATES.iterdir():
    print(f"   - {f.name}")

# 5. 提醒重启
print("\n⚠️  现在必须重启 Django 服务器：")
print("   按 Ctrl+C 停止，然后运行: python manage.py runserver")