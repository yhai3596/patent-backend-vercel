# 专利交底书后端服务

## 服务信息

- **端口**: 3002
- **API地址**: http://localhost:3002/api
- **健康检查**: http://localhost:3002/health

## 快速开始

### 1. 确保已安装Node.js

访问 https://nodejs.org/ 下载并安装 LTS 版本

### 2. 启动服务

**Windows:**
```cmd
start.bat
```

**Linux/Mac:**
```bash
bash start.sh
```

**或直接运行:**
```bash
node server.js
```

### 3. 验证服务

访问: http://localhost:3002/health

### 4. 默认登录账号

| 邮箱 | 密码 | 角色 |
|------|------|------|
| admin@demotech.com | admin123 | 企业管理员 |
| superadmin@example.com | superadmin123 | 超级管理员 |
| researcher@demotech.com | researcher123 | 研发人员 |

## API接口

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 当前用户信息

### 企业管理
- `GET /api/enterprises` - 企业列表
- `POST /api/enterprises` - 创建企业

### 用户管理
- `GET /api/users` - 用户列表
- `POST /api/users` - 创建用户

### AI配置
- `GET /api/ai-configs` - AI配置
- `POST /api/ai-configs/models` - 添加模型

### 提示词配置
- `GET /api/prompt-configs` - 提示词列表
- `POST /api/prompt-configs` - 创建提示词

### 字段配置
- `GET /api/field-configs` - 字段配置
- `PUT /api/field-configs` - 更新字段配置

### 消息通知
- `GET /api/notifications` - 消息列表
- `GET /api/notifications/unread-count` - 未读数量

## 测试

```bash
# 健康检查
curl http://localhost:3002/health

# 登录
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demotech.com","password":"admin123"}'
```
