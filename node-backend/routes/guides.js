const express = require('express');
const { Guide } = require('../models');
const { authenticateToken: authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 获取所有攻略
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, difficulty, search } = req.query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    let query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const guides = await Guide.find(query)
      .populate('author', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Guide.countDocuments(query);

    res.json({
      success: true,
      data: {
        guides,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取攻略列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 获取单个攻略详情
router.get('/:id', async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id)
      .populate('author', 'username firstName lastName')
      .populate('comments.author', 'username firstName lastName');

    if (!guide) {
      return res.status(404).json({ 
        success: false, 
        message: '攻略不存在' 
      });
    }

    // 增加浏览次数
    guide.views += 1;
    await guide.save();

    res.json({
      success: true,
      data: { guide }
    });
  } catch (error) {
    console.error('获取攻略详情错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 创建新攻略
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, category, difficulty, tags, gameVersion } = req.body;

    // 验证输入
    if (!title || !content || !category) {
      return res.status(400).json({ 
        success: false, 
        message: '标题、内容和分类是必填项' 
      });
    }

    const guide = new Guide({
      title,
      content,
      category,
      difficulty: difficulty || 'medium',
      tags: tags || [],
      gameVersion: gameVersion || '',
      author: req.user.userId,
      views: 0,
      likes: 0,
      comments: []
    });

    await guide.save();
    await guide.populate('author', 'username firstName lastName');

    res.status(201).json({
      success: true,
      message: '攻略创建成功',
      data: { guide }
    });
  } catch (error) {
    console.error('创建攻略错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 更新攻略
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content, category, difficulty, tags, gameVersion } = req.body;
    const guideId = req.params.id;
    const userId = req.user.userId;

    const guide = await Guide.findById(guideId);

    if (!guide) {
      return res.status(404).json({ 
        success: false, 
        message: '攻略不存在' 
      });
    }

    // 检查是否是作者
    if (guide.author.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限修改此攻略' 
      });
    }

    // 更新攻略信息
    if (title !== undefined) guide.title = title;
    if (content !== undefined) guide.content = content;
    if (category !== undefined) guide.category = category;
    if (difficulty !== undefined) guide.difficulty = difficulty;
    if (tags !== undefined) guide.tags = tags;
    if (gameVersion !== undefined) guide.gameVersion = gameVersion;

    guide.updatedAt = new Date();
    await guide.save();
    await guide.populate('author', 'username firstName lastName');

    res.json({
      success: true,
      message: '攻略更新成功',
      data: { guide }
    });
  } catch (error) {
    console.error('更新攻略错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 删除攻略
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const guideId = req.params.id;
    const userId = req.user.userId;

    const guide = await Guide.findById(guideId);

    if (!guide) {
      return res.status(404).json({ 
        success: false, 
        message: '攻略不存在' 
      });
    }

    // 检查是否是作者
    if (guide.author.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限删除此攻略' 
      });
    }

    await Guide.findByIdAndDelete(guideId);

    res.json({
      success: true,
      message: '攻略删除成功'
    });
  } catch (error) {
    console.error('删除攻略错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 点赞攻略
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const guideId = req.params.id;
    const userId = req.user.userId;

    const guide = await Guide.findById(guideId);

    if (!guide) {
      return res.status(404).json({ 
        success: false, 
        message: '攻略不存在' 
      });
    }

    // 检查用户是否已经点赞
    const hasLiked = guide.likedBy.includes(userId);

    if (hasLiked) {
      // 取消点赞
      guide.likedBy.pull(userId);
      guide.likes -= 1;
    } else {
      // 点赞
      guide.likedBy.push(userId);
      guide.likes += 1;
    }

    await guide.save();

    res.json({
      success: true,
      message: hasLiked ? '已取消点赞' : '点赞成功',
      data: { 
        likes: guide.likes,
        hasLiked: !hasLiked
      }
    });
  } catch (error) {
    console.error('点赞攻略错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 添加评论
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const guideId = req.params.id;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '评论内容不能为空' 
      });
    }

    const guide = await Guide.findById(guideId);

    if (!guide) {
      return res.status(404).json({ 
        success: false, 
        message: '攻略不存在' 
      });
    }

    const comment = {
      author: userId,
      content: content.trim(),
      createdAt: new Date()
    };

    guide.comments.push(comment);
    await guide.save();

    // 重新获取攻略以填充评论作者信息
    const updatedGuide = await Guide.findById(guideId)
      .populate('author', 'username firstName lastName')
      .populate('comments.author', 'username firstName lastName');

    res.status(201).json({
      success: true,
      message: '评论添加成功',
      data: { 
        comments: updatedGuide.comments,
        commentCount: updatedGuide.comments.length
      }
    });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

module.exports = router;