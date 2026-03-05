# 店铺特定代码管理指南

## 🎯 架构说明

### 为什么需要店铺特定代码？

每个店铺的业务逻辑可能不同：
- **大自然店铺**：标准流程
- **迷尚店铺**：需要易碎品检查
- **金亚龙店铺**：特殊的库存验证

当配置文件无法满足需求时，需要编写店铺特定的代码。

---

## 📂 目录结构

```
etsy-multi-tenant-system/
├── core/                      # 通用核心代码
│   ├── order_processor.py     # 标准订单处理器
│   └── fulfillment.py         # 标准发货履约
│
├── plugins/                   # 插件系统
│   ├── __init__.py
│   ├── base.py               # 插件基类
│   └── shops/                # 店铺特定插件
│       ├── template/         # 插件模板（示例）
│       │   ├── __init__.py
│       │   ├── order_plugin.py
│       │   └── README.md
│       ├── nature/           # 大自然店铺插件
│       │   ├── __init__.py
│       │   └── order_plugin.py
│       └── mishang/          # 迷尚店铺插件
│           ├── __init__.py
│           └── order_plugin.py
│
└── configs/shops/            # 店铺配置（不在 Git 中）
    ├── nature.yaml           # 配置中指定使用哪些插件
    └── mishang.yaml
```

---

## 🔧 使用方式

### 1. 创建店铺特定插件

```bash
# 复制模板
cp -r plugins/shops/template plugins/shops/your_shop

# 编辑插件代码
vim plugins/shops/your_shop/order_plugin.py
```

### 2. 在配置文件中启用插件

```yaml
# configs/shops/your_shop.yaml

# 插件配置
plugins:
  enabled: true
  order_processing:
    - "plugins.shops.your_shop.order_plugin.CustomOrderProcessor"
  fulfillment:
    - "plugins.shops.your_shop.fulfillment_plugin.CustomFulfillment"
```

### 3. 插件代码示例

```python
# plugins/shops/mishang/order_plugin.py

from plugins.base import OrderProcessorPlugin

class MishangOrderProcessor(OrderProcessorPlugin):
    """迷尚店铺特定的订单处理逻辑"""

    def before_submit(self, order_data):
        """提交订单前的钩子"""
        # 检查是否是易碎品
        if self.is_fragile_item(order_data['sku']):
            order_data['notes'] = "易碎品，请小心处理"
            order_data['insurance_required'] = True

        return order_data

    def after_submit(self, order_data, result):
        """提交订单后的钩子"""
        # 发送微信通知
        self.send_wechat_notification(order_data, result)

        return result

    def is_fragile_item(self, sku):
        """判断是否是易碎品"""
        fragile_keywords = ['vase', 'glass', 'ceramic']
        return any(keyword in sku.lower() for keyword in fragile_keywords)
```

---

## 📝 版本管理策略

### Git 提交规范

```bash
# 修改店铺特定代码时，使用店铺代码作为前缀
git add plugins/shops/mishang/
git commit -m "[mishang] Update: add fragile item detection v1.2.0"

# 为店铺代码打标签
git tag mishang-v1.2.0
git push && git push --tags
```

### 版本号规范

使用语义化版本号：`{shop_code}-v{major}.{minor}.{patch}`

- **major**：重大功能变更（如完全重写下单逻辑）
- **minor**：新增功能（如添加新的验证规则）
- **patch**：Bug 修复（如修复某个判断条件）

**示例：**
```bash
nature-v1.0.0   # 大自然店铺初始版本
nature-v1.1.0   # 添加新的 SKU 规则
nature-v1.1.1   # 修复 SKU 匹配 bug
nature-v2.0.0   # 重构订单处理逻辑

mishang-v1.0.0  # 迷尚店铺初始版本
mishang-v1.2.0  # 添加易碎品检查
mishang-v1.2.1  # 修复易碎品判断逻辑
```

### 查看店铺代码历史

```bash
# 查看某个店铺的所有修改
git log --grep="mishang" --oneline

# 查看某个店铺的代码变更
git log --follow plugins/shops/mishang/

# 查看某个店铺的所有版本标签
git tag -l "mishang-*"

# 回滚到某个版本
git checkout mishang-v1.2.0 -- plugins/shops/mishang/
```

---

## 🚀 Railway 部署

### 自动部署流程

```
本地修改店铺代码
    ↓
git commit -m "[mishang] Update: ..."
    ↓
git push
    ↓
Railway 自动检测到更新
    ↓
自动重新部署
    ↓
新代码生效
```

### 部署验证

```bash
# 推送后检查 Railway 日志
# 确认部署成功

# 测试店铺特定逻辑
python main.py --shop mishang --task process_orders --dry-run
```

---

## 🔐 隐私保护

### 方案1：私有仓库（推荐）

如果店铺特定代码包含商业机密：

```bash
# 将仓库设为私有
gh repo edit stokisai/etsy-multi-tenant-system --visibility private
```

**优势：**
- ✅ 所有代码都有版本管理
- ✅ Railway 可以访问私有仓库
- ✅ 商业逻辑不会泄露

### 方案2：.gitignore 排除

如果只想公开通用代码：

```gitignore
# .gitignore

# 排除店铺特定代码（除了模板）
plugins/shops/*
!plugins/shops/template/
```

**缺点：**
- ❌ 店铺特定代码没有版本管理
- ❌ Railway 无法自动部署店铺特定代码
- ❌ 需要手动同步代码到 Railway

---

## 📊 实际案例

### 案例1：迷尚店铺添加易碎品检查

**需求：** 迷尚店铺销售易碎品，需要在下单时添加特殊备注和保险。

**实现步骤：**

1. 创建插件：
```bash
mkdir -p plugins/shops/mishang
```

2. 编写代码：
```python
# plugins/shops/mishang/order_plugin.py
class MishangOrderProcessor(OrderProcessorPlugin):
    def before_submit(self, order_data):
        if self.is_fragile_item(order_data['sku']):
            order_data['notes'] = "易碎品，请小心处理"
            order_data['insurance_required'] = True
            order_data['insurance_value'] = 50.0
        return order_data
```

3. 提交代码：
```bash
git add plugins/shops/mishang/
git commit -m "[mishang] Add: fragile item detection and insurance v1.2.0"
git tag mishang-v1.2.0
git push && git push --tags
```

4. Railway 自动部署，新逻辑生效。

---

### 案例2：大自然店铺修改 SKU 匹配规则

**需求：** 大自然店铺的 SKU 规则发生变化，需要更新匹配逻辑。

**实现步骤：**

1. 修改代码：
```python
# plugins/shops/nature/order_plugin.py
class NatureOrderProcessor(OrderProcessorPlugin):
    def get_logistics_provider(self, sku):
        # 新的 SKU 规则
        if sku.startswith('Nature-2024'):
            return 'yunexpress'
        elif sku.startswith('XCFQ'):
            return 'yunexpress'
        else:
            return self.config['logistics']['default_provider']
```

2. 提交代码：
```bash
git add plugins/shops/nature/order_plugin.py
git commit -m "[nature] Update: SKU matching rules for 2024 products v1.1.0"
git tag nature-v1.1.0
git push && git push --tags
```

3. Railway 自动部署。

---

## 🎯 最佳实践

### 1. 代码组织

- ✅ 每个店铺一个独立的插件目录
- ✅ 插件代码保持简洁，只包含特殊逻辑
- ✅ 通用逻辑放在 `core/` 目录

### 2. 版本管理

- ✅ 每次修改都提交到 Git
- ✅ 使用语义化版本号
- ✅ 重要版本打标签
- ✅ 提交信息使用 `[shop_code]` 前缀

### 3. 测试

- ✅ 修改后先在本地测试
- ✅ 使用 `--dry-run` 模式验证
- ✅ 推送到 Railway 后再次验证

### 4. 文档

- ✅ 在插件目录中添加 README.md
- ✅ 说明插件的功能和使用方法
- ✅ 记录版本变更历史

---

## 📚 相关文档

- [插件开发指南](./PLUGIN_DEVELOPMENT.md)
- [店铺配置指南](./NEW_SHOP_INFO_CHECKLIST.md)
- [Git 提交规范](./GIT_COMMIT_GUIDE.md)

---

## ❓ 常见问题

### Q1: 店铺特定代码会影响其他店铺吗？
**A:** 不会。每个店铺的插件是独立的，只在该店铺运行时加载。

### Q2: 如何回滚到之前的版本？
**A:** 使用 Git 标签：
```bash
git checkout mishang-v1.1.0 -- plugins/shops/mishang/
git commit -m "[mishang] Rollback: to v1.1.0"
git push
```

### Q3: Railway 会自动部署店铺特定代码吗？
**A:** 会的。只要代码在 Git 仓库中，Railway 就会自动部署。

### Q4: 如果不想公开店铺特定代码怎么办？
**A:** 将整个仓库设为私有，或者使用 Git submodules。
