from django.test import TestCase
from django.contrib.auth.models import User
from .models import Guide

class GuideModelTest(TestCase):
    def test_guide_creation(self):
        user = User.objects.create_user(username='testuser', password='123456')
        guide = Guide.objects.create(
            title='测试攻略',
            content='测试内容',
            author=user
        )
        self.assertEqual(guide.title, '测试攻略')
        self.assertEqual(guide.author, user)

class ViewTest(TestCase):
    def test_home_page(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)