import tkinter as tk
from tkinter import ttk, messagebox
import subprocess
import sys
import os
import webbrowser

# 设置编码确保中文显示正常
import io
# 仅在stdout/stderr不为None时尝试设置编码，避免打包为GUI应用时出错
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

class AppStarter:
    def __init__(self, root):
        self.root = root
        self.root.title("量子太空杀攻略站 - 启动器")
        self.root.geometry("600x450")
        self.root.resizable(False, False)
        self.root.iconbitmap(default="")  # 可以添加图标文件
        
        # 设置深色主题
        self.style = ttk.Style()
        self.style.configure("TLabel", background="#1e1e1e", foreground="#e0e0e0")
        self.style.configure("TButton", background="#2d2d30", foreground="#e0e0e0")
        
        self.root.configure(bg="#1e1e1e")
        
        # 创建主框架
        self.main_frame = ttk.Frame(root, padding="20")
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 创建标题
        self.title_label = ttk.Label(self.main_frame, text="量子太空杀攻略站", font=("SimHei", 18, "bold"))
        self.title_label.pack(pady=(0, 20))
        
        # 创建介绍文本框
        self.info_text = tk.Text(self.main_frame, height=15, width=60, bg="#2d2d30", fg="#e0e0e0",
                                font=("SimHei", 10), wrap=tk.WORD)
        self.info_text.pack(pady=10)
        
        # 插入网站介绍内容
        intro_text = """网站介绍：

量子太空杀攻略站是一个专门为量子太空杀游戏玩家打造的攻略分享平台。

主要功能：
- 游戏攻略管理系统：用户可以浏览、搜索和分享游戏攻略
- 黑色主题管理界面：为管理员提供美观、现代的操作界面
- 玩家数据追踪：记录和分析玩家游戏数据
- 游戏地图和角色数据库：提供详细的游戏资源信息
- 社区互动功能：评论、点赞和收藏功能

技术栈：
- 后端：Django 5.x
- 数据库：SQLite
- 前端：HTML5、CSS3、JavaScript
- 样式：自定义CSS，支持黑色主题

管理界面地址：http://127.0.0.1:8000/admin/
网站首页地址：http://127.0.0.1:8000/

使用说明：
1. 点击"启动服务器"按钮开始运行网站
2. 保持此窗口打开
3. 点击相应链接访问网站或管理界面
4. 关闭此窗口将停止服务器"""
        
        self.info_text.insert(tk.END, intro_text)
        self.info_text.config(state=tk.DISABLED)  # 设置为只读
        
        # 创建按钮框架
        self.button_frame = ttk.Frame(self.main_frame)
        self.button_frame.pack(pady=20)
        
        # 创建按钮
        self.start_button = ttk.Button(self.button_frame, text="启动服务器", command=self.start_server)
        self.start_button.pack(side=tk.LEFT, padx=10)
        
        self.visit_button = ttk.Button(self.button_frame, text="访问网站", command=self.visit_website)
        self.visit_button.pack(side=tk.LEFT, padx=10)
        
        self.admin_button = ttk.Button(self.button_frame, text="管理界面", command=self.visit_admin)
        self.admin_button.pack(side=tk.LEFT, padx=10)
        
        self.server_process = None
    
    def start_server(self):
        try:
            # 获取可执行文件或脚本的位置
            if getattr(sys, 'frozen', False):
                # 当程序被打包为可执行文件时
                exe_path = os.path.dirname(os.path.abspath(sys.executable))
                project_dir = os.path.join(exe_path, "quantumspacewar")
            else:
                # 当直接运行Python脚本时
                base_dir = os.path.dirname(os.path.abspath(__file__))
                project_dir = os.path.join(base_dir, "quantumspacewar")
            
            # 检查项目目录是否存在
            if not os.path.exists(project_dir):
                # 如果在当前位置找不到，尝试从当前工作目录找
                alt_project_dir = os.path.join(os.getcwd(), "quantumspacewar")
                if os.path.exists(alt_project_dir):
                    project_dir = alt_project_dir
                else:
                    messagebox.showerror("错误", f"项目目录不存在: {project_dir}\n请确保启动器位于正确的项目目录中。")
                    return
            
            # 检查manage.py是否存在
            manage_py = os.path.join(project_dir, "manage.py")
            if not os.path.exists(manage_py):
                messagebox.showerror("错误", f"manage.py不存在: {manage_py}")
                return
            
            # 查找Python解释器
            python_exe = sys.executable
            # 如果是打包后的程序，尝试查找系统Python
            if getattr(sys, 'frozen', False):
                # 尝试使用系统默认Python
                import shutil
                system_python = shutil.which("python")
                if system_python:
                    python_exe = system_python
                else:
                    # 如果找不到，尝试其他常见路径
                    common_python_paths = [
                        "C:\\Python311\\python.exe",
                        "C:\\Program Files\\Python311\\python.exe",
                        "C:\\Users\\" + os.environ.get("USERNAME", "") + "\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"
                    ]
                    for path in common_python_paths:
                        if os.path.exists(path):
                            python_exe = path
                            break
            
            # 启动Django服务器，并指定主机和端口
            self.server_process = subprocess.Popen(
                [python_exe, "manage.py", "runserver", "127.0.0.1:8000"],
                cwd=project_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # 添加延迟以确保服务器有时间启动
            import time
            time.sleep(2)
            
            # 检查服务器是否仍在运行
            if self.server_process.poll() is not None:
                # 如果进程已经退出，获取错误输出
                stderr_output = self.server_process.stderr.read()
                messagebox.showerror("服务器启动失败", f"服务器无法启动。错误信息:\n{stderr_output}")
                self.server_process = None
                return
            
            messagebox.showinfo("成功", "服务器已启动！请保持此窗口打开以运行服务器。\n\n访问地址: http://127.0.0.1:8000/")
            
        except Exception as e:
            messagebox.showerror("启动失败", f"无法启动服务器: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def visit_website(self):
        webbrowser.open("http://127.0.0.1:8000/")
    
    def visit_admin(self):
        webbrowser.open("http://127.0.0.1:8000/admin/")
    
    def on_closing(self):
        if self.server_process:
            try:
                self.server_process.terminate()
                self.server_process.wait(timeout=5)
            except:
                self.server_process.kill()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = AppStarter(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()