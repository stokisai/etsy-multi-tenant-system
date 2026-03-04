# 多环境部署架构说明

## 🏗️ 你的实际架构

### 三个运行环境

```
┌─────────────────────────────────────────────────────────────┐
│  环境1：Windows电脑（云途后台操作）                           │
│  ├─ 浏览器脚本（Tampermonkey）                               │
│  ├─ 云途后台界面                                             │
│  └─ 功能：拉取运单号、跟踪号、发货状态                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  环境2：Railway（物流下单API）                                │
│  ├─ Flask API服务                                            │
│  ├─ 云途物流下单                                             │
│  ├─ 泰嘉物流下单                                             │
│  └─ 功能：创建物流订单、获取面单                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  环境3：MacBook（Etsy后台操作）                               │
│  ├─ 浏览器自动化（Playwright）                               │
│  ├─ Etsy后台界面                                             │
│  └─ 功能：标记发货、回传跟踪号                                │
└─────────────────────────────────────────────────────────────┘
```

### 共享部分

```
┌─────────────────────────────────────────────────────────────┐
│  代码仓库（GitHub）                                           │
│  ├─ 所有环境共享同一份代码                                    │
│  ├─ 配置文件独立（configs/shops/*.yaml）                     │
│  └─ 环境变量独立（.env）                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 新店铺配置流程

### 第1步：运行配置工具（任意环境）

```bash
# 在任意一台电脑上运行
python setup_shop.py

# 回答问题，生成配置文件
# 生成：configs/shops/ocean_breeze.yaml
# 更新：.env
```

### 第2步：提交到代码仓库

```bash
git add configs/shops/ocean_breeze.yaml
git add .env
git commit -m "Add ocean_breeze shop config"
git push
```

### 第3步：在各环境拉取配置

#### Windows电脑

```bash
cd etsy-multi-tenant-system
git pull

# 配置浏览器脚本（Tampermonkey）
# 1. 打开云途后台
# 2. 安装/更新Tampermonkey脚本
# 3. 脚本会自动读取配置文件
```

#### Railway

```bash
# Railway会自动部署最新代码
# 或手动触发部署
railway up
```

#### MacBook

```bash
cd etsy-multi-tenant-system
git pull

# 测试Etsy后台自动化
python main.py --shop ocean_breeze --task fulfill_orders --dry-run
```

---

## 🔧 各环境的具体配置

### 环境1：Windows电脑（云途后台）

#### 用途
- 在云途后台界面操作
- 使用Tampermonkey脚本自动化
- 拉取运单号、跟踪号、发货状态

#### 配置步骤

**1. 克隆代码仓库**
```bash
git clone <repository-url> etsy-multi-tenant-system
cd etsy-multi-tenant-system
```

**2. 安装Tampermonkey**
- 在Chrome/Edge浏览器安装Tampermonkey扩展

**3. 安装脚本**
```bash
# 脚本位置：scripts/tampermonkey/yunexpress-helper.user.js
# 在Tampermonkey中导入此脚本
```

**4. 配置脚本**
脚本会自动读取配置文件：
```javascript
// 脚本会读取：configs/shops/[shop_code].yaml
// 获取：
// - 飞书配置
// - 店铺信息
// - 字段映射
```

**5. 使用**
- 打开云途后台
- 脚本自动激活
- 点击按钮拉取数据到飞书

---

### 环境2：Railway（物流下单API）

#### 用途
- 提供物流下单API
- 云途物流下单
- 泰嘉物流下单
- 生成面单

#### 配置步骤

**1. 连接GitHub仓库**
```bash
# 在Railway控制台
# 1. New Project
# 2. Deploy from GitHub repo
# 3. 选择 etsy-multi-tenant-system
```

**2. 配置环境变量**
在Railway控制台添加环境变量：
```
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
YUNEXPRESS_CUSTOMER_ID=xxxxx
YUNEXPRESS_API_KEY=xxxxx
YUNEXPRESS_API_SECRET=xxxxx
TAKESEND_CLIENT_ID=xxxxx
TAKESEND_AUTH_TOKEN=xxxxx
```

**3. 配置启动命令**
```bash
# Procfile
web: python api/app.py
```

**4. 部署**
```bash
# Railway自动部署
# 或手动触发
railway up
```

**5. 获取API地址**
```
https://your-app.railway.app
```

**6. 更新配置文件**
```yaml
# configs/shops/ocean_breeze.yaml
logistics:
  yunexpress:
    label_mvp_url: "https://your-app.railway.app/api/label/yunexpress"
  takesend:
    label_mvp_url: "https://your-app.railway.app/api/label/takesend"
```

---

### 环境3：MacBook（Etsy后台）

#### 用途
- Etsy后台自动化
- 标记订单发货
- 回传跟踪号

#### 配置步骤

**1. 克隆代码仓库**
```bash
git clone <repository-url> etsy-multi-tenant-system
cd etsy-multi-tenant-system
```

**2. 安装依赖**
```bash
pip install -r requirements.txt

# 安装Playwright浏览器
playwright install chromium
```

**3. 配置环境变量**
```bash
cp .env.example .env
vim .env

# 添加所有环境变量
```

**4. 测试运行**
```bash
# 测试发货履约
python main.py --shop ocean_breeze --task fulfill_orders --dry-run

# 测试跟踪号回传
python main.py --shop ocean_breeze --task return_tracking --dry-run
```

**5. 设置定时任务**
```bash
# 编辑crontab
crontab -e

# 添加定时任务
# 每小时执行发货履约
0 * * * * cd /path/to/etsy-multi-tenant-system && python main.py --shop ocean_breeze --task fulfill_orders

# 每天早上9点回传跟踪号
0 9 * * * cd /path/to/etsy-multi-tenant-system && python main.py --shop ocean_breeze --task return_tracking
```

---

## 🔄 完整工作流程

### 订单处理流程

```
1. 邮箱监控（任意环境）
   ├─ 监控Yahoo邮箱
   ├─ 接收Etsy订单通知
   └─ AI解析订单信息

2. 物流下单（Railway API）
   ├─ 调用Railway API
   ├─ 创建云途/泰嘉订单
   ├─ 获取运单号
   └─ 写入飞书表格

3. 云途后台操作（Windows）
   ├─ 打开云途后台
   ├─ Tampermonkey脚本运行
   ├─ 拉取跟踪号和状态
   └─ 更新飞书表格

4. Etsy后台操作（MacBook）
   ├─ 从飞书读取待发货订单
   ├─ Playwright自动化
   ├─ 标记订单发货
   ├─ 回传跟踪号
   └─ 更新飞书表格
```

---

## 📝 新店铺配置清单

### 步骤1：生成配置（任意环境）

```bash
python setup_shop.py
```

### 步骤2：提交配置

```bash
git add configs/shops/ocean_breeze.yaml
git commit -m "Add ocean_breeze shop config"
git push
```

### 步骤3：Windows配置

- [ ] 拉取最新代码：`git pull`
- [ ] 更新Tampermonkey脚本
- [ ] 测试云途后台脚本

### 步骤4：Railway配置

- [ ] 触发重新部署（自动或手动）
- [ ] 验证API可用性
- [ ] 测试物流下单接口

### 步骤5：MacBook配置

- [ ] 拉取最新代码：`git pull`
- [ ] 测试发货履约：`python main.py --shop ocean_breeze --task fulfill_orders --dry-run`
- [ ] 测试跟踪号回传：`python main.py --shop ocean_breeze --task return_tracking --dry-run`
- [ ] 设置定时任务

### 步骤6：验证

- [ ] 测试完整流程
- [ ] 检查飞书表格数据
- [ ] 检查Etsy后台状态

---

## 🎯 关键点

### 1. 代码仓库共享

**所有环境使用同一份代码：**
- ✅ Windows、Railway、MacBook都从同一个GitHub仓库拉取
- ✅ 配置文件统一管理
- ✅ 修改一次，所有环境同步

### 2. 配置文件独立

**每个店铺一个配置文件：**
- ✅ `configs/shops/ocean_breeze.yaml`
- ✅ 所有环境读取相同的配置文件
- ✅ 环境变量通过`.env`文件管理

### 3. 环境变量管理

**不同环境的环境变量：**

**Windows：**
```bash
# .env（本地）
FEISHU_APP_ID=xxxxx
YUNEXPRESS_CUSTOMER_ID=xxxxx
EMAIL_PASSWORD_OCEAN=xxxxx
```

**Railway：**
```bash
# Railway控制台配置
FEISHU_APP_ID=xxxxx
YUNEXPRESS_CUSTOMER_ID=xxxxx
# 不需要EMAIL_PASSWORD（Railway不处理邮箱）
```

**MacBook：**
```bash
# .env（本地）
FEISHU_APP_ID=xxxxx
EMAIL_PASSWORD_OCEAN=xxxxx
# 不需要物流商配置（MacBook不下单）
```

### 4. 功能分工

| 功能 | Windows | Railway | MacBook |
|------|---------|---------|---------|
| 邮箱监控 | ✅ | ❌ | ✅ |
| AI订单解析 | ✅ | ❌ | ✅ |
| 物流下单 | ❌ | ✅ | ❌ |
| 云途后台操作 | ✅ | ❌ | ❌ |
| Etsy后台操作 | ❌ | ❌ | ✅ |
| 飞书读写 | ✅ | ✅ | ✅ |

---

## 💡 最佳实践

### 1. 配置管理

```bash
# 在任意一台电脑上配置
python setup_shop.py

# 提交到Git
git add configs/shops/*.yaml
git commit -m "Add new shop config"
git push

# 其他环境拉取
git pull
```

### 2. 环境变量同步

**方式1：手动同步**
```bash
# 在配置工具运行后
# 复制.env文件到各环境
scp .env windows:/path/to/etsy-multi-tenant-system/
scp .env macbook:/path/to/etsy-multi-tenant-system/
```

**方式2：使用密钥管理工具**
```bash
# 使用1Password、LastPass等
# 存储环境变量
# 各环境从密钥管理工具获取
```

### 3. 测试流程

**在每个环境测试：**

**Windows：**
```bash
# 测试云途后台脚本
# 打开云途后台，检查脚本是否正常运行
```

**Railway：**
```bash
# 测试API
curl https://your-app.railway.app/health
curl -X POST https://your-app.railway.app/api/order/create \
  -H "Content-Type: application/json" \
  -d '{"shop": "ocean_breeze", "order_data": {...}}'
```

**MacBook：**
```bash
# 测试Etsy自动化
python main.py --shop ocean_breeze --task fulfill_orders --dry-run
```

---

## 🎉 总结

**你的架构优势：**
- ✅ 功能分离，各司其职
- ✅ 代码共享，统一维护
- ✅ 配置集中，易于管理

**新店铺配置流程：**
1. 运行 `python setup_shop.py`（任意环境）
2. 提交配置到Git
3. 各环境拉取配置
4. 测试各环境功能
5. 开始使用

**时间：约10-15分钟**

**这就是为什么多租户系统如此强大！** 🚀
