/**
 * 专利交底书智能生成工具 - Vercel部署版
 * 适配Vercel Serverless环境
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'patent-secret-key-2024';

// 内存数据库
const db = {
  enterprises: [],
  users: [],
  aiConfigs: {},
  promptConfigs: {},
  templateConfigs: {},
  fieldConfigs: {},
  notifications: []
};

// 初始化数据
function initData() {
  // 超级管理员企业
  const superEnterprise = {
    id: uuidv4(),
    name: '系统管理企业',
    code: 'SYSTEM_ADMIN',
    licenseKey: 'SYSTEM-LICENSE-KEY',
    status: 'ACTIVE',
    maxUsers: 100,
    createdAt: new Date().toISOString()
  };
  db.enterprises.push(superEnterprise);

  // 示例企业
  const demoEnterprise = {
    id: uuidv4(),
    name: '示例科技有限公司',
    code: 'DEMO_TECH',
    licenseKey: 'DEMO-LICENSE-KEY-2024',
    licenseExpireAt: new Date('2025-12-31').toISOString(),
    status: 'ACTIVE',
    maxUsers: 20,
    contactName: '张经理',
    contactEmail: 'contact@demotech.com',
    createdAt: new Date().toISOString()
  };
  db.enterprises.push(demoEnterprise);

  // 用户
  db.users.push({
    id: uuidv4(),
    enterpriseId: superEnterprise.id,
    email: 'superadmin@example.com',
    passwordHash: bcrypt.hashSync('superadmin123', 10),
    name: '超级管理员',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  db.users.push({
    id: uuidv4(),
    enterpriseId: demoEnterprise.id,
    email: 'admin@demotech.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
    name: '企业管理员',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  db.users.push({
    id: uuidv4(),
    enterpriseId: demoEnterprise.id,
    email: 'researcher@demotech.com',
    passwordHash: bcrypt.hashSync('researcher123', 10),
    name: '研发人员',
    role: 'RESEARCHER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  // AI配置
  db.aiConfigs[demoEnterprise.id] = {
    id: uuidv4(),
    enterpriseId: demoEnterprise.id,
    defaultModelId: 'doubao-1-5-pro-32k-250115',
    models: [
      { modelId: 'doubao-1-5-pro-32k-250115', provider: 'doubao', name: '豆包Pro', baseURL: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: '', enabled: true, priority: 1 },
      { modelId: 'gpt-4', provider: 'openai', name: 'GPT-4', baseURL: 'https://api.openai.com/v1', apiKey: '', enabled: false, priority: 2 }
    ],
    enabled: true
  };

  // 提示词配置
  db.promptConfigs[demoEnterprise.id] = [
    { id: uuidv4(), type: 'POLISH', name: '默认润色提示词', content: '你是一位资深的专利代理人...', isDefault: true, isActive: true, version: 1 },
    { id: uuidv4(), type: 'EXTRACT', name: '默认提取提示词', content: '你是一位专业的专利分析师...', isDefault: true, isActive: true, version: 1 }
  ];

  // 字段配置
  db.fieldConfigs[demoEnterprise.id] = [
    { id: uuidv4(), fieldKey: 'title', fieldLabel: '发明名称', isRequired: true, minLength: 5, orderIndex: 1, isActive: true },
    { id: uuidv4(), fieldKey: 'technicalField', fieldLabel: '技术领域', isRequired: true, minLength: 5, orderIndex: 2, isActive: true },
    { id: uuidv4(), fieldKey: 'backgroundArt', fieldLabel: '背景技术', isRequired: true, minLength: 100, orderIndex: 3, isActive: true },
    { id: uuidv4(), fieldKey: 'technicalSolution', fieldLabel: '技术方案', isRequired: true, minLength: 200, orderIndex: 4, isActive: true }
  ];

  // 消息
  db.notifications.push({
    id: uuidv4(),
    type: 'SYSTEM',
    title: '欢迎使用专利交底书智能生成工具',
    content: '感谢您使用我们的系统！',
    priority: 'NORMAL',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  console.log('✅ 数据初始化完成');
}

// 初始化数据
initData();

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '未提供访问令牌' } });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: { code: 'INVALID_TOKEN', message: '令牌无效或已过期' } });
  }
};

// 响应辅助函数
const success = (res, data, message, code = 200) => {
  res.status(code).json({ success: true, data, message });
};

const error = (res, message, code = 'ERROR', statusCode = 400) => {
  res.status(statusCode).json({ success: false, error: { code, message } });
};

// ========== 健康检查 ==========
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '专利交底书后端服务',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  success(res, { status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  success(res, { status: 'ok', timestamp: new Date().toISOString() });
});

// ========== 认证相关 ==========
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return error(res, '请提供邮箱和密码', 'MISSING_CREDENTIALS', 400);
  }

  const user = db.users.find(u => u.email === email);
  if (!user) {
    return error(res, '邮箱或密码错误', 'INVALID_CREDENTIALS', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return error(res, '邮箱或密码错误', 'INVALID_CREDENTIALS', 401);
  }

  if (user.status !== 'ACTIVE') {
    return error(res, '账号已被禁用', 'ACCOUNT_DISABLED', 403);
  }

  const enterprise = db.enterprises.find(e => e.id === user.enterpriseId);
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, enterpriseId: user.enterpriseId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  success(res, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      enterprise: { id: enterprise.id, name: enterprise.name }
    },
    accessToken,
    refreshToken: uuidv4()
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.userId);
  const enterprise = db.enterprises.find(e => e.id === req.user.enterpriseId);
  
  if (!user) {
    return error(res, '用户不存在', 'USER_NOT_FOUND', 404);
  }

  success(res, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    enterprise: { id: enterprise.id, name: enterprise.name }
  });
});

// ========== 密码重置 ==========
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return error(res, '请提供邮箱地址', 'MISSING_EMAIL', 400);
  }

  const user = db.users.find(u => u.email === email);
  if (!user) {
    return success(res, null, '如果该邮箱存在，已发送密码重置链接');
  }

  const resetToken = jwt.sign(
    { userId: user.id, type: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const notification = {
    id: uuidv4(),
    userId: user.id,
    type: 'PASSWORD_RESET',
    title: '密码重置请求',
    content: `您请求了密码重置`,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.push(notification);

  success(res, { resetToken }, '密码重置链接已发送');
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return error(res, '请提供令牌和新密码', 'MISSING_PARAMS', 400);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'password_reset') {
      return error(res, '无效的令牌类型', 'INVALID_TOKEN_TYPE', 400);
    }

    const user = db.users.find(u => u.id === decoded.userId);
    if (!user) {
      return error(res, '用户不存在', 'USER_NOT_FOUND', 404);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    success(res, null, '密码重置成功');
  } catch (err) {
    error(res, '令牌无效或已过期', 'INVALID_TOKEN', 400);
  }
});

// ========== 企业账号管理 ==========
app.get('/api/enterprises', authenticateToken, (req, res) => {
  const list = db.enterprises.map(e => ({
    id: e.id,
    name: e.name,
    code: e.code,
    status: e.status,
    maxUsers: e.maxUsers,
    licenseExpireAt: e.licenseExpireAt
  }));
  success(res, { list, total: list.length });
});

app.post('/api/enterprises', authenticateToken, async (req, res) => {
  const { name, code, maxUsers, contactName, contactEmail } = req.body;

  if (!name || !code) {
    return error(res, '请提供企业名称和代码', 'MISSING_PARAMS', 400);
  }

  if (db.enterprises.find(e => e.code === code)) {
    return error(res, '企业编码已存在', 'DUPLICATE_CODE', 409);
  }

  const enterprise = {
    id: uuidv4(),
    name,
    code,
    licenseKey: `LIC-${code}-${uuidv4().substring(0, 8).toUpperCase()}`,
    status: 'ACTIVE',
    maxUsers: maxUsers || 20,
    contactName,
    contactEmail,
    createdAt: new Date().toISOString()
  };

  db.enterprises.push(enterprise);
  success(res, enterprise, '创建成功', 201);
});

app.get('/api/enterprises/:id', authenticateToken, (req, res) => {
  const enterprise = db.enterprises.find(e => e.id === req.params.id);
  if (!enterprise) {
    return error(res, '企业不存在', 'NOT_FOUND', 404);
  }
  success(res, enterprise);
});

app.put('/api/enterprises/:id', authenticateToken, (req, res) => {
  const enterprise = db.enterprises.find(e => e.id === req.params.id);
  if (!enterprise) {
    return error(res, '企业不存在', 'NOT_FOUND', 404);
  }

  const { name, status, maxUsers, contactName, contactEmail } = req.body;
  if (name) enterprise.name = name;
  if (status) enterprise.status = status;
  if (maxUsers) enterprise.maxUsers = maxUsers;
  if (contactName) enterprise.contactName = contactName;
  if (contactEmail) enterprise.contactEmail = contactEmail;

  success(res, enterprise, '更新成功');
});

// ========== 用户管理 ==========
app.get('/api/users', authenticateToken, (req, res) => {
  const list = db.users
    .filter(u => u.enterpriseId === req.user.enterpriseId)
    .map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status
    }));
  success(res, { list, total: list.length });
});

app.post('/api/users', authenticateToken, async (req, res) => {
  const { email, name, password, role } = req.body;

  if (!email || !name) {
    return error(res, '请提供邮箱和姓名', 'MISSING_PARAMS', 400);
  }

  if (db.users.find(u => u.email === email && u.enterpriseId === req.user.enterpriseId)) {
    return error(res, '邮箱已存在', 'EMAIL_EXISTS', 409);
  }

  const enterprise = db.enterprises.find(e => e.id === req.user.enterpriseId);
  const userCount = db.users.filter(u => u.enterpriseId === req.user.enterpriseId).length;
  if (userCount >= enterprise.maxUsers) {
    return error(res, '已达到企业用户数量上限', 'USER_LIMIT_REACHED', 403);
  }

  const newUser = {
    id: uuidv4(),
    enterpriseId: req.user.enterpriseId,
    email,
    name,
    passwordHash: await bcrypt.hash(password || 'password123', 10),
    role: role || 'RESEARCHER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  const notification = {
    id: uuidv4(),
    userId: newUser.id,
    type: 'ACCOUNT_CREATED',
    title: '账号创建成功',
    content: `您的账号 ${email} 已成功创建`,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.push(notification);

  success(res, {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role
  }, '创建成功', 201);
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    return error(res, '用户不存在', 'NOT_FOUND', 404);
  }

  const { name, role, status, password } = req.body;
  if (name) user.name = name;
  if (role && req.user.role === 'ADMIN') user.role = role;
  if (status && req.user.role === 'ADMIN') user.status = status;
  if (password) user.passwordHash = await bcrypt.hash(password, 10);

  success(res, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status
  }, '更新成功');
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return error(res, '用户不存在', 'NOT_FOUND', 404);
  }

  if (req.params.id === req.user.userId) {
    return error(res, '不能删除自己的账号', 'CANNOT_DELETE_SELF', 403);
  }

  db.users.splice(index, 1);
  success(res, null, '用户已删除');
});

// ========== AI配置 ==========
app.get('/api/ai-configs', authenticateToken, (req, res) => {
  const config = db.aiConfigs[req.user.enterpriseId] || {
    enterpriseId: req.user.enterpriseId,
    defaultModelId: 'doubao-1-5-pro-32k-250115',
    models: [],
    enabled: true
  };
  success(res, config);
});

app.put('/api/ai-configs', authenticateToken, (req, res) => {
  const { defaultModelId, models, enabled } = req.body;
  
  let config = db.aiConfigs[req.user.enterpriseId];
  if (!config) {
    config = {
      id: uuidv4(),
      enterpriseId: req.user.enterpriseId,
      models: []
    };
  }

  if (defaultModelId) config.defaultModelId = defaultModelId;
  if (models) config.models = models;
  if (typeof enabled !== 'undefined') config.enabled = enabled;

  db.aiConfigs[req.user.enterpriseId] = config;
  success(res, config, '更新成功');
});

app.post('/api/ai-configs/models', authenticateToken, (req, res) => {
  const body = req.body;
  const config = db.aiConfigs[req.user.enterpriseId] || {
    id: uuidv4(),
    enterpriseId: req.user.enterpriseId,
    models: []
  };

  if (config.models.find(m => m.modelId === body.modelId)) {
    return error(res, '模型已存在', 'DUPLICATE_MODEL_ID', 409);
  }

  config.models.push(body);
  db.aiConfigs[req.user.enterpriseId] = config;
  success(res, config, '添加成功', 201);
});

// AI润色接口
app.post('/api/ai/polish', authenticateToken, (req, res) => {
  const { content, field } = req.body;

  if (!content) {
    return error(res, '请提供需要润色的内容', 'MISSING_CONTENT', 400);
  }

  const config = db.aiConfigs[req.user.enterpriseId];
  const prompt = config?.prompts?.[field] || '请优化以下内容';

  const polishedContent = `[AI润色结果]\n\n${content}\n\n[优化说明]\n根据提示词"${prompt}"进行了优化。`;

  success(res, {
    originalContent: content,
    polishedContent,
    field,
    timestamp: new Date().toISOString()
  });
});

// ========== 提示词配置 ==========
app.get('/api/prompt-configs', authenticateToken, (req, res) => {
  const configs = db.promptConfigs[req.user.enterpriseId] || [];
  success(res, { list: configs, total: configs.length });
});

app.post('/api/prompt-configs', authenticateToken, (req, res) => {
  const { type, name, content, isDefault, isActive } = req.body;

  if (!type || !name || !content) {
    return error(res, '请提供完整信息', 'MISSING_PARAMS', 400);
  }

  const configs = db.promptConfigs[req.user.enterpriseId] || [];
  const config = {
    id: uuidv4(),
    type,
    name,
    content,
    isDefault: isDefault || false,
    isActive: isActive !== false,
    version: 1,
    createdAt: new Date().toISOString()
  };

  configs.push(config);
  db.promptConfigs[req.user.enterpriseId] = configs;
  success(res, config, '创建成功', 201);
});

app.put('/api/prompt-configs/:id', authenticateToken, (req, res) => {
  const configs = db.promptConfigs[req.user.enterpriseId] || [];
  const config = configs.find(c => c.id === req.params.id);

  if (!config) {
    return error(res, '配置不存在', 'NOT_FOUND', 404);
  }

  const { name, content, isDefault, isActive } = req.body;
  if (name) config.name = name;
  if (content) {
    config.content = content;
    config.version = (config.version || 1) + 1;
  }
  if (typeof isDefault !== 'undefined') config.isDefault = isDefault;
  if (typeof isActive !== 'undefined') config.isActive = isActive;

  success(res, config, '更新成功');
});

app.delete('/api/prompt-configs/:id', authenticateToken, (req, res) => {
  const configs = db.promptConfigs[req.user.enterpriseId] || [];
  const index = configs.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return error(res, '配置不存在', 'NOT_FOUND', 404);
  }

  configs.splice(index, 1);
  success(res, null, '已删除');
});

// ========== 字段配置 ==========
app.get('/api/field-configs', authenticateToken, (req, res) => {
  const configs = db.fieldConfigs[req.user.enterpriseId] || [];
  success(res, configs.sort((a, b) => a.orderIndex - b.orderIndex));
});

app.put('/api/field-configs', authenticateToken, (req, res) => {
  const { configs } = req.body;
  if (!Array.isArray(configs)) {
    return error(res, '请提供配置数组', 'INVALID_PARAMS', 400);
  }

  db.fieldConfigs[req.user.enterpriseId] = configs;
  success(res, configs, '更新成功');
});

app.post('/api/field-configs', authenticateToken, (req, res) => {
  const { fieldKey, fieldLabel, isRequired, minLength, maxLength, orderIndex } = req.body;

  if (!fieldKey || !fieldLabel) {
    return error(res, '请提供字段标识和标签', 'MISSING_PARAMS', 400);
  }

  const configs = db.fieldConfigs[req.user.enterpriseId] || [];
  const config = {
    id: uuidv4(),
    fieldKey,
    fieldLabel,
    isRequired: isRequired !== false,
    minLength: minLength || 0,
    maxLength: maxLength || 0,
    orderIndex: orderIndex || configs.length + 1,
    isActive: true
  };

  configs.push(config);
  db.fieldConfigs[req.user.enterpriseId] = configs;
  success(res, config, '创建成功', 201);
});

// ========== API模型配置 ==========
app.get('/api/api-configs', authenticateToken, (req, res) => {
  const config = db.aiConfigs[req.user.enterpriseId] || {
    enterpriseId: req.user.enterpriseId,
    defaultModelId: 'doubao-1-5-pro-32k-250115',
    models: [],
    enabled: true
  };
  
  // 不返回API密钥
  const safeConfig = {
    ...config,
    models: config.models?.map(m => ({
      modelId: m.modelId,
      provider: m.provider,
      name: m.name,
      enabled: m.enabled,
      priority: m.priority
    })) || []
  };

  success(res, safeConfig);
});

app.put('/api/api-configs', authenticateToken, (req, res) => {
  const { defaultModelId, models, enabled } = req.body;
  
  let config = db.aiConfigs[req.user.enterpriseId];
  if (!config) {
    config = {
      id: uuidv4(),
      enterpriseId: req.user.enterpriseId,
      models: []
    };
  }

  if (defaultModelId) config.defaultModelId = defaultModelId;
  if (models) config.models = models;
  if (typeof enabled !== 'undefined') config.enabled = enabled;

  db.aiConfigs[req.user.enterpriseId] = config;
  success(res, config, '更新成功');
});

// ========== 消息通知 ==========
app.get('/api/notifications', authenticateToken, (req, res) => {
  const list = db.notifications
    .filter(n => !n.userId || n.userId === req.user.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const unreadCount = list.filter(n => !n.isRead).length;
  success(res, { list, total: list.length, unreadCount });
});

app.get('/api/notifications/unread-count', authenticateToken, (req, res) => {
  const count = db.notifications.filter(
    n => (!n.userId || n.userId === req.user.userId) && !n.isRead
  ).length;
  success(res, { count });
});

app.post('/api/notifications', authenticateToken, (req, res) => {
  const { type, title, content, priority, userId } = req.body;

  if (!title || !content) {
    return error(res, '请提供标题和内容', 'MISSING_PARAMS', 400);
  }

  const notification = {
    id: uuidv4(),
    enterpriseId: req.user.enterpriseId,
    userId: userId || null,
    type: type || 'SYSTEM',
    title,
    content,
    priority: priority || 'NORMAL',
    isRead: false,
    createdAt: new Date().toISOString()
  };

  db.notifications.push(notification);
  success(res, notification, '创建成功', 201);
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const notification = db.notifications.find(
    n => n.id === req.params.id && (!n.userId || n.userId === req.user.userId)
  );

  if (!notification) {
    return error(res, '通知不存在', 'NOT_FOUND', 404);
  }

  notification.isRead = true;
  success(res, notification, '已标记为已读');
});

app.put('/api/notifications/read-all', authenticateToken, (req, res) => {
  db.notifications
    .filter(n => (!n.userId || n.userId === req.user.userId) && !n.isRead)
    .forEach(n => n.isRead = true);
  
  success(res, null, '所有通知已标记为已读');
});

app.delete('/api/notifications/:id', authenticateToken, (req, res) => {
  const index = db.notifications.findIndex(
    n => n.id === req.params.id && (!n.userId || n.userId === req.user.userId)
  );

  if (index === -1) {
    return error(res, '通知不存在', 'NOT_FOUND', 404);
  }

  db.notifications.splice(index, 1);
  success(res, null, '通知已删除');
});

// ========== 系统统计 ==========
app.get('/api/admin/stats', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return error(res, '需要管理员权限', 'FORBIDDEN', 403);
  }

  const stats = {
    enterprises: {
      total: db.enterprises.length,
      active: db.enterprises.filter(e => e.status === 'ACTIVE').length
    },
    users: {
      total: db.users.length,
      active: db.users.filter(u => u.status === 'ACTIVE').length
    },
    notifications: {
      total: db.notifications.length,
      unread: db.notifications.filter(n => !n.isRead).length
    }
  };

  success(res, stats);
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '接口不存在' } });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' }
  });
});

// 本地开发启动
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  专利交底书智能生成工具 - 后端服务                        ║
║  端口: ${PORT}                                            ║
║  API: http://localhost:${PORT}/api                        ║
╚══════════════════════════════════════════════════════════╝

默认账号:
  admin@demotech.com / admin123
  superadmin@example.com / superadmin123
  researcher@demotech.com / researcher123
`);
  });
}

module.exports = app;
