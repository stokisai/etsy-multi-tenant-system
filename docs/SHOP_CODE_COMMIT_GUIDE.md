# 店铺代码修改和提交指南

## 🎯 快速开始

### 方法1：使用自动化脚本（推荐）

```bash
# 1. 修改代码
vim plugins/shops/mishang/order_logic.py

# 2. 使用脚本提交
./scripts/shop_commit.sh mishang Add 1.2.0 "add fragile item detection"

# 完成！脚本会自动：
# - 添加文件
# - 创建提交
# - 打标签
# - 推送到 GitHub
# - Railway 自动部署
```

### 方法2：手动提交

```bash
# 1. 修改代码
vim plugins/shops/mishang/order_logic.py

# 2. 查看修改
git diff plugins/shops/mishang/

# 3. 添加文件
git add plugins/shops/mishang/

# 4. 提交
git commit -m "[mishang] Add: fragile item detection v1.2.0"

# 5. 打标签
git tag mishang-v1.2.0

# 6. 推送
git push && git push --tags
```

---

## 📝 详细步骤

### 步骤1：修改代码

```bash
cd /Users/stokist/etsy-multi-tenant-system

# 修改迷尚店铺的代码
vim plugins/shops/mishang/order_logic.py

# 或者修改大自然店铺的代码
vim plugins/shops/nature/order_logic.py
```

### 步骤2：查看修改

```bash
# 查看修改了什么
git diff plugins/shops/mishang/

# 查看修改的文件列表
git status
```

### 步骤3：决定版本号

```bash
# 查看当前最新版本
git tag -l "mishang-v*" | tail -1

# 输出例如: mishang-v1.1.0
# 那么新版本应该是:
# - v1.2.0 (如果是新功能)
# - v1.1.1 (如果是 bug 修复)
# - v2.0.0 (如果是重大变更)
```

**版本号规则：**
- 修复 bug → patch +1：`v1.1.0` → `v1.1.1`
- 添加新功能 → minor +1：`v1.1.0` → `v1.2.0`
- 重大重构 → major +1：`v1.1.0` → `v2.0.0`

### 步骤4：使用脚本提交（推荐）

```bash
./scripts/shop_commit.sh <shop_code> <type> <version> <description>
```

**参数说明：**
- `shop_code`: 店铺代码（mishang, nature, jinyalong）
- `type`: 提交类型（Add, Update, Fix, Refactor, Remove）
- `version`: 版本号（1.2.0）
- `description`: 简短描述（用引号包裹）

**示例：**
```bash
# 添加新功能
./scripts/shop_commit.sh mishang Add 1.2.0 "add fragile item detection"

# 修复 bug
./scripts/shop_commit.sh nature Fix 1.1.1 "fix SKU matching logic"

# 更新功能
./scripts/shop_commit.sh jinyalong Update 1.3.0 "improve order validation"

# 重构代码
./scripts/shop_commit.sh mishang Refactor 2.0.0 "rewrite order processing"
```

### 步骤5：验证部署

```bash
# 查看 Railway 日志（在 Railway 网站上）
# 或者等待几分钟后测试

# 本地测试（可选）
python main.py --shop mishang --task process_orders --dry-run
```

---

## 🔍 常用命令

### 查看版本历史

```bash
# 查看某个店铺的所有版本
git tag -l "mishang-v*"

# 查看某个店铺的提交历史
git log --grep="mishang" --oneline

# 查看最近5个版本
git tag -l "mishang-v*" | tail -5
```

### 查看代码差异

```bash
# 查看当前未提交的修改
git diff plugins/shops/mishang/

# 查看两个版本之间的差异
git diff mishang-v1.1.0..mishang-v1.2.0

# 查看某个版本的详细信息
git show mishang-v1.2.0
```

### 回滚到之前的版本

```bash
# 1. 查看版本历史
git tag -l "mishang-v*"

# 2. 回滚到指定版本
git checkout mishang-v1.1.0 -- plugins/shops/mishang/

# 3. 提交回滚
git add plugins/shops/mishang/
git commit -m "[mishang] Rollback: to v1.1.0"

# 4. 推送
git push
```

---

## 📋 提交类型说明

| 类型 | 说明 | 版本号变化 | 示例 |
|------|------|-----------|------|
| `Add` | 添加新功能 | minor +1 | 添加易碎品检查 |
| `Update` | 更新现有功能 | minor +1 | 改进 SKU 匹配规则 |
| `Fix` | 修复 bug | patch +1 | 修复保险金额计算错误 |
| `Refactor` | 重构代码 | major +1 | 重写订单处理逻辑 |
| `Remove` | 删除功能 | major +1 | 移除旧的验证逻辑 |

---

## 🎯 实际案例

### 案例1：迷尚店铺添加易碎品检查

```bash
# 1. 修改代码
vim plugins/shops/mishang/order_logic.py

# 添加以下代码：
# def is_fragile_item(self, sku):
#     fragile_keywords = ['vase', 'glass', 'ceramic']
#     return any(keyword in sku.lower() for keyword in fragile_keywords)

# 2. 使用脚本提交
./scripts/shop_commit.sh mishang Add 1.2.0 "add fragile item detection"

# 3. Railway 自动部署
# 4. 完成！
```

### 案例2：大自然店铺修复 SKU 匹配 bug

```bash
# 1. 修改代码
vim plugins/shops/nature/order_logic.py

# 修复 SKU 匹配逻辑

# 2. 使用脚本提交
./scripts/shop_commit.sh nature Fix 1.1.1 "fix SKU matching for Nature-2024 products"

# 3. Railway 自动部署
# 4. 完成！
```

### 案例3：金亚龙店铺重构订单验证

```bash
# 1. 修改代码
vim plugins/shops/jinyalong/order_logic.py

# 重写订单验证逻辑

# 2. 使用脚本提交
./scripts/shop_commit.sh jinyalong Refactor 2.0.0 "rewrite order validation pipeline"

# 3. Railway 自动部署
# 4. 完成！
```

---

## ⚠️ 注意事项

### 1. 推送前先拉取

```bash
# 每次修改前先拉取最新代码
git pull
```

### 2. 只提交相关文件

```bash
# ✅ 正确：只添加修改的店铺文件
git add plugins/shops/mishang/

# ❌ 错误：添加所有文件
git add .
```

### 3. 版本号不要重复

```bash
# 查看已有版本，避免重复
git tag -l "mishang-v*"
```

### 4. 提交信息要清晰

```bash
# ✅ 正确：清晰的提交信息
[mishang] Add: fragile item detection v1.2.0

# ❌ 错误：模糊的提交信息
update code
```

---

## 🚀 与普通提交的对比

### 普通提交（不推荐用于店铺代码）

```bash
git add .
git commit -m "update code"
git push
```

**问题：**
- ❌ 不知道修改了哪个店铺
- ❌ 没有版本号
- ❌ 无法追踪版本历史
- ❌ 难以回滚

### 店铺特定提交（推荐）

```bash
./scripts/shop_commit.sh mishang Add 1.2.0 "add fragile item detection"
```

**优势：**
- ✅ 清楚标记了店铺代码
- ✅ 有明确的版本号
- ✅ 可以追踪版本历史
- ✅ 容易回滚到任何版本
- ✅ 提交信息规范统一

---

## 📚 相关文档

- [店铺特定代码管理](./SHOP_SPECIFIC_CODE_MANAGEMENT.md)
- [插件开发指南](./PLUGIN_DEVELOPMENT.md)
- [Git 提交规范](./GIT_COMMIT_GUIDE.md)

---

## ❓ 常见问题

### Q1: 我修改了代码，但忘记版本号是多少了？

```bash
# 查看当前最新版本
git tag -l "mishang-v*" | tail -1

# 输出: mishang-v1.1.0
# 那么新版本应该是 v1.2.0 或 v1.1.1
```

### Q2: 我提交错了，怎么撤销？

```bash
# 如果还没推送
git reset --soft HEAD~1

# 如果已经推送，需要回滚
git revert HEAD
git push
```

### Q3: Railway 多久会部署新代码？

通常在推送后 1-3 分钟内自动部署。可以在 Railway 网站查看部署日志。

### Q4: 我可以同时修改多个店铺的代码吗？

可以，但建议分开提交：

```bash
# 修改迷尚店铺
./scripts/shop_commit.sh mishang Add 1.2.0 "add feature A"

# 修改大自然店铺
./scripts/shop_commit.sh nature Add 1.3.0 "add feature B"
```

### Q5: 脚本提交和手动提交有什么区别？

脚本提交会自动：
- 验证参数格式
- 检查文件是否存在
- 显示版本历史
- 创建规范的提交信息
- 打标签
- 推送

手动提交需要自己完成所有步骤。

---

## 🎉 总结

**最简单的流程：**

1. 修改代码
2. 运行脚本：`./scripts/shop_commit.sh mishang Add 1.2.0 "description"`
3. Railway 自动部署
4. 完成！

**记住：**
- ✅ 使用脚本提交（简单快速）
- ✅ 版本号要递增
- ✅ 提交信息要清晰
- ✅ 推送后 Railway 自动部署
