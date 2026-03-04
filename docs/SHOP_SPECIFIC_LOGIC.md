# 店铺特定业务逻辑配置指南

## 📖 概述

本文档说明如何为特定店铺添加自定义的业务逻辑，而不影响其他店铺。

---

## 🎯 使用场景

- ✅ 某个店铺需要在下单时添加特殊备注
- ✅ 某个店铺需要签名确认或保险
- ✅ 某个店铺不允许PO Box地址
- ✅ 某个店铺需要应用折扣
- ✅ 某个店铺需要发送微信通知
- ✅ 某个店铺需要检查库存

---

## 📝 配置方法

### 第1步：编辑店铺配置文件

```bash
cd ~/etsy-multi-tenant-system
nano configs/shops/你的店铺.yaml
```

### 第2步：添加 `business_rules` 配置

```yaml
# ============================================
# 店铺特定业务规则
# ============================================
business_rules:
  # 下单时的特殊处理
  order_submission:
    add_custom_note: true  # 是否添加自定义备注
    custom_note: "易碎品，请小心处理。Fragile, handle with care."
    require_signature: true  # 是否需要签名
    insurance_required: true  # 是否需要保险
    insurance_value: 50.0  # 保险金额（美元）

  # 地址验证规则
  address_validation:
    strict_mode: true  # 严格模式
    allow_po_box: false  # 是否允许PO Box
    require_phone: true  # 是否必须有电话

  # 价格计算规则
  pricing:
    apply_discount: true  # 是否应用折扣
    discount_rate: 0.05  # 折扣率（5%）
    min_order_value: 15.0  # 最小订单金额

  # 库存检查
  inventory:
    check_before_order: true  # 下单前检查库存
    low_stock_threshold: 10  # 低库存阈值

  # 通知设置
  notifications:
    send_wechat: true  # 发送微信通知
    send_email: false  # 发送邮件通知
```

### 第3步：提交配置

```bash
git add configs/shops/你的店铺.yaml
git commit -m "Add custom business rules for 你的店铺"
git push
```

---

## 🔧 配置项详解

### 1. 下单规则 (`order_submission`)

| 配置项 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `add_custom_note` | boolean | 是否添加自定义备注 | `true` |
| `custom_note` | string | 自定义备注内容 | `"易碎品，请小心处理"` |
| `require_signature` | boolean | 是否需要签名确认 | `true` |
| `insurance_required` | boolean | 是否需要保险 | `true` |
| `insurance_value` | float | 保险金额（美元） | `50.0` |

**效果：**
- 迷尚店铺下单时会自动添加"易碎品"备注
- 要求收件人签名
- 添加50美元保险

---

### 2. 地址验证规则 (`address_validation`)

| 配置项 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `strict_mode` | boolean | 严格验证模式 | `true` |
| `allow_po_box` | boolean | 是否允许PO Box地址 | `false` |
| `require_phone` | boolean | 是否必须有电话号码 | `true` |

**效果：**
- 如果地址是PO Box，订单会被拒绝
- 如果没有电话号码，订单会被拒绝

---

### 3. 价格规则 (`pricing`)

| 配置项 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `apply_discount` | boolean | 是否应用折扣 | `true` |
| `discount_rate` | float | 折扣率（0-1） | `0.05` (5%) |
| `min_order_value` | float | 最小订单金额 | `15.0` |

**效果：**
- 自动应用5%折扣
- 订单金额低于15美元会被标记

---

### 4. 库存检查 (`inventory`)

| 配置项 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `check_before_order` | boolean | 下单前检查库存 | `true` |
| `low_stock_threshold` | int | 低库存阈值 | `10` |

**效果：**
- 下单前检查库存
- 库存低于10时发出警告

---

### 5. 通知设置 (`notifications`)

| 配置项 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `send_wechat` | boolean | 发送微信通知 | `true` |
| `send_email` | boolean | 发送邮件通知 | `false` |

**效果：**
- 下单成功后发送微信通知
- 不发送邮件通知

---

## 📊 实际案例

### 案例1：迷尚店铺（易碎品，需要保险）

```yaml
# configs/shops/mishang.yaml
business_rules:
  order_submission:
    add_custom_note: true
    custom_note: "易碎品，请小心处理。Fragile, handle with care."
    require_signature: true
    insurance_required: true
    insurance_value: 50.0

  address_validation:
    allow_po_box: false  # 不允许PO Box
    require_phone: true  # 必须有电话

  notifications:
    send_wechat: true  # 发送微信通知
```

### 案例2：大自然店铺（标准配置）

```yaml
# configs/shops/nature.yaml
business_rules:
  order_submission:
    add_custom_note: false  # 不添加备注
    require_signature: false
    insurance_required: false

  address_validation:
    allow_po_box: true  # 允许PO Box
    require_phone: false

  notifications:
    send_wechat: false
```

---

## 🚀 测试配置

### 测试单个店铺

```bash
# 测试迷尚店铺
python main.py --shop mishang --task process_orders

# 测试大自然店铺
python main.py --shop nature --task process_orders
```

### 查看日志

```bash
# 查看迷尚店铺日志
tail -f logs/mishang.log

# 查看大自然店铺日志
tail -f logs/nature.log
```

---

## 🔍 代码实现原理

系统会在订单处理时自动读取 `business_rules` 配置：

```python
# core/order_processor.py

def __init__(self, shop_code: str, config: dict):
    # 读取店铺特定业务规则
    self.business_rules = config.get('business_rules', {})

def prepare_order_params(self, order_data: dict, product: dict) -> dict:
    """准备下单参数（根据店铺规则）"""
    order_rules = self.business_rules.get('order_submission', {})

    # 添加自定义备注
    if order_rules.get('add_custom_note', False):
        params['custom_note'] = order_rules.get('custom_note', '')

    # 是否需要签名
    if order_rules.get('require_signature', False):
        params['require_signature'] = True

    return params
```

---

## ✅ 优势

1. **配置驱动** - 不需要修改代码，只需要修改配置文件
2. **店铺隔离** - 每个店铺的规则互不影响
3. **易于维护** - 配置文件清晰明了，易于理解
4. **版本控制** - 配置文件可以提交到Git，方便追踪变更

---

## 🎯 下一步

如果需要更复杂的业务逻辑（例如调用外部API、复杂的计算），可以：

1. 在 `core/order_processor.py` 中添加新的方法
2. 在配置文件中添加对应的开关
3. 提交代码到Git

详见：[高级业务逻辑开发指南](./ADVANCED_LOGIC.md)
