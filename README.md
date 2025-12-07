# 量子太空杀 (QuantumSpaceWar)
## 项目简介
量子太空杀是一个跨平台的狼人杀策略游戏，结合了太空科幻元素和经典的狼人杀游戏机制。玩家可以在不同平台上参与游戏，享受沉浸式的太空冒险和策略对战体验。

## 技术栈
### 前端
- React Native - 用于构建跨平台移动应用 (QuantumSpaceWarApp)
- JavaScript/TypeScript - 主要开发语言
### 后端
- Node.js + Express - 提供API服务和实时通信 (node-backend)
- Django - 提供Web应用和管理功能 (quantumspacewar)
### 数据库
- SQLite - 轻量级数据库 (db.sqlite3)
### 其他
- Python - 用于工具脚本和后端逻辑
- Socket.IO - 用于实时通信
## 项目结构
```
QuantumSpaceWar/
├── QuantumSpaceWarApp/     # React Native移动端应用
│   ├── src/               # 源代码
│   ├── assets/            # 静态资源
│   └── package.json       # 依赖配置
├── node-backend/          # Express.js后端服务
│   ├── routes/            # API路由
│   ├── services/          # 业务逻辑
│   ├── models/            # 数据模型
│   └── package.json       # 依赖配置
├── quantumspacewar/       # Django Web应用
│   ├── guides/            # 游戏攻略模块
│   ├── api/               # REST API
│   └── manage.py          # Django管理脚本
├── start_app.py           # 项目启动脚本
├── .gitignore             # Git忽略文件配置
└── 量子太空杀启动器_修复版.exe # Windows启动器
```
## 安装和运行
### 前提条件
- Node.js 14+
- Python 3.7+
- npm/yarn
- Django 3.0+
### 安装依赖
1. 安装React Native应用依赖
    ```
    cd QuantumSpaceWarApp
    npm install
    ```
2. 安装Node.js后端依赖
    ```
    cd node-backend
    npm install
    ```
3. 安装Django应用依赖
    ```
    cd quantumspacewar
    pip install -r requirements.txt
    ```
### 运行项目 方法一：使用启动脚本（推荐）
```
# 在项目根目录执行
python start_app.py
```
方法二：手动运行各模块
1. 启动Node.js后端
    ```
    cd node-backend
    npm start
    ```
2. 启动Django Web应用
    ```
    cd quantumspacewar
    python manage.py runserver
    ```
3. 运行React Native应用
    ```
    cd QuantumSpaceWarApp
    # iOS
    npx react-native run-ios
    # Android
    npx react-native run-android
    ```
### Windows启动器
对于Windows用户，可以直接使用提供的启动器：

```
双击运行 "量子太空杀启动器_修复版.exe"
```
## 功能特性
- 跨平台支持 ：同时支持Web、iOS和Android平台
- 实时通信 ：使用Socket.IO实现玩家之间的实时交互
- 游戏攻略 ：内置详细的游戏攻略和策略指导
- 用户管理 ：完整的用户注册、登录和权限管理系统
- 房间系统 ：支持创建和加入游戏房间
- 角色系统 ：多种太空主题的游戏角色
## 开发和贡献
`@二氧化碳君`   `@fancy`
### 开发流程
1. Fork本仓库
2. 创建特性分支 ( git checkout -b feature/AmazingFeature )
3. 提交更改 ( git commit -m 'Add some AmazingFeature' )
4. 推送到分支 ( git push origin feature/AmazingFeature )
5. 开启Pull Request
### 代码规范
- 遵循JavaScript/TypeScript和Python的标准代码规范
- 使用有意义的变量和函数命名
- 为复杂代码添加注释说明
## 许可证
本项目采用MIT许可证 - 查看LICENSE文件了解详情

## 联系方式
如有问题或建议，欢迎通过以下方式联系：

- 项目地址： `https://github.com/acb666/QuantumSpaceWar`
- 邮箱： `3996870860@qq.com`
- QQ：`3996870860`
- 享受游戏，探索宇宙！ 🚀🌌
