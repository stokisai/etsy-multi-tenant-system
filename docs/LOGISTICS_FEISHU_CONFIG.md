# 物流和飞书配置指南

## 📖 概述

本文档说明如何为不同店铺配置物流商和飞书表格。

---

## 🚚 物流配置规则

### 云途物流（标配）

**所有店铺都必须配置云途物流**，作为标配或备用物流商。

```yaml
# configs/shops/你的店铺.yaml

logistics:
  # 云途物流（标配，必须启用）
  yunexpress:
    enabled: true  # ✅ 必须为 true
    app_id: "${YUNEXPRESS_APP_ID}"  # 从环境变量读取
    app_secret: "${YUNEXPRESS_APP_SECRET}"
    source_key: "${YUNEXPRESS_SOURCE_KEY}"
    channels:
      US: "USTHPHR"
      US_ISLAND: "THPDYPY"
      OTHER: "THPHR"
```

**环境变量配置（.env 或 Railway Variables）：**
```bash
YUNEXPRESS_APP_ID=你的云途APP_ID
YUNEXPRESS_APP_SECRET=你的云途APP_SECRET
YUNEXPRESS_SOURCE_KEY=你的云途SOURCE_KEY
```

---

### 泰嘉物流（可选）

**只有需要使用泰嘉物流的店铺才配置**。

#### 场景1：不使用泰嘉物流（大自然店铺）

```yaml
# configs/shops/nature.yaml

logistics:
  default_provider: "yunexpress"  # 默认使用云途

  yunexpress:
    enabled: true  # ✅ 云途启用

  takesend:
    enabled: false  # ❌ 泰嘉不启用
```

**效果：**
- ✅ 系统只初始化云途物流
- ✅ 所有订单都使用云途物流
- ✅ 不会加载泰嘉物流的任何逻辑

---

#### 场景2：使用泰嘉物流（迷尚店铺）

```yaml
# configs/shops/mishang.yaml

logistics:
  default_provider: "takesend"  # 默认使用泰嘉

  yunexpress:
    enabled: true  # ✅ 云途作为备用

  takesend:
    enabled: true  # ✅ 泰嘉启用
    client_id: "${TAKESEND_CLIENT_ID}"
    auth_token: "${TAKESEND_AUTH_TOKEN}"
    base_url: "http://k5.takesend.com:8180/WebCOrder"
    channels:
      US: "US_CN_A"
      GB: "UK_EXCN"
      DE: "DE_P_CN"
```

**环境变量配置（.env 或 Railway Variables）：**
```bash
TAKESEND_CLIENT_ID=你的泰嘉客户ID
TAKESEND_AUTH_TOKEN=你的泰嘉验证码
```

**效果：**
- ✅ 系统初始化云途和泰嘉两个物流商
- ✅ 默认使用泰嘉物流
- ✅ 云途作为备用

---

#### 场景3：根据SKU选择物流商

```yaml
# configs/shops/jinyalong.yaml

logistics:
  default_provider: "yunexpress"  # 默认云途

  yunexpress:
    enabled: true

  takesend:
    enabled: true  # ✅ 启用泰嘉

# SKU规则
sku_rules:
  prefix_mapping:
    "JYL-US": "takesend"    # JYL-US 开头的用泰嘉
    "JYL-EU": "yunexpress"  # JYL-EU 开头的用云途
    "JYL": "yunexpress"     # 其他JYL开头的用云途
```

**效果：**
- ✅ `JYL-US-001` → 使用泰嘉物流
- ✅ `JYL-EU-001` → 使用云途物流
- ✅ `JYL-CN-001` → 使用云途物流（默认）

---

## 📊 飞书配置规则

### 飞书 App ID 和 Secret（共享）

**所有店铺共享同一个飞书应用**，配置在环境变量中。

```bash
# .env 或 Railway Variables
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 飞书表格（每个店铺独立）

**每个店铺有自己的飞书表格**，配置在店铺配置文件中。

```yaml
# configs/shops/nature.yaml

feishu:
  app_id: "${FEISHU_APP_ID}"  # 从环境变量读取（共享）
  app_secret: "${FEISHU_APP_SECRET}"  # 从环境变量读取（共享）

  # 🎯 每个店铺独立的表格配置
  order_table:
    app_token: "Cu82bgVDGaNTNsspOs4c6dAJnIc"  # 大自然店铺的表格
    table_id: "tblWlIrPD6KZCy8U"
    fields:
      order_id: "Etsy订单号"
      tracking_number: "运单号"
      status: "收货状态"
```

```yaml
# configs/shops/mishang.yaml

feishu:
  app_id: "${FEISHU_APP_ID}"  # 从环境变量读取（共享）
  app_secret: "${FEISHU_APP_SECRET}"  # 从环境变量读取（共享）

  # 🎯 迷尚店铺独立的表格配置
  order_table:
    app_token: "MStWbahj8at2ZvsnheqcJtm2nYb"  # 迷尚店铺的表格
    table_id: "tblalRxohrGovqXK"
    fields:
      order_id: "Etsy订单号"
      tracking_number: "运单号"
      status: "收货状态"
```

---

## 🔧 配置工作流程

### 第1步：拉取最新代码

```bash
cd ~/etsy-multi-tenant-system
git pull
```

### 第2步：修改店铺配置

```bash
# 修改大自然店铺配置
nano configs/shops/nature.yaml

# 修改内容：
# - 飞书表格 ID
# - 物流商启用/禁用
# - SKU规则
```

### 第3步：提交配置

```bash
# 提交单个店铺配置
git add configs/shops/nature.yaml
git commit -m "[nature] Update: feishu table ID and disable takesend"
git push
```

### 第4步：在其他环境同步

```bash
# Windows电脑
cd etsy-multi-tenant-system
git pull

# Railway自动部署

# MacBook
cd ~/etsy-multi-tenant-system
git pull
```

---

## 📋 配置检查清单

### 新店铺配置检查

- [ ] 云途物流已启用（`yunexpress.enabled: true`）
- [ ] 云途环境变量已配置（`YUNEXPRESS_APP_ID` 等）
- [ ] 如果使用泰嘉，已启用（`takesend.enabled: true`）
- [ ] 如果使用泰嘉，环境变量已配置（`TAKESEND_CLIENT_ID` 等）
- [ ] 飞书 App ID 和 Secret 已配置（环境变量）
- [ ] 飞书表格 ID 已配置（店铺配置文件）
- [ ] SKU规则已配置（如果需要）

---

## 🎯 常见配置场景

### 场景1：只用云途的店铺（最简单）

```yaml
logistics:
  default_provider: "yunexpress"

  yunexpress:
    enabled: true
    app_id: "${YUNEXPRESS_APP_ID}"
    app_secret: "${YUNEXPRESS_APP_SECRET}"
    source_key: "${YUNEXPRESS_SOURCE_KEY}"

  takesend:
    enabled: false  # ❌ 不使用泰嘉
```

### 场景2：主要用泰嘉，云途备用

```yaml
logistics:
  default_provider: "takesend"

  yunexpress:
    enabled: true  # ✅ 作为备用

  takesend:
    enabled: true  # ✅ 主要物流商
    client_id: "${TAKESEND_CLIENT_ID}"
    auth_token: "${TAKESEND_AUTH_TOKEN}"
```

### 场景3：根据国家选择物流商

```yaml
logistics:
  default_provider: "yunexpress"

  yunexpress:
    enabled: true

  takesend:
    enabled: true

sku_rules:
  country_mapping:
    US: "takesend"  # 美国用泰嘉
    GB: "takesend"  # 英国用泰嘉
    DE: "yunexpress"  # 德国用云途
    FR: "yunexpress"  # 法国用云途
```

---

## 🔍 验证配置

### 检查物流商是否正确加载

```bash
# 运行订单处理，查看日志
python main.py --shop nature --task process_orders

# 查看日志输出
tail -f logs/nature.log
```

**期望看到的日志：**

```
[nature] 云途物流已启用
[nature] 泰嘉物流未启用（可选物流）
[nature] SKU ABC123 使用物流商: yunexpress
```

---

## 📊 配置对比表

| 店铺 | 云途 | 泰嘉 | 默认物流 | 飞书表格 |
|------|------|------|---------|---------|
| 大自然 | ✅ | ❌ | 云途 | `tblWlIrPD6KZCy8U` |
| 迷尚 | ✅ | ✅ | 泰嘉 | `tblalRxohrGovqXK` |
| 金亚龙云途 | ✅ | ❌ | 云途 | `tblao72mWjoXKR6h` |
| 金亚龙泰嘉 | ✅ | ✅ | 泰嘉 | `tblLPCjk3Vs1MLZL` |

---

## ✅ 总结

1. **云途物流** - 所有店铺必须配置（标配）
2. **泰嘉物流** - 可选，只有需要的店铺才配置
3. **飞书 App** - 所有店铺共享（环境变量）
4. **飞书表格** - 每个店铺独立（配置文件）
5. **提交策略** - 使用 `[shop_code]` 标记，只提交修改的店铺配置

这样可以确保：
- ✅ 不使用泰嘉的店铺不会加载泰嘉逻辑
- ✅ 每个店铺有独立的飞书表格
- ✅ 配置清晰，易于维护
- ✅ Git历史清晰，易于追踪
