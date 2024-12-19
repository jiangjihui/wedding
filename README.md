# 婚礼请柬网站

一个基于 Vue 3 + Vant + Express + SQLite 的婚礼请柬网站，包含照片展示、宾客管理、点赞统计等功能。

## 功能特点

- 📸 照片展示：支持照片上传、排序、删除和管理
- 👥 宾客管理：收集和管理宾客参加信息
- ❤️ 点赞功能：支持访客点赞，并提供点赞数据统计
- 🎵 背景音乐：自动播放背景音乐（可控制开关）
- 🎆 特效动画：包含烟花特效等动画效果
- 📱 响应式设计：适配各种移动设备
- 🔧 后台管理：提供照片、宾客、点赞数据的管理功能

## 技术栈

- 前端：Vue 3 + Vant + SCSS
- 后端：Express + SQLite3
- 动画：GSAP + Howler.js
- 构建工具：Vite

## 项目启动

1. 安装依赖：
```bash
npm install
```

2. 启动后端服务器：
```bash
node src/server/index.js
```

3. 启动前端开发服务器：
```bash
npm run dev
```

4. 访问网站：
- 前台页面：http://localhost:5173
- 后台管理：http://localhost:5173/admin

## 项目结构

```
wedding-invitation/
├── src/
│   ├── components/      # 公共组件
│   ├── views/          # 页面组件
│   ├── router/         # 路由配置
│   ├── db/            # 数据库操作
│   ├── server/        # 后端服务
│   └── utils/         # 工具函数
├── public/            # 静态资源
└── uploads/          # 上传文件存储
```

## 配置说明

1. 数据库配置：
- 数据库文件位置：`src/db/wedding.db`
- 自动创建所需的表结构

2. 上传配置：
- 上传文件存储在 `uploads` 目录
- 支持图片文件上传和 URL 导入

3. 服务器配置：
- 默认端口：3000
- 支持跨域访问
- 静态文件服务

## 注意事项

1. 首次运行会自动创建数据库和必要的表结构
2. 确保 `uploads` 目录存在且有写入权限
3. 建议在生产环境使用 PM2 等工具管理 Node.js 进程
4. 注意修改 `src/views/Home.vue` 中的服务器地址配置

## 开发计划

- [ ] 添加用户认证系统
- [ ] 优化图片加载性能
- [ ] 添加更多动画效果
- [ ] 支持自定义主题
- [ ] 添加数据备份功能

## API 文档

### 照片相关

1. 获取照片列表
```
GET /api/photos
```

2. 上传照片
```
POST /api/photos
Content-Type: multipart/form-data
```

3. 更新照片
```
PUT /api/photos/:id
Content-Type: application/json
```

4. 删除照片
```
DELETE /api/photos/:id
```

### 宾客相关

1. 获取宾客列表
```
GET /api/guests
```

2. 添加宾客信息
```
POST /api/guests
Content-Type: application/json
```

3. 删除宾客信息
```
DELETE /api/guests/:id
```

### 点赞相关

1. 获取点赞统计
```
GET /api/likes/stats
```

2. 添加点赞
```
POST /api/likes
```

## 部署指南

1. 生产环境构建：
```bash
npm run build
```

2. 使用 PM2 启动服务：
```bash
pm2 start src/server/index.js --name wedding-server
```

3. 配置 Nginx：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads {
        alias /path/to/uploads;
    }
}
```

## 常见问题

1. 上传目录权限问题
```bash
chmod -R 755 uploads
chown -R node:node uploads
```

2. 数据库访问权限
```bash
chmod 644 src/db/wedding.db
chown node:node src/db/wedding.db
```

3. 端口被占用
```bash
# 查看占用端口的进程
lsof -i :3000
# 终止进程
kill -9 <PID>
```

## 许可证

MIT License - 详见 LICENSE 文件

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request