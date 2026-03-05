# 系统运行环境架构

## 🏗️ 三大运行环境

```
┌─────────────────────────────────────────────────────────────────┐
│                    Etsy 多租户自动化系统                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Windows  │   │ Railway  │   │  MacBook │
        │  电脑    │   │  云服务  │   │   电脑   │
        └──────────┘   └──────────┘   └──────────┘
```

---

## 1️⃣ Windows 电脑环境

### 🎯 主要功能
- **云途后台操作**（Tampermonkey 浏览器脚本）
- **订单处理**（Python 脚本）

### 🖥️ 运行内容

#### A. Tampermonkey 脚本（浏览器中运行）
```
Chrome 浏览器
    ↓
Tampermonkey 扩展
    ↓
yunexpress-order-sync.user.js
    ↓
功能：
  - 自动拉取运单号
  - 自动拉取跟踪号
  - 自动获取收货状态
  - 同步数据到飞书
```

**特点：**
- ✅ 与 Mac 版本完全通用
- ✅ 同一个脚本文件
- ✅ 通过 Git 同步更新

#### B. Python 订单处理脚本
```bash
# 邮箱监控 + 订单解析 + 物流下单
python main.py --shop nature --task process_orders
```

**功能：**
- 监控 Yahoo 邮箱
- 解析 Etsy 订单邮件
- 调用物流 API 下单
- 更新飞书表格

### 📂 目录结构
```
C:\Users\YourName\Documents\etsy-multi-tenant-system\
├── main.py
├── configs/
│   └── shops/
│       ├── nature.yaml
│       └── mishang.yaml
├── scripts/
│   └── tampermonkey/
│       └── yunexpress-order-sync.user.js  ← 浏览器脚本
└── .env  ← 环境变量（不提交到Git）
```

---

## 2️⃣ Railway 云服务环境

### 🎯 主要功能
- **物流下单 API 服务**
- **面单生成服务**

### ☁️ 运行内容

```
Railway 容器
    ↓
Flask API 服务
    ↓
功能：
  - POST /api/orders/submit - 提交物流订单
  - GET /api/labels/generate - 生成面单
  - GET /api/tracking/{order_id} - 查询跟踪号
```

### 🔧 部署配置

#### Railway Variables（环境变量）
```
YUNEXPRESS_APP_ID=your_app_id
YUNEXPRESS_APP_SECRET=your_app_secret
TAKESEND_CLIENT_ID=your_client_id
TAKESEND_AUTH_TOKEN=your_auth_token
FEISHU_APP_ID=cli_a5d8xxxxxx
FEISHU_APP_SECRET=your_feishu_secret
OPENROUTER_API_KEY=your_openrouter_key
```

#### 自动部署
```bash
# 推送到 GitHub 后自动部署
git push origin main
# Railway 自动检测并部署
```

### 📊 数据流向
```
Windows/Mac Python 脚本
    ↓ HTTP Request
Railway API 服务
    ↓ API Call
物流商 API（云途/泰嘉）
    ↓ Response
Railway API 服务
    ↓ HTTP Response
Windows/Mac Python 脚本
    ↓ Update
飞书多维表格
```

---

## 3️⃣ MacBook 电脑环境

### 🎯 主要功能
- **Etsy 后台自动化**（Playwright 浏览器自动化）
- **云途后台操作**（Tampermonkey 浏览器脚本）

### 💻 运行内容

#### A. Playwright 自动化（Etsy 后台）
```bash
# 发货履约
python main.py --shop nature --task fulfill_orders
```

**功能：**
- 自动登录 Etsy 后台
- 批量标记订单为已发货
- 上传跟踪号
- 更新订单状态

#### B. Tampermonkey 脚本（云途后台）
```
Chrome 浏览器
    ↓
Tampermonkey 扩展
    ↓
yunexpress-order-sync.user.js  ← 与 Windows 版本完全相同
    ↓
功能：
  - 自动拉取运单号
  - 自动拉取跟踪号
  - 自动获取收货状态
  - 同步数据到飞书
```

### 📂 目录结构
```
/Users/stokist/etsy-multi-tenant-system/
├── main.py
├── configs/
│   └── shops/
│       ├── nature.yaml
│       └── mishang.yaml
├── scripts/
│   └── tampermonkey/
│       └── yunexpress-order-sync.user.js  ← 浏览器脚本
└── .env  ← 环境变量（不提交到Git）
```

---

## 🔄 完整数据流向

### 订单处理流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 订单接收（Windows/Mac Python）                            │
│    Yahoo 邮箱 → 订单邮件 → AI 解析 → 飞书表格                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 物流下单（Windows/Mac Python → Railway API）              │
│    飞书表格 → Python 脚本 → Railway API → 物流商 API         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 云途后台操作（Windows/Mac Tampermonkey）                  │
│    云途后台网页 → Tampermonkey 脚本 → 飞书表格               │
│    功能：拉取运单号、跟踪号、收货状态                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Etsy 发货（MacBook Playwright）                           │
│    飞书表格 → Python 脚本 → Playwright → Etsy 后台           │
│    功能：标记已发货、上传跟踪号                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 环境配置对比

| 配置项 | Windows | Railway | MacBook |
|--------|---------|---------|---------|
| **Python 脚本** | ✅ 订单处理 | ✅ API 服务 | ✅ Etsy 自动化 |
| **Tampermonkey** | ✅ 云途后台 | ❌ | ✅ 云途后台 |
| **Playwright** | ❌ | ❌ | ✅ Etsy 后台 |
| **环境变量** | `.env` 文件 | Railway Variables | `.env` 文件 |
| **代码同步** | Git pull | 自动部署 | Git pull |

---

## 🚀 各环境启动流程

### Windows 启动

```bash
# 1. 拉取最新代码
cd C:\Users\YourName\Documents\etsy-multi-tenant-system
git pull

# 2. 启动订单处理（命令行）
python main.py --shop nature --task process_orders

# 3. 打开 Chrome 浏览器
# 4. 访问云途后台（Tampermonkey 脚本自动运行）
```

### Railway 启动

```bash
# 本地推送代码
git push origin main

# Railway 自动：
# 1. 检测到代码更新
# 2. 自动构建 Docker 镜像
# 3. 自动部署新版本
# 4. API 服务自动启动
```

### MacBook 启动

```bash
# 1. 拉取最新代码
cd ~/etsy-multi-tenant-system
git pull

# 2. 启动 Etsy 发货自动化
python main.py --shop nature --task fulfill_orders

# 3. 打开 Chrome 浏览器（可选）
# 4. 访问云途后台（Tampermonkey 脚本自动运行）
```

---

## 🔐 敏感信息管理

### 环境变量（不提交到 Git）

**Windows `.env`：**
```bash
YUNEXPRESS_APP_ID=your_app_id
YUNEXPRESS_APP_SECRET=your_app_secret
YAHOO_EMAIL=your_email@yahoo.com
YAHOO_APP_PASSWORD=your_app_password
```

**Railway Variables：**
- 在 Railway 控制台配置
- 所有密钥都在这里
- 不需要 `.env` 文件

**MacBook `.env`：**
```bash
YUNEXPRESS_APP_ID=your_app_id
YUNEXPRESS_APP_SECRET=your_app_secret
ETSY_API_KEY=your_etsy_api_key
```

### Tampermonkey 配置（浏览器本地存储）

- 使用 `GM_getValue` / `GM_setValue` 存储
- 不会提交到 Git
- 需要在每个浏览器中单独配置

---

## 📊 跨平台脚本同步

### Tampermonkey 脚本是通用的

```
┌─────────────────────────────────────────────────┐
│  Git 仓库（单一脚本源）                          │
│  scripts/tampermonkey/yunexpress-order-sync.user.js │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│   Windows    │        │    MacBook   │
│   Chrome     │        │    Chrome    │
│ Tampermonkey │        │ Tampermonkey │
└──────────────┘        └──────────────┘
```

### 更新流程

**Windows：**
```bash
cd C:\Users\YourName\Documents\etsy-multi-tenant-system
git pull
# 在 Tampermonkey 中重新导入脚本
```

**Mac：**
```bash
cd ~/etsy-multi-tenant-system
git pull
# 在 Tampermonkey 中重新导入脚本
```

---

## 🎯 典型使用场景

### 场景1：处理新订单（Windows）

1. **邮箱监控**（Python 脚本）
   ```bash
   python main.py --shop nature --task process_orders
   ```
   - 监控 Yahoo 邮箱
   - 解析订单信息
   - 调用 Railway API 下单
   - 更新飞书表格

2. **云途后台操作**（Tampermonkey 脚本）
   - 打开 Chrome 浏览器
   - 访问云途后台
   - 脚本自动拉取运单号
   - 自动同步到飞书

### 场景2：Etsy 发货（MacBook）

1. **发货履约**（Playwright 自动化）
   ```bash
   python main.py --shop nature --task fulfill_orders
   ```
   - 从飞书读取待发货订单
   - 自动登录 Etsy 后台
   - 批量标记已发货
   - 上传跟踪号

2. **云途后台检查**（Tampermonkey 脚本）
   - 打开 Chrome 浏览器
   - 访问云途后台
   - 脚本自动拉取最新状态
   - 同步到飞书

### 场景3：API 服务调用（任何环境）

```bash
# 从任何环境调用 Railway API
curl -X POST https://your-railway-app.railway.app/api/orders/submit \
  -H "Content-Type: application/json" \
  -d '{
    "shop_code": "nature",
    "order_data": {...}
  }'
```

---

## 🔄 环境间协作

### 数据流向

```
┌──────────────────────────────────────────────────────────┐
│                      飞书多维表格                         │
│                    （中央数据存储）                       │
└──────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
    │ Windows │          │ Railway │          │ MacBook │
    │  写入   │          │  写入   │          │  读取   │
    │  订单   │          │  运单号 │          │  发货   │
    └─────────┘          └─────────┘          └─────────┘
```

### 协作示例

**完整订单处理流程：**

1. **Windows** - 接收订单
   ```
   Yahoo 邮箱 → Python 脚本 → 飞书表格
   字段：订单号、收件人、地址、SKU
   ```

2. **Railway** - 物流下单
   ```
   Windows Python → Railway API → 物流商 API
   返回：运单号、预估费用
   ```

3. **Windows Tampermonkey** - 拉取跟踪号
   ```
   云途后台 → Tampermonkey 脚本 → 飞书表格
   字段：跟踪号、收货状态
   ```

4. **MacBook** - Etsy 发货
   ```
   飞书表格 → Python 脚本 → Playwright → Etsy 后台
   操作：标记已发货、上传跟踪号
   ```

---

## 🛠️ 环境配置清单

### Windows 配置

- [ ] 安装 Python 3.8+
- [ ] 安装 Chrome 浏览器
- [ ] 安装 Tampermonkey 扩展
- [ ] 克隆 Git 仓库
- [ ] 安装 Python 依赖：`pip install -r requirements.txt`
- [ ] 创建 `.env` 文件
- [ ] 导入 Tampermonkey 脚本
- [ ] 配置 Tampermonkey 脚本（飞书信息）

### Railway 配置

- [ ] 连接 GitHub 仓库
- [ ] 配置 Railway Variables（所有环境变量）
- [ ] 设置自动部署（推送到 main 分支）
- [ ] 配置域名（可选）

### MacBook 配置

- [ ] 安装 Python 3.8+
- [ ] 安装 Chrome 浏览器
- [ ] 安装 Tampermonkey 扩展（可选）
- [ ] 克隆 Git 仓库
- [ ] 安装 Python 依赖：`pip install -r requirements.txt`
- [ ] 安装 Playwright：`playwright install chromium`
- [ ] 创建 `.env` 文件
- [ ] 导入 Tampermonkey 脚本（可选）

---

## 📝 维护建议

### 代码更新

```bash
# 所有环境都执行
git pull

# Windows 和 Mac 需要重启 Python 脚本
# Railway 会自动重新部署
```

### 脚本更新

```bash
# 1. 修改脚本
vim scripts/tampermonkey/yunexpress-order-sync.user.js

# 2. 提交到 Git
git add scripts/tampermonkey/
git commit -m "[all] Update: yunexpress tampermonkey script"
git push

# 3. 在 Windows 和 Mac 的 Tampermonkey 中重新导入脚本
```

### 配置更新

```bash
# 1. 修改店铺配置
vim configs/shops/nature.yaml

# 2. 提交到 Git
git add configs/shops/nature.yaml
git commit -m "[nature] Update: feishu table ID"
git push

# 3. 所有环境自动同步（git pull 或 Railway 自动部署）
```

---

## 🎯 总结

| 环境 | 主要用途 | 关键技术 | 脚本类型 |
|------|---------|---------|---------|
| **Windows** | 订单处理 + 云途后台 | Python + Tampermonkey | 通用脚本 |
| **Railway** | API 服务 | Flask + Docker | 自动部署 |
| **MacBook** | Etsy 发货 + 云途后台 | Playwright + Tampermonkey | 通用脚本 |

**核心优势：**
- ✅ Tampermonkey 脚本在 Windows 和 Mac 上完全通用
- ✅ 通过 Git 统一管理和同步
- ✅ 配置文件驱动，易于维护
- ✅ 三个环境协同工作，数据通过飞书表格共享
