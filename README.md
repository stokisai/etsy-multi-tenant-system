# Etsy Multi-Tenant Automation System

## 🎯 核心价值：从1到100

**第一个店铺（0到1）：** 开发所有功能，建立完整的自动化流程
**后续店铺（1到100）：** 只需5分钟创建配置文件，立即开始使用

不再需要复制多个仓库、修改多处代码。一套代码，配置驱动，支持无限店铺扩展。

### 🎬 [查看5分钟演示](./docs/5MIN_DEMO.md)

---

## 概述

这是一个统一的多租户Etsy店铺自动化系统，整合了订单处理、物流下单、发货跟踪等功能。

### 为什么需要这个系统？

**之前的问题：**
- 3个独立仓库（etsy-fulfiller, caoliubian-etsy-xiadan, label-mvp）
- 开新店铺需要复制所有代码
- 修改bug需要在多个仓库同步
- 维护成本随店铺数量线性增长

**现在的解决方案：**
- ✅ 单一代码库，统一维护
- ✅ 配置文件驱动，5分钟开新店
- ✅ 修改一次，所有店铺受益
- ✅ 维护成本固定，不随店铺增长

## 系统架构

```
etsy-multi-tenant-system/
├── main.py                    # 主入口
├── config_loader.py           # 配置加载器
├── shop_registry.py           # 店铺注册表
├── requirements.txt           # 依赖
│
├── core/                      # 核心业务逻辑
│   ├── __init__.py
│   ├── order_processor.py     # 订单处理
│   ├── fulfillment.py         # 发货履约
│   ├── tracking.py            # 物流跟踪
│   └── profit_calculator.py   # 利润计算
│
├── modules/                   # 功能模块
│   ├── __init__.py
│   ├── email_monitor.py       # 邮件监控
│   ├── order_parser.py        # 订单解析
│   ├── logistics/             # 物流模块
│   │   ├── __init__.py
│   │   ├── yunexpress.py      # 云途物流
│   │   ├── takesend.py        # 泰嘉物流
│   │   └── base.py            # 物流基类
│   └── label_generator.py     # 面单生成
│
├── services/                  # 外部服务集成
│   ├── __init__.py
│   ├── feishu_service.py      # 飞书服务
│   ├── etsy_service.py        # Etsy API服务
│   └── sheets_service.py      # Google Sheets服务
│
├── configs/                   # 店铺配置
│   ├── shops/
│   │   └── template.yaml      # 配置模板（其他店铺配置在本地，不提交到Git）
│   └── global.yaml            # 全局配置
│
├── scripts/                   # 用户脚本
│   ├── tampermonkey/          # 浏览器脚本（Windows/Mac通用）
│   │   ├── README.md          # 脚本说明
│   │   ├── SETUP_GUIDE.md     # 配置指南
│   │   └── yunexpress-order-sync.user.js  # 云途后台同步脚本
│   └── deployment/
│       └── railway_deploy.sh
│
└── api/                       # API服务（Railway部署）
    ├── app.py                 # Flask应用
    ├── routes/
    │   ├── orders.py
    │   ├── labels.py
    │   └── config.py
    └── Procfile
```

## 核心特性

### 1. 配置驱动
- 每个店铺一个配置文件
- 支持热加载配置
- 环境变量覆盖

### 2. 多店铺支持
- 统一的业务逻辑
- 店铺级别的任务调度
- 独立的错误处理

### 3. 模块化设计
- 可插拔的物流提供商
- 统一的服务接口
- 易于扩展

### 4. 部署灵活
- 本地运行支持
- Railway云部署
- Docker容器化

### 5. 浏览器脚本自动化
- **Tampermonkey 脚本**（Windows/Mac 通用）
- 云途后台自动拉取运单号、跟踪号、收货状态
- 自动同步数据到飞书多维表格
- 👉 [查看脚本配置指南](./scripts/tampermonkey/SETUP_GUIDE.md)

## 🚀 快速开始

### ⭐ 方式一：交互式配置工具（推荐）

**最简单的方式！只需回答几个问题，工具自动生成配置。**

```bash
# 1. 克隆仓库（首次）
git clone <repository-url> etsy-multi-tenant-system
cd etsy-multi-tenant-system

# 2. 安装依赖（首次）
pip install -r requirements.txt

# 3. 运行配置工具
python setup_shop.py

# 工具会引导你完成配置，只需回答问题：
# - 店铺代码和名称
# - Etsy Shop ID
# - 飞书 Table ID
# - 邮箱地址和密码
# - 其他配置（首次需要）

# 4. 配置完成，立即使用
python main.py --shop your_shop --task process_orders
```

**时间：首次10分钟，后续3分钟** ⚡

👉 [查看详细使用指南](./docs/SETUP_TOOL_GUIDE.md)

---

### 方式二：手动创建配置

```bash
# 1. 克隆仓库（首次）
git clone <repository-url> etsy-multi-tenant-system
cd etsy-multi-tenant-system

# 2. 安装依赖（首次）
pip install -r requirements.txt

# 3. 创建新店铺配置（5分钟）
python create_shop.py --shop my_new_shop --name "我的新店铺"

# 4. 编辑配置文件
vim configs/shops/my_new_shop.yaml

# 5. 设置环境变量
cp .env.example .env
vim .env

# 6. 开始使用
python main.py --shop my_new_shop --task process_orders
```

### 方式二：手动创建配置

```bash
# 1. 复制模板
cp configs/shops/template.yaml configs/shops/myshop.yaml

# 2. 编辑配置，填入你的店铺信息
vim configs/shops/myshop.yaml

# 3. 配置文件会自动被 .gitignore 忽略，不会提交到 Git

# 4. 运行
python main.py --shop myshop --task process_orders
```

**⚠️ 重要：店铺配置文件的隐私保护**
- 仓库中只包含 `template.yaml` 作为示例
- 你的实际店铺配置（如 `myshop.yaml`）会自动被 `.gitignore` 忽略
- 这些配置包含商业信息（飞书 Table ID、SKU 规则、发件人信息），不应公开
- 每个店铺在本地创建自己的配置文件，互不干扰

### 常用命令

```bash
# 处理订单（邮箱监控 + AI解析 + 物流下单）
python main.py --shop nature --task process_orders

# 发货履约（从飞书读取 + Etsy标记发货）
python main.py --shop nature --task fulfill_orders

# 回传跟踪号（获取末端跟踪号 + 更新Etsy）
python main.py --shop nature --task return_tracking

# 处理所有店铺
python main.py --all --task process_orders

# 测试模式（不实际执行）
python main.py --shop nature --task process_orders --dry-run
```

---

## 📚 文档

### 🌟 从这里开始
- **[🎯 新店铺配置完整指南](./docs/NEW_SHOP_SETUP_GUIDE.md)** - 多环境部署，按顺序配置 ⭐⭐⭐
- **[🏗️ 系统运行环境架构](./docs/RUNTIME_ARCHITECTURE.md)** - Windows/Railway/MacBook 三大环境详解 ⭐⭐⭐
- **[🛠️ 交互式配置工具](./docs/SETUP_TOOL_GUIDE.md)** - 自动生成配置，最简单
- **[🌐 Tampermonkey 脚本配置](./scripts/tampermonkey/SETUP_GUIDE.md)** - 云途后台自动化脚本

### 新手必读
- **[🎯 开通流程图](./docs/WORKFLOW.md)** - 可视化流程，一目了然
- **[📋 信息收集清单](./docs/NEW_SHOP_CHECKLIST.md)** - 详细的信息清单
- **[📝 信息收集表格](./docs/INFO_COLLECTION_FORM.md)** - 可打印的表格
- **[🚀 快速开始指南](./docs/NEW_SHOP_GUIDE.md)** - 5分钟开通新店铺
- **[🎬 5分钟演示](./docs/5MIN_DEMO.md)** - 完整的演示流程

### 深入了解
- **[📊 对比分析](./docs/COMPARISON.md)** - 多租户 vs 独立仓库
- **[📖 项目总结](./docs/PROJECT_SUMMARY.md)** - 项目架构和设计
- **[🔄 迁移指南](./docs/MIGRATION.md)** - 从旧仓库迁移

---
