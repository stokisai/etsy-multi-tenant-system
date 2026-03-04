# 店铺代码使用指南

## 📖 概述

本文档说明如何在代码中识别和处理不同店铺的特定逻辑。

---

## 🔑 店铺标识符

系统使用 **`shop_code`** 作为店铺的唯一标识符：

| 店铺 | shop_code | 配置文件 |
|------|-----------|---------|
| 大自然草柳编 | `nature` | `configs/shops/nature.yaml` |
| 迷尚 | `mishang` | `configs/shops/mishang.yaml` |
| 金亚龙云途 | `jinyalong_yt` | `configs/shops/jinyalong_yt.yaml` |
| 金亚龙泰嘉 | `jinyalong_tj` | `configs/shops/jinyalong_tj.yaml` |
| 张家港 | `zhangjiaggang` | `configs/shops/zhangjiaggang.yaml` |

**命名规则：**
- ✅ 使用小写英文字母
- ✅ 使用下划线分隔单词
- ✅ 简短且有意义
- ❌ 不要使用中文
- ❌ 不要使用空格或特殊字符

---

## 🔧 在代码中使用 shop_code

### 方法1：直接判断 shop_code（简单逻辑）

适用于：只有少数几个店铺需要特殊处理

```python
# core/order_processor.py

class OrderProcessor:
    def __init__(self, shop_code: str, config: dict):
        self.shop_code = shop_code
        self.config = config

    def process_order(self, order_data: dict):
        """处理订单"""

        # 通用逻辑
        self.validate_order(order_data)

        # 🎯 店铺特定逻辑
        if self.shop_code == "mishang":
            # 迷尚店铺：检查易碎品包装
            self.check_fragile_packaging(order_data)

        elif self.shop_code == "jinyalong_yt":
            # 金亚龙云途：检查重量限制
            self.check_weight_limit(order_data)

        elif self.shop_code == "zhangjiaggang":
            # 张家港：同步供应商库存
            self.sync_supplier_inventory(order_data)

        # 继续通用逻辑
        self.submit_to_logistics(order_data)
```

**优点：**
- ✅ 简单直接
- ✅ 易于理解

**缺点：**
- ❌ 店铺多了代码会很长
- ❌ 不够灵活

---

### 方法2：使用配置驱动（推荐）

适用于：大部分场景，通过配置控制行为

```python
# core/order_processor.py

class OrderProcessor:
    def __init__(self, shop_code: str, config: dict):
        self.shop_code = shop_code
        self.config = config
        self.business_rules = config.get('business_rules', {})

    def process_order(self, order_data: dict):
        """处理订单"""

        # 通用逻辑
        self.validate_order(order_data)

        # 🎯 根据配置执行店铺特定逻辑
        order_rules = self.business_rules.get('order_submission', {})

        # 检查是否需要添加备注
        if order_rules.get('add_custom_note', False):
            note = order_rules.get('custom_note', '')
            order_data['note'] = note
            self.log.info(f"[{self.shop_code}] 添加备注: {note}")

        # 检查是否需要保险
        if order_rules.get('insurance_required', False):
            insurance_value = order_rules.get('insurance_value', 50.0)
            order_data['insurance'] = insurance_value
            self.log.info(f"[{self.shop_code}] 添加保险: ${insurance_value}")

        # 继续通用逻辑
        self.submit_to_logistics(order_data)
```

**配置文件：**

```yaml
# configs/shops/mishang.yaml
shop_code: "mishang"

business_rules:
  order_submission:
    add_custom_note: true
    custom_note: "易碎品，请小心处理"
    insurance_required: true
    insurance_value: 50.0
```

**优点：**
- ✅ 灵活，不需要修改代码
- ✅ 易于维护
- ✅ 配置文件清晰

**缺点：**
- ❌ 需要提前设计好配置结构

---

### 方法3：使用插件模式（高级）

适用于：某个店铺有完全不同的业务流程

```python
# modules/plugins/mishang_plugin.py

class MishangPlugin:
    """迷尚店铺专属插件"""

    def __init__(self, config):
        self.config = config

    def before_order_process(self, order_data: dict) -> dict:
        """下单前处理"""
        # 迷尚店铺特殊的易碎品检查
        if self.is_fragile_item(order_data):
            order_data['packaging_type'] = 'reinforced'
            order_data['insurance_required'] = True

        return order_data

    def after_order_process(self, order_data: dict, result: dict) -> dict:
        """下单后处理"""
        # 迷尚店铺特殊的通知逻辑
        self.send_wechat_notification(result)
        return result

    def is_fragile_item(self, order_data: dict) -> bool:
        """判断是否为易碎品"""
        fragile_keywords = ['glass', 'ceramic', 'mirror', '玻璃', '陶瓷', '镜子']
        product_name = order_data.get('product_name', '').lower()
        return any(keyword in product_name for keyword in fragile_keywords)
```

```python
# core/order_processor.py

import importlib

class OrderProcessor:
    def __init__(self, shop_code: str, config: dict):
        self.shop_code = shop_code
        self.config = config

        # 🎯 动态加载店铺插件
        self.plugin = self.load_plugin()

    def load_plugin(self):
        """加载店铺专属插件"""
        try:
            # 尝试导入店铺专属插件
            module_name = f'modules.plugins.{self.shop_code}_plugin'
            plugin_module = importlib.import_module(module_name)

            # 获取插件类
            class_name = f'{self.shop_code.capitalize()}Plugin'
            plugin_class = getattr(plugin_module, class_name)

            self.log.info(f"加载插件: {module_name}")
            return plugin_class(self.config)

        except (ImportError, AttributeError):
            # 如果没有专属插件，返回None
            self.log.debug(f"店铺 {self.shop_code} 没有专属插件")
            return None

    def process_order(self, order_data: dict):
        """处理订单"""

        # 🎯 如果有插件，执行插件的前置处理
        if self.plugin:
            order_data = self.plugin.before_order_process(order_data)

        # 通用处理逻辑
        result = self.submit_to_logistics(order_data)

        # 🎯 如果有插件，执行插件的后置处理
        if self.plugin:
            result = self.plugin.after_order_process(order_data, result)

        return result
```

**优点：**
- ✅ 代码隔离，互不影响
- ✅ 易于维护和测试
- ✅ 支持复杂的业务逻辑

**缺点：**
- ❌ 需要更多的架构设计
- ❌ 文件数量增加

---

## 📂 文件组织结构

```
etsy-multi-tenant-system/
├── configs/
│   └── shops/
│       ├── nature.yaml          # 大自然店铺配置
│       ├── mishang.yaml         # 迷尚店铺配置
│       ├── jinyalong_yt.yaml    # 金亚龙云途配置
│       └── zhangjiaggang.yaml   # 张家港店铺配置
│
├── modules/
│   └── plugins/
│       ├── mishang_plugin.py    # 迷尚店铺插件（可选）
│       ├── jinyalong_plugin.py  # 金亚龙店铺插件（可选）
│       └── base_plugin.py       # 插件基类
│
├── core/
│   ├── order_processor.py       # 订单处理器（读取shop_code）
│   ├── fulfillment.py           # 发货履约处理器
│   └── tracking.py              # 跟踪号处理器
│
└── logs/
    ├── nature.log               # 大自然店铺日志
    ├── mishang.log              # 迷尚店铺日志
    └── jinyalong_yt.log         # 金亚龙云途日志
```

---

## 🚀 Git提交策略

### 场景1：只修改某个店铺的配置

```bash
# 只修改迷尚店铺的配置
nano configs/shops/mishang.yaml

# 提交时明确说明是哪个店铺
git add configs/shops/mishang.yaml
git commit -m "Update mishang shop: add fragile item handling rules"
git push
```

### 场景2：为某个店铺添加新功能

```bash
# 创建迷尚店铺专属插件
nano modules/plugins/mishang_plugin.py

# 提交时明确说明
git add modules/plugins/mishang_plugin.py
git commit -m "Add mishang shop plugin: fragile item detection and special packaging"
git push
```

### 场景3：修改通用代码，但只影响某个店铺

```bash
# 修改订单处理器
nano core/order_processor.py

# 提交时说明影响范围
git add core/order_processor.py
git commit -m "Add weight limit check for jinyalong shop only"
git push
```

### 场景4：同时修改多个店铺

```bash
# 修改多个店铺配置
nano configs/shops/mishang.yaml
nano configs/shops/nature.yaml

# 提交时说明影响的店铺
git add configs/shops/mishang.yaml configs/shops/nature.yaml
git commit -m "Update mishang and nature shops: enable auto tracking return"
git push
```

---

## 📊 提交消息规范

### 格式：`[店铺代码] 操作: 描述`

**示例：**

```bash
# 单个店铺
git commit -m "[mishang] Add: fragile item handling rules"
git commit -m "[nature] Update: logistics channel to USTHPHR"
git commit -m "[jinyalong_yt] Fix: weight calculation error"

# 多个店铺
git commit -m "[mishang,nature] Update: enable auto tracking return"

# 通用功能（影响所有店铺）
git commit -m "[all] Add: new logistics provider support"

# 新增店铺
git commit -m "[new] Add zhangjiaggang shop configuration"
```

---

## 🔍 查看店铺特定的提交历史

```bash
# 查看迷尚店铺相关的提交
git log --grep="mishang" --oneline

# 查看迷尚店铺配置文件的修改历史
git log --follow configs/shops/mishang.yaml

# 查看迷尚店铺插件的修改历史
git log --follow modules/plugins/mishang_plugin.py

# 查看最近10次迷尚店铺相关的提交
git log --grep="mishang" -10 --pretty=format:"%h - %s (%cr)"
```

---

## 🎯 最佳实践

### 1. 配置优先

优先使用配置文件控制店铺行为，而不是硬编码：

```python
# ❌ 不推荐：硬编码
if self.shop_code == "mishang":
    insurance_value = 50.0

# ✅ 推荐：配置驱动
insurance_value = self.business_rules.get('order_submission', {}).get('insurance_value', 0.0)
```

### 2. 日志标记

在日志中始终包含 shop_code：

```python
# ✅ 推荐
self.log.info(f"[{self.shop_code}] 处理订单: {order_id}")
self.log.error(f"[{self.shop_code}] 订单创建失败: {error}")
```

### 3. 插件命名

插件文件名和类名要与 shop_code 对应：

```
shop_code: mishang
文件名: modules/plugins/mishang_plugin.py
类名: MishangPlugin
```

### 4. 提交粒度

每次提交只修改一个店铺的逻辑，除非是通用功能：

```bash
# ✅ 推荐：单店铺提交
git commit -m "[mishang] Add fragile item handling"

# ❌ 不推荐：混合提交
git commit -m "Update mishang and fix nature bug and add new feature"
```

---

## 🧪 测试店铺特定逻辑

```bash
# 测试单个店铺
python main.py --shop mishang --task process_orders

# 查看店铺日志
tail -f logs/mishang.log

# 验证配置
python validate_config.py --shop mishang
```

---

## 📋 总结

| 方法 | 适用场景 | 文件位置 | 提交策略 |
|------|---------|---------|---------|
| **配置驱动** | 大部分场景 | `configs/shops/{shop_code}.yaml` | 只提交配置文件 |
| **代码判断** | 简单逻辑 | `core/*.py` | 提交时注明店铺 |
| **插件模式** | 复杂逻辑 | `modules/plugins/{shop_code}_plugin.py` | 只提交插件文件 |

**推荐流程：**
1. 优先使用配置驱动
2. 简单逻辑用代码判断
3. 复杂逻辑用插件模式
4. 提交时明确标注店铺代码
5. 保持提交粒度小而清晰
