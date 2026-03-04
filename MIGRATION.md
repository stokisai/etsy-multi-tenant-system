# 迁移指南

本文档指导如何从现有的多个独立仓库迁移到统一的多租户系统。

## 迁移概览

### 现有仓库
1. **etsy-fulfillment-automation** - 发货履约自动化
2. **etsy-order-automation** - 订单处理自动化
3. **etsy-label-service** - 面单生成服务

### 目标架构
统一的多租户系统，所有店铺共享核心逻辑，通过配置文件区分。

## 迁移步骤

### 第1步：分析现有代码

#### 1.1 识别共享逻辑
- ✅ 飞书API调用
- ✅ 云途物流API
- ✅ 泰嘉物流API
- ✅ 订单解析逻辑
- ✅ 浏览器自动化

#### 1.2 识别店铺差异
- 飞书表格ID
- 物流账号
- SKU规则
- 发件人信息
- 调度频率

### 第2步：提取核心模块

#### 2.1 从 etsy-order-automation 提取
```bash
# 提取的文件
- email_monitor.py → modules/email_monitor.py
- order_parser.py → modules/order_parser.py
- feishu_writer.py → services/feishu_service.py
- logistics/yunexpress.py → modules/logistics/yunexpress.py
- logistics/takesend.py → modules/logistics/takesend.py
```

#### 2.2 从 etsy-fulfillment-automation 提取
```bash
# 提取的文件
- browser_automation.py → services/etsy_service.py
- feishu_monitor.py → services/feishu_service.py (合并)
- carrier_detect.py → modules/carrier_detector.py
```

#### 2.3 从 etsy-label-service 提取
```bash
# 提取的文件
- app.py → api/app.py
- mvp.py → modules/label_generator.py
```

### 第3步：创建店铺配置

#### 3.1 大自然店铺
```bash
cp configs/shops/template.yaml configs/shops/nature.yaml
```

编辑 `configs/shops/nature.yaml`:
```yaml
shop_code: "nature"
shop_name: "大自然草柳编"

feishu:
  order_table:
    app_token: "Cu82bgVDGaNTNsspOs4c6dAJnIc"
    table_id: "tblWlIrPD6KZCy8U"

sku_rules:
  prefix_mapping:
    "Nature": "yunexpress"
    "XCFQ": "yunexpress"
```

#### 3.2 金亚龙店铺
```bash
cp configs/shops/template.yaml configs/shops/jinyalong.yaml
```

编辑 `configs/shops/jinyalong.yaml`:
```yaml
shop_code: "jinyalong"
shop_name: "金亚龙"

feishu:
  order_table:
    app_token: "XsiMbfp5NaWUVgsVUUccHUtMn0d"
    table_id: "tblao72mWjoXKR6h"

sku_rules:
  prefix_mapping:
    "JYL": "takesend"
    "JLY": "takesend"

logistics:
  default_provider: "takesend"
  takesend:
    enabled: true
```

#### 3.3 迷尚店铺
```bash
cp configs/shops/template.yaml configs/shops/mishang.yaml
```

#### 3.4 张家港店铺
```bash
cp configs/shops/template.yaml configs/shops/zhangjiagang.yaml
```

### 第4步：迁移环境变量

创建 `.env` 文件：
```bash
# 飞书配置
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# 云途物流
YUNEXPRESS_APP_ID=your_app_id
YUNEXPRESS_APP_SECRET=your_app_secret
YUNEXPRESS_SOURCE_KEY=your_source_key

# 泰嘉物流
TAKESEND_CLIENT_ID=your_client_id
TAKESEND_AUTH_TOKEN=your_auth_token

# 邮箱配置
YAHOO_EMAIL=your_email@yahoo.com
YAHOO_APP_PASSWORD=your_app_password

# OpenRouter AI
OPENROUTER_API_KEY=your_api_key
```

### 第5步：测试迁移

#### 5.1 测试配置加载
```bash
python main.py --list-shops
```

预期输出：
```
可用店铺:
  ✓ nature          - 大自然草柳编
  ✓ jinyalong       - 金亚龙
  ✓ mishang         - 迷尚
  ✓ zhangjiagang    - 张家港
```

#### 5.2 测试单个店铺
```bash
# 测试订单处理
python main.py --shop nature --task process_orders

# 测试发货履约
python main.py --shop jinyalong --task fulfill_orders

# 测试跟踪号回填
python main.py --shop mishang --task return_tracking
```

#### 5.3 测试所有店铺
```bash
python main.py --all --task process_orders
```

### 第6步：迁移Tampermonkey脚本

#### 6.1 更新API端点
编辑 `scripts/tampermonkey/etsy-fulfiller.user.js`:

```javascript
// 旧版本（硬编码配置）
const FEISHU_TABLES = [
  { app_token: 'XXX', table_id: 'YYY', name: '店铺1' },
  { app_token: 'AAA', table_id: 'BBB', name: '店铺2' },
];

// 新版本（从API获取配置）
const CONFIG_API = 'https://your-api.railway.app/api/config';

async function getShopConfig() {
  const response = await fetch(CONFIG_API);
  return await response.json();
}
```

### 第7步：部署到Railway

#### 7.1 准备部署文件
```bash
# Procfile
web: python api/app.py

# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "python api/app.py"
```

#### 7.2 设置环境变量
在Railway控制台设置所有环境变量。

#### 7.3 部署
```bash
railway up
```

### 第8步：验证迁移

#### 8.1 功能验证清单
- [ ] 订单邮件监控正常
- [ ] 订单解析准确
- [ ] 物流下单成功
- [ ] 飞书写入正常
- [ ] 发货履约自动化工作
- [ ] 跟踪号回填正常
- [ ] Tampermonkey脚本兼容

#### 8.2 数据验证
- [ ] 检查飞书表格数据完整性
- [ ] 验证物流单号正确性
- [ ] 确认面单生成正常

### 第9步：切换生产环境

#### 9.1 灰度发布
1. 先用一个店铺测试1-2天
2. 逐步增加店铺
3. 最后全部切换

#### 9.2 监控
- 设置日志告警
- 监控错误率
- 跟踪处理时间

#### 9.3 回滚计划
保留旧仓库1-2周，以便必要时回滚。

## 迁移后的优势

### 1. 维护成本降低
- 一处修改，所有店铺生效
- 统一的错误处理
- 集中的日志管理

### 2. 新店铺上线快速
```bash
# 只需3步
1. cp configs/shops/template.yaml configs/shops/newshop.yaml
2. 编辑配置文件
3. python main.py --shop newshop --task process_orders
```

### 3. 代码质量提升
- 统一的代码规范
- 更好的测试覆盖
- 更清晰的架构

## 常见问题

### Q1: 如何处理店铺特殊逻辑？
A: 使用配置文件的 `features` 字段或创建店铺特定的插件。

### Q2: 如何回滚到旧系统？
A: 保留旧仓库，修改环境变量指向旧系统即可。

### Q3: 如何添加新的物流商？
A: 实现 `LogisticsProvider` 接口，在工厂类中注册。

### Q4: 配置文件支持热更新吗？
A: 支持，使用 `config_loader.reload_shop_config(shop_code)` 即可。

## 技术支持

如有问题，请查看：
- [README.md](./README.md) - 系统概览
- [API文档](./docs/API.md) - API接口说明
- [配置说明](./docs/CONFIG.md) - 配置详解
