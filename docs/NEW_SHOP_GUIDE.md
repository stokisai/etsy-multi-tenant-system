# 新店铺快速开始指南

## 目标：5分钟开通新店铺

当你开设新的Etsy店铺时，只需要3步即可开始使用自动化系统：

1. **拉取代码**
2. **创建配置文件**
3. **运行自动化**

不需要复制多个仓库，不需要修改代码，一切都通过配置驱动。

---

## 第一步：拉取代码（首次）

```bash
# 克隆仓库
git clone <repository-url> etsy-multi-tenant-system
cd etsy-multi-tenant-system

# 安装依赖
pip install -r requirements.txt
```

**注意：** 这一步只需要做一次，后续开新店铺不需要重复。

---

## 第二步：创建店铺配置文件

在 `configs/shops/` 目录下创建新的配置文件，例如 `my_new_shop.yaml`：

```yaml
# 店铺基本信息
shop_code: my_new_shop
shop_name: "我的新店铺"
enabled: true

# Etsy 配置
etsy:
  shop_id: "你的店铺ID"
  api_key: "${ETSY_API_KEY_NEW_SHOP}"  # 环境变量
  api_secret: "${ETSY_API_SECRET_NEW_SHOP}"

# 飞书配置
feishu:
  app_id: "${FEISHU_APP_ID}"
  app_secret: "${FEISHU_APP_SECRET}"
  table_id: "tblXXXXXXXX"  # 这个店铺的多维表格ID

  # 字段映射（根据你的飞书表格调整）
  field_mapping:
    order_id: "订单号"
    buyer_name: "买家姓名"
    tracking_number: "跟踪号"
    status: "状态"

# 邮箱监控配置
email:
  provider: "yahoo"
  address: "newshop@yahoo.com"
  password: "${EMAIL_PASSWORD_NEW_SHOP}"
  imap_server: "imap.mail.yahoo.com"
  imap_port: 993

# 物流配置
logistics:
  default_provider: "yunexpress"

  # 云途物流
  yunexpress:
    enabled: true
    customer_id: "${YUNEXPRESS_CUSTOMER_ID}"
    api_key: "${YUNEXPRESS_API_KEY}"
    api_secret: "${YUNEXPRESS_API_SECRET}"
    service_code: "CNPOST-FYB"

  # 泰嘉物流（美国订单）
  takesend:
    enabled: true
    client_id: "${TAKESEND_CLIENT_ID}"
    auth_token: "${TAKESEND_AUTH_TOKEN}"
    channels:
      US: "TKGZ-US"
      CA: "TKGZ-CA"

# SKU规则（根据SKU前缀选择物流商）
sku_rules:
  prefix_mapping:
    "US-": "takesend"    # US- 开头的SKU用泰嘉
    "EU-": "yunexpress"  # EU- 开头的SKU用云途
    "CN-": "yunexpress"  # CN- 开头的SKU用云途

# 发件人信息
sender:
  first_name: "Xiaokang"
  last_name: "Tian"
  company: "StrawCrafters"
  country_code: "CN"
  province: "Shandong"
  city: "Zibo City"
  address: "Building 11, Unit 2, Room 1403"
  postal_code: "255005"
  phone: "15387963207"
  email: ""

# 功能开关
features:
  auto_review: true          # 自动好评
  auto_tracking: true        # 自动回传跟踪号
  email_monitoring: true     # 邮箱监控
  order_processing: true     # 订单处理
  fulfillment: true          # 发货履约

# IOSS配置（欧盟订单）
ioss:
  enabled: true
  code: "IM3720000224"

# AI配置（订单解析）
ai:
  provider: "openai"
  model: "gpt-4"
  api_key: "${OPENAI_API_KEY}"
```

---

## 第三步：设置环境变量

创建 `.env` 文件（或添加到现有的）：

```bash
# 新店铺的环境变量
ETSY_API_KEY_NEW_SHOP=your_etsy_api_key
ETSY_API_SECRET_NEW_SHOP=your_etsy_api_secret
EMAIL_PASSWORD_NEW_SHOP=your_email_password

# 共享的环境变量（如果多个店铺共用）
FEISHU_APP_ID=your_feishu_app_id
FEISHU_APP_SECRET=your_feishu_app_secret
YUNEXPRESS_CUSTOMER_ID=your_yunexpress_customer_id
YUNEXPRESS_API_KEY=your_yunexpress_api_key
YUNEXPRESS_API_SECRET=your_yunexpress_api_secret
TAKESEND_CLIENT_ID=your_takesend_client_id
TAKESEND_AUTH_TOKEN=your_takesend_auth_token
OPENAI_API_KEY=your_openai_api_key
```

---

## 第四步：验证配置

在正式运行之前，先验证配置是否正确：

```bash
python validate_config.py --shop my_new_shop
```

这个工具会检查：
- ✅ 配置文件是否存在
- ✅ 必需字段是否填写
- ✅ Etsy API配置是否正确
- ✅ 飞书配置是否正确
- ✅ 物流商配置是否正确
- ✅ 发件人信息是否完整

如果验证通过，会显示：
```
✅ 配置验证通过！可以开始使用。

下一步：
  python main.py --shop my_new_shop --task process_orders --dry-run
```

---

## 第五步：运行自动化

### 处理订单（邮箱监控 + AI解析 + 物流下单）

```bash
python main.py --shop my_new_shop --task process_orders
```

这个命令会：
1. 监控Yahoo邮箱中的Etsy订单邮件
2. 使用AI解析订单信息
3. 根据SKU规则选择物流商
4. 自动创建物流订单
5. 将信息写入飞书多维表格

### 发货履约（从飞书读取 + Etsy标记发货）

```bash
python main.py --shop my_new_shop --task fulfill_orders
```

这个命令会：
1. 从飞书多维表格读取待发货订单
2. 使用Playwright自动化登录Etsy
3. 标记订单为已发货
4. 更新飞书表格状态

### 回传跟踪号（获取末端跟踪号 + 更新Etsy）

```bash
python main.py --shop my_new_shop --task return_tracking
```

这个命令会：
1. 从物流商API获取末端跟踪号
2. 更新到Etsy订单
3. 更新飞书表格

---

## 定时任务设置

使用cron或其他调度工具定时运行：

```bash
# 每10分钟检查新订单
*/10 * * * * cd /path/to/etsy-multi-tenant-system && python main.py --shop my_new_shop --task process_orders

# 每小时执行一次发货履约
0 * * * * cd /path/to/etsy-multi-tenant-system && python main.py --shop my_new_shop --task fulfill_orders

# 每天早上9点回传跟踪号
0 9 * * * cd /path/to/etsy-multi-tenant-system && python main.py --shop my_new_shop --task return_tracking
```

---

## 多店铺并行运行

如果你有多个店铺，可以同时运行：

```bash
# 店铺1
python main.py --shop nature --task process_orders &

# 店铺2
python main.py --shop my_new_shop --task process_orders &

# 店铺3
python main.py --shop another_shop --task process_orders &
```

---

## 常见问题

### Q: 我需要修改代码吗？
**A:** 不需要！所有店铺特定的逻辑都通过配置文件控制。

### Q: 如果我想用不同的物流商怎么办？
**A:** 在配置文件中修改 `logistics.default_provider` 或 `sku_rules.prefix_mapping`。

### Q: 如何测试新店铺配置？
**A:** 使用 `--dry-run` 参数：
```bash
python main.py --shop my_new_shop --task process_orders --dry-run
```

### Q: 配置文件可以放在其他地方吗？
**A:** 可以，使用 `--config` 参数指定：
```bash
python main.py --config /path/to/my_config.yaml --task process_orders
```

---

## 配置模板

系统提供了配置模板 `configs/shops/template.yaml`，你可以复制它来创建新店铺配置：

```bash
cp configs/shops/template.yaml configs/shops/my_new_shop.yaml
# 然后编辑 my_new_shop.yaml
```

---

## 下一步

- 查看 [完整配置说明](./CONFIGURATION.md)
- 了解 [SKU规则配置](./SKU_RULES.md)
- 学习 [物流商集成](./LOGISTICS.md)
- 阅读 [飞书集成指南](./FEISHU.md)

---

## 总结

**从0到1：** 第一个店铺需要开发所有功能（已完成）
**从1到100：** 新店铺只需要创建配置文件，5分钟开始使用

这就是多租户架构的价值！🚀
