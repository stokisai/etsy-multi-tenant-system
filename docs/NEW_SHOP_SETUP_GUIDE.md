# 新店铺配置完整指南（多环境部署）

## 🎯 你的实际架构

基于你的3个原始仓库，我理解了你的部署架构：

```
原始架构（3个独立仓库）：

1. etsy-fulfiller
   └─ 部署在：MacBook
   └─ 功能：Etsy后台自动化（Playwright）

2. caoliubian-etsy-xiadan
   └─ 部署在：Windows（或服务器）
   └─ 功能：邮箱监控 + AI解析 + 物流下单

3. label-mvp
   └─ 部署在：Railway
   └─ 功能：面单生成API
```

**现在的多租户架构：**

```
单一代码仓库：etsy-multi-tenant-system

部署位置1：Windows电脑
├─ 功能：云途后台操作（Tampermonkey脚本）
└─ 拉取：运单号、跟踪号、发货状态

部署位置2：Railway
├─ 功能：物流下单API
└─ 云途下单、泰嘉下单、面单生成

部署位置3：MacBook
├─ 功能：Etsy后台自动化
└─ 标记发货、回传跟踪号
```

---

## 📋 新店铺配置流程（按顺序）

### 🎯 总览

```
第1步：生成配置（任意电脑）
   ↓
第2步：提交到Git
   ↓
第3步：配置Windows环境
   ↓
第4步：配置Railway环境
   ↓
第5步：配置MacBook环境
   ↓
第6步：测试完整流程
```

---

## 第1步：生成配置（任意电脑，推荐MacBook）

### 在MacBook上运行

```bash
cd /path/to/etsy-multi-tenant-system

# 运行配置工具
python setup_shop.py
```

### 回答问题

```
店铺代码: ocean_breeze
店铺名称: 海洋微风店铺
Etsy Shop ID: 12345678
飞书 Table ID: tblOcean123
邮箱地址: ocean@yahoo.com
邮箱密码: xxxx xxxx xxxx xxxx
邮箱类型: yahoo
```

### 生成的文件

```
✅ configs/shops/ocean_breeze.yaml  # 配置文件
✅ .env（更新）                      # 环境变量
```

---

## 第2步：提交到Git

```bash
# 添加配置文件
git add configs/shops/ocean_breeze.yaml

# 提交（不要提交.env文件！）
git commit -m "Add ocean_breeze shop config"

# 推送到远程
git push origin main
```

**⚠️ 重要：不要提交.env文件到Git！**

---

## 第3步：配置Windows环境

### 3.1 拉取最新代码

```bash
cd C:\etsy-multi-tenant-system
git pull
```

### 3.2 更新环境变量

```bash
# 编辑 .env 文件
notepad .env

# 添加（如果是首次配置）
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
EMAIL_PASSWORD_OCEAN=xxxx xxxx xxxx xxxx
```

### 3.3 配置Tampermonkey脚本

**脚本位置：**
```
scripts/tampermonkey/yunexpress-helper.user.js
```

**安装步骤：**
1. 打开Chrome/Edge浏览器
2. 确保已安装Tampermonkey扩展
3. 点击Tampermonkey图标 → Dashboard
4. 点击"+"创建新脚本
5. 复制`yunexpress-helper.user.js`的内容
6. 保存

**脚本配置：**
```javascript
// 脚本会自动读取配置文件
// 配置文件路径：configs/shops/ocean_breeze.yaml

// 如果需要手动指定店铺
const SHOP_CODE = 'ocean_breeze';
```

### 3.4 测试

1. 打开云途后台：https://www.yunexpress.com
2. 登录账号
3. 进入订单列表页面
4. 检查Tampermonkey脚本是否激活
5. 点击脚本按钮，测试拉取数据到飞书

---

## 第4步：配置Railway环境

### 4.1 连接GitHub仓库（首次）

如果是首次部署：

1. 登录Railway：https://railway.app
2. 点击"New Project"
3. 选择"Deploy from GitHub repo"
4. 选择`etsy-multi-tenant-system`仓库
5. Railway自动检测并部署

### 4.2 配置环境变量

在Railway控制台添加环境变量：

```
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
YUNEXPRESS_CUSTOMER_ID=xxxxx
YUNEXPRESS_API_KEY=xxxxx
YUNEXPRESS_API_SECRET=xxxxx
TAKESEND_CLIENT_ID=xxxxx
TAKESEND_AUTH_TOKEN=xxxxx
OPENAI_API_KEY=sk-xxxxx
```

### 4.3 配置启动命令

创建`Procfile`（如果还没有）：

```
web: python api/app.py
```

### 4.4 触发部署

```bash
# 方式1：自动部署（推荐）
# Railway检测到Git push后自动部署

# 方式2：手动部署
railway up
```

### 4.5 获取API地址

```
https://etsy-multi-tenant-system.railway.app
```

### 4.6 更新配置文件

回到MacBook，更新配置文件：

```bash
vim configs/shops/ocean_breeze.yaml
```

添加Railway API地址：

```yaml
logistics:
  yunexpress:
    label_mvp_url: "https://etsy-multi-tenant-system.railway.app/api/label/yunexpress"
  takesend:
    label_mvp_url: "https://etsy-multi-tenant-system.railway.app/api/label/takesend"
```

提交更新：

```bash
git add configs/shops/ocean_breeze.yaml
git commit -m "Update Railway API URL for ocean_breeze"
git push
```

### 4.7 测试API

```bash
# 测试健康检查
curl https://etsy-multi-tenant-system.railway.app/health

# 测试物流下单（使用测试数据）
curl -X POST https://etsy-multi-tenant-system.railway.app/api/order/create \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "ocean_breeze",
    "provider": "yunexpress",
    "order_data": {...},
    "product_data": {...}
  }'
```

---

## 第5步：配置MacBook环境

### 5.1 拉取最新代码

```bash
cd /path/to/etsy-multi-tenant-system
git pull
```

### 5.2 确认环境变量

```bash
# 检查.env文件
cat .env | grep OCEAN

# 应该包含：
# EMAIL_PASSWORD_OCEAN=xxxx xxxx xxxx xxxx
```

### 5.3 安装依赖（首次）

```bash
# 安装Python依赖
pip install -r requirements.txt

# 安装Playwright浏览器
playwright install chromium
```

### 5.4 测试发货履约

```bash
# 测试模式（不实际执行）
python main.py --shop ocean_breeze --task fulfill_orders --dry-run

# 正式运行
python main.py --shop ocean_breeze --task fulfill_orders
```

### 5.5 测试跟踪号回传

```bash
# 测试模式
python main.py --shop ocean_breeze --task return_tracking --dry-run

# 正式运行
python main.py --shop ocean_breeze --task return_tracking
```

### 5.6 设置定时任务

```bash
# 编辑crontab
crontab -e

# 添加定时任务
# 每小时执行发货履约
0 * * * * cd /path/to/etsy-multi-tenant-system && /usr/local/bin/python3 main.py --shop ocean_breeze --task fulfill_orders >> /tmp/etsy_fulfill.log 2>&1

# 每天早上9点回传跟踪号
0 9 * * * cd /path/to/etsy-multi-tenant-system && /usr/local/bin/python3 main.py --shop ocean_breeze --task return_tracking >> /tmp/etsy_tracking.log 2>&1
```

---

## 第6步：测试完整流程

### 6.1 准备测试订单

在飞书表格中手动添加一个测试订单：

```
订单号: TEST-001
买家姓名: Test User
收货地址: 123 Test St
城市: Test City
州/省: CA
邮编: 12345
国家: US
SKU: US-TEST-001
产品名称: Test Product
数量: 1
状态: 待处理
```

### 6.2 测试物流下单（Railway）

```bash
# 调用Railway API创建订单
curl -X POST https://etsy-multi-tenant-system.railway.app/api/order/create \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "ocean_breeze",
    "order_id": "TEST-001"
  }'

# 检查返回结果
# 应该包含：waybill（运单号）、tracking（跟踪号）
```

### 6.3 测试云途后台（Windows）

1. 打开云途后台
2. 进入订单列表
3. 找到刚才创建的订单
4. 点击Tampermonkey脚本按钮
5. 检查飞书表格是否更新了跟踪号和状态

### 6.4 测试Etsy后台（MacBook）

```bash
# 运行发货履约
python main.py --shop ocean_breeze --task fulfill_orders

# 检查：
# 1. Etsy后台订单是否标记为已发货
# 2. 飞书表格状态是否更新为"已发货"
```

### 6.5 测试跟踪号回传（MacBook）

```bash
# 运行跟踪号回传
python main.py --shop ocean_breeze --task return_tracking

# 检查：
# 1. Etsy后台是否显示跟踪号
# 2. 飞书表格是否更新为"已完成"
```

---

## ✅ 配置检查清单

### Windows环境

- [ ] 代码已拉取最新版本
- [ ] .env文件已配置
- [ ] Tampermonkey脚本已安装
- [ ] 云途后台脚本可以正常运行
- [ ] 可以拉取数据到飞书

### Railway环境

- [ ] GitHub仓库已连接
- [ ] 环境变量已配置
- [ ] 应用已部署成功
- [ ] API健康检查通过
- [ ] 物流下单接口可用

### MacBook环境

- [ ] 代码已拉取最新版本
- [ ] .env文件已配置
- [ ] Python依赖已安装
- [ ] Playwright浏览器已安装
- [ ] 发货履约测试通过
- [ ] 跟踪号回传测试通过
- [ ] 定时任务已设置

---

## 🎯 快速参考

### 配置新店铺（完整流程）

```bash
# 1. MacBook：生成配置
python setup_shop.py

# 2. MacBook：提交配置
git add configs/shops/new_shop.yaml
git commit -m "Add new_shop config"
git push

# 3. Windows：拉取配置
git pull
# 更新.env
# 测试Tampermonkey脚本

# 4. Railway：自动部署
# 检查部署状态
# 测试API

# 5. MacBook：拉取配置
git pull
# 测试发货履约
# 测试跟踪号回传
# 设置定时任务

# 6. 测试完整流程
# 创建测试订单
# 验证各环境功能
```

### 时间估算

- 生成配置：3分钟
- 提交配置：1分钟
- Windows配置：5分钟
- Railway配置：2分钟（自动部署）
- MacBook配置：5分钟
- 测试验证：5分钟

**总计：约20分钟**

---

## 💡 关键点

### 1. 代码同步

**所有环境使用同一份代码：**
```bash
# 任何环境修改后
git add .
git commit -m "Update"
git push

# 其他环境拉取
git pull
```

### 2. 环境变量管理

**不同环境需要不同的环境变量：**

| 环境变量 | Windows | Railway | MacBook |
|---------|---------|---------|---------|
| FEISHU_APP_ID | ✅ | ✅ | ✅ |
| EMAIL_PASSWORD | ✅ | ❌ | ✅ |
| YUNEXPRESS_* | ❌ | ✅ | ❌ |
| TAKESEND_* | ❌ | ✅ | ❌ |

### 3. 功能分工

| 功能 | Windows | Railway | MacBook |
|------|---------|---------|---------|
| 云途后台操作 | ✅ | ❌ | ❌ |
| 物流下单 | ❌ | ✅ | ❌ |
| Etsy后台操作 | ❌ | ❌ | ✅ |
| 飞书读写 | ✅ | ✅ | ✅ |

---

## 🎉 总结

**新店铺配置流程：**

1. ✅ 运行`python setup_shop.py`（MacBook）
2. ✅ 提交配置到Git
3. ✅ Windows拉取并配置Tampermonkey
4. ✅ Railway自动部署
5. ✅ MacBook拉取并设置定时任务
6. ✅ 测试完整流程

**时间：约20分钟**

**这就是多租户系统的威力！** 🚀
