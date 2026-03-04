# Etsy Multi-Tenant Automation System

## 概述

这是一个统一的多租户Etsy店铺自动化系统，整合了订单处理、物流下单、发货跟踪、利润计算等功能。

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
│   │   ├── nature.yaml        # 大自然店铺
│   │   ├── jinyalong.yaml     # 金亚龙店铺
│   │   ├── mishang.yaml       # 迷尚店铺
│   │   └── zhangjiagang.yaml  # 张家港店铺
│   └── global.yaml            # 全局配置
│
├── scripts/                   # 用户脚本
│   ├── tampermonkey/
│   │   └── etsy-fulfiller.user.js
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

## 快速开始

### 安装依赖
```bash
pip install -r requirements.txt
```

### 配置店铺
复制配置模板并填写店铺信息：
```bash
cp configs/shops/template.yaml configs/shops/myshop.yaml
```

### 运行任务
```bash
# 处理单个店铺的订单
python main.py --shop nature --task process_orders

# 处理所有店铺
python main.py --all --task process_orders

# 发货跟踪回填
python main.py --shop jinyalong --task return_tracking

# 利润计算
python main.py --shop mishang --task calculate_profit
```

## 迁移指南

详见 [MIGRATION.md](./MIGRATION.md)
