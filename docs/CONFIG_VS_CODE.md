# 店铺配置 vs 店铺代码 - 重要区别

## 🎯 核心概念

### 两种不同的"店铺文件"

| 类型 | 位置 | 内容 | 是否提交 | 用途 |
|------|------|------|---------|------|
| **店铺配置** | `configs/shops/*.yaml` | 飞书 Table ID、邮箱密码、SKU 规则 | ❌ 不提交 | 配置数据 |
| **店铺代码** | `plugins/shops/*/` | Python 代码、业务逻辑 | ✅ 提交 | 特定逻辑 |

---

## 📂 店铺配置文件（不提交）

### 位置
```
configs/shops/
├── template.yaml    # ✅ 模板（提交）
├── mishang.yaml     # ❌ 不提交
├── nature.yaml      # ❌ 不提交
└── jinyalong.yaml   # ❌ 不提交
```

### 内容示例
```yaml
# configs/shops/mishang.yaml

shop_code: "mishang"
shop_name: "迷尚店铺"

feishu:
  app_token: "bascnxxxxxx"  # 商业信息
  table_id: "tblxxxxxx"     # 商业信息

email:
  address: "mishang@example.com"
  password: "app_password_here"  # 敏感信息

sku_rules:
  prefix_mapping:
    "MS-": "yunexpress"  # 商业规则
```

### 为什么不提交？
- ✅ 包含商业信息（飞书 Table ID、SKU 规则）
- ✅ 包含敏感信息（邮箱密码）
- ✅ 每个店铺不同，不需要共享
- ✅ 已被 `.gitignore` 排除

### 如何使用？
```bash
# 在本地创建配置文件
cp configs/shops/template.yaml configs/shops/mishang.yaml
vim configs/shops/mishang.yaml

# 不需要提交，直接使用
python main.py --shop mishang --task process_orders
```

---

## 🔧 店铺特定代码（提交）

### 位置
```
plugins/shops/
├── template/           # ✅ 模板（提交）
│   └── order_plugin.py
├── mishang/            # ✅ 提交
│   └── order_logic.py
├── nature/             # ✅ 提交
│   └── order_logic.py
└── jinyalong/          # ✅ 提交
    └── order_logic.py
```

### 内容示例
```python
# plugins/shops/mishang/order_logic.py

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

    def is_fragile_item(self, sku):
        """判断是否是易碎品"""
        fragile_keywords = ['vase', 'glass', 'ceramic']
        return any(keyword in sku.lower() for keyword in fragile_keywords)
```

### 为什么要提交？
- ✅ 包含业务逻辑代码
- ✅ 需要版本管理
- ✅ Railway 需要部署
- ✅ 可以追踪修改历史

### 如何使用？
```bash
# 1. 修改代码
vim plugins/shops/mishang/order_logic.py

# 2. 提交到 Git
git add plugins/shops/mishang/
git commit -m "[mishang] Add 易碎品检查"

# 3. 推送到 GitHub
git push && git push --tags

# 4. Railway 自动部署
```

---

## 🎯 实际场景

### 场景1：新开一个店铺

**步骤1：创建配置文件（不提交）**
```bash
cp configs/shops/template.yaml configs/shops/newshop.yaml
vim configs/shops/newshop.yaml
# 填入飞书 Table ID、邮箱密码等
```

**步骤2：如果需要特定逻辑，创建代码（提交）**
```bash
mkdir -p plugins/shops/newshop
vim plugins/shops/newshop/order_logic.py
# 编写特定逻辑

git add plugins/shops/newshop/
git commit -m "[newshop] Add initial order logic v1.0.0"
git push && git push --tags
```

---

### 场景2：修改店铺配置

```bash
# 修改配置文件
vim configs/shops/mishang.yaml

# ❌ 不要提交！
# 配置文件被 .gitignore 排除，这是正确的

# 直接使用新配置
python main.py --shop mishang --task process_orders
```

---

### 场景3：修改店铺代码

```bash
# 修改代码
vim plugins/shops/mishang/order_logic.py

# ✅ 应该提交！
git add plugins/shops/mishang/
git commit -m "[mishang] Update 易碎品检查逻辑"
git push && git push --tags

# Railway 自动部署新代码
```

---

## 📊 对比表格

| 操作 | 店铺配置 | 店铺代码 |
|------|---------|---------|
| 修改飞书 Table ID | ✅ 修改 `configs/shops/mishang.yaml` | ❌ |
| 修改邮箱密码 | ✅ 修改 `configs/shops/mishang.yaml` | ❌ |
| 修改 SKU 规则 | ✅ 修改 `configs/shops/mishang.yaml` | ❌ |
| 添加易碎品检查逻辑 | ❌ | ✅ 修改 `plugins/shops/mishang/order_logic.py` |
| 修改订单验证逻辑 | ❌ | ✅ 修改 `plugins/shops/mishang/order_logic.py` |
| 是否提交到 Git | ❌ 不提交 | ✅ 提交 |
| 是否需要版本号 | ❌ 不需要 | ✅ 需要 |
| Railway 是否需要 | ❌ 不需要 | ✅ 需要 |

---

## ⚠️ 常见误区

### 误区1：想提交配置文件

```bash
# ❌ 错误
git add configs/shops/mishang.yaml
# 输出: The following paths are ignored by one of your .gitignore files

# ✅ 正确
# 配置文件不应该提交，这是正确的行为
```

### 误区2：不提交店铺代码

```bash
# ❌ 错误
vim plugins/shops/mishang/order_logic.py
# 修改后不提交

# ✅ 正确
git add plugins/shops/mishang/
git commit -m "[mishang] Update logic"
git push && git push --tags
```

### 误区3：混淆配置和代码

```bash
# ❌ 错误：把业务逻辑写在配置文件中
# configs/shops/mishang.yaml
custom_logic: "if sku.startswith('MS-'): ..."

# ✅ 正确：业务逻辑写在代码文件中
# plugins/shops/mishang/order_logic.py
def get_logistics_provider(self, sku):
    if sku.startswith('MS-'):
        return 'yunexpress'
```

---

## 🎯 快速判断

**问自己：我修改的是什么？**

1. **修改的是数据（Table ID、密码、SKU 前缀）？**
   - → 修改 `configs/shops/*.yaml`
   - → ❌ 不提交

2. **修改的是逻辑（Python 代码、判断条件）？**
   - → 修改 `plugins/shops/*/order_logic.py`
   - → ✅ 提交

---

## 📚 相关文档

- [超简单提交指南](./SIMPLE_COMMIT_GUIDE.md) - 如何提交店铺代码
- [店铺特定代码管理](./SHOP_SPECIFIC_CODE_MANAGEMENT.md) - 架构说明
- [新店铺配置指南](./NEW_SHOP_INFO_CHECKLIST.md) - 如何创建配置文件

---

## ❓ 常见问题

### Q1: 我修改了配置文件，为什么 git status 看不到？

**A:** 因为配置文件被 `.gitignore` 排除了，这是正确的。配置文件不应该提交。

### Q2: 我想让 Railway 使用新的配置怎么办？

**A:** Railway 的配置通过环境变量设置，不是通过配置文件。店铺特定的配置（如 Table ID）应该在 Railway 的环境变量中设置。

### Q3: 如果我想共享配置文件怎么办？

**A:** 不建议共享配置文件（包含敏感信息）。如果确实需要，可以：
1. 创建一个私有的配置仓库
2. 使用加密工具（如 git-crypt）
3. 或者只共享模板，每个人填入自己的信息

### Q4: 我可以把配置文件提交到 Git 吗？

**A:** 技术上可以（修改 `.gitignore`），但**强烈不建议**：
- 配置文件包含商业信息和敏感信息
- 如果仓库是公开的，信息会泄露
- 即使是私有仓库，也有安全风险

---

## 🎉 总结

**记住这个简单规则：**

- 📝 **配置文件**（YAML）→ ❌ 不提交
- 💻 **代码文件**（Python）→ ✅ 提交

**提交时使用：**
```bash
git commit -m "[shop_code] 描述"
```

系统会自动添加版本号和标签！
