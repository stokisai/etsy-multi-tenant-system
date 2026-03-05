# 店铺代码提交 - 超简单版

## 🎯 你只需要做3步

### 1. 修改代码
```bash
vim plugins/shops/mishang/order_logic.py
```

### 2. 提交（只需要店铺ID）
```bash
git add plugins/shops/mishang/
git commit -m "[mishang] 修改了订单逻辑"
```

### 3. 推送
```bash
git push && git push --tags
```

**就这么简单！系统会自动：**
- ✅ 自动识别店铺代码（从 `[mishang]` 识别）
- ✅ 自动生成版本号（根据上一个版本递增）
- ✅ 自动在提交信息中添加版本号
- ✅ 自动创建 Git 标签
- ✅ Railway 自动部署

---

## 📝 提交信息格式

**只需要遵循一个规则：以 `[shop_code]` 开头**

```bash
# ✅ 正确格式
git commit -m "[mishang] 添加易碎品检查"
git commit -m "[nature] 修复SKU匹配bug"
git commit -m "[jinyalong] 更新订单验证逻辑"

# ❌ 错误格式（不会触发自动化）
git commit -m "修改代码"
git commit -m "mishang: 添加功能"
```

---

## 🔄 自动化规则

### 版本号自动递增规则

**提交类型识别：**
- 包含 `Add`、`Update`、`Refactor` → minor 版本 +1
- 其他（`Fix`、`修复`等）→ patch 版本 +1

**示例：**
```bash
# 当前版本: mishang-v1.1.0

# 添加新功能
git commit -m "[mishang] Add 易碎品检查"
# 自动变成: [mishang] Add 易碎品检查 v1.2.0
# 自动创建标签: mishang-v1.2.0

# 修复bug
git commit -m "[mishang] Fix 保险金额计算错误"
# 自动变成: [mishang] Fix 保险金额计算错误 v1.2.1
# 自动创建标签: mishang-v1.2.1

# 更新功能
git commit -m "[mishang] Update SKU规则"
# 自动变成: [mishang] Update SKU规则 v1.3.0
# 自动创建标签: mishang-v1.3.0
```

---

## 🎬 完整示例

### 场景：修改迷尚店铺的订单逻辑

```bash
# 1. 进入项目目录
cd /Users/stokist/etsy-multi-tenant-system

# 2. 拉取最新代码
git pull

# 3. 修改代码
vim plugins/shops/mishang/order_logic.py

# 4. 查看修改（可选）
git diff plugins/shops/mishang/

# 5. 添加文件
git add plugins/shops/mishang/

# 6. 提交（只需要店铺ID）
git commit -m "[mishang] Add 易碎品检查功能"

# 输出：
# ✅ 自动添加版本号: v1.2.0
# ✅ 自动创建标签: mishang-v1.2.0

# 7. 推送
git push && git push --tags

# 8. Railway 自动部署
# 完成！
```

---

## 🔍 查看版本历史

```bash
# 查看某个店铺的所有版本
git tag -l "mishang-v*"

# 查看某个店铺的提交历史
git log --grep="mishang" --oneline

# 查看最新版本
git tag -l "mishang-v*" | tail -1
```

---

## ⚠️ 注意事项

### 1. 提交信息必须以 `[shop_code]` 开头

```bash
# ✅ 正确
git commit -m "[mishang] 修改逻辑"

# ❌ 错误（不会触发自动化）
git commit -m "mishang 修改逻辑"
git commit -m "修改迷尚店铺逻辑"
```

### 2. 店铺代码必须是小写

```bash
# ✅ 正确
[mishang]
[nature]
[jinyalong]

# ❌ 错误
[Mishang]
[NATURE]
[JinYaLong]
```

### 3. 推送时记得推送标签

```bash
# ✅ 正确（同时推送代码和标签）
git push && git push --tags

# ❌ 错误（只推送代码，标签不会推送）
git push
```

---

## 🎯 与之前的对比

### 之前（复杂）

```bash
# 1. 修改代码
vim plugins/shops/mishang/order_logic.py

# 2. 查看当前版本
git tag -l "mishang-v*" | tail -1

# 3. 决定新版本号
# 假设当前是 v1.1.0，新版本是 v1.2.0

# 4. 提交
git add plugins/shops/mishang/
git commit -m "[mishang] Add: fragile item detection v1.2.0"

# 5. 打标签
git tag mishang-v1.2.0

# 6. 推送
git push && git push --tags
```

### 现在（简单）

```bash
# 1. 修改代码
vim plugins/shops/mishang/order_logic.py

# 2. 提交（系统自动处理版本号和标签）
git add plugins/shops/mishang/
git commit -m "[mishang] Add 易碎品检查"

# 3. 推送
git push && git push --tags
```

**节省了：**
- ❌ 不需要手动查看当前版本
- ❌ 不需要手动决定新版本号
- ❌ 不需要手动在提交信息中添加版本号
- ❌ 不需要手动打标签

---

## 🚀 Railway 自动部署

推送后，Railway 会自动：
1. 检测到 Git 仓库更新
2. 拉取最新代码
3. 重新部署
4. 新代码生效（通常 1-3 分钟）

---

## 📚 技术实现

系统使用了 Git Hooks 实现自动化：

- **prepare-commit-msg hook**: 在提交前自动添加版本号
- **post-commit hook**: 在提交后自动创建标签

这些 hooks 已经配置在 `.git/hooks/` 目录中，会自动执行。

---

## ❓ 常见问题

### Q1: 如果我不想要自动版本号怎么办？

在提交信息中手动指定版本号：
```bash
git commit -m "[mishang] Add 易碎品检查 v2.0.0"
# 系统会使用你指定的版本号，不会自动生成
```

### Q2: 如果我提交的不是店铺代码怎么办？

不以 `[shop_code]` 开头的提交不会触发自动化：
```bash
git commit -m "Update README"
# 正常提交，不会自动添加版本号和标签
```

### Q3: 我可以修改自动化规则吗？

可以，编辑这两个文件：
- `.git/hooks/prepare-commit-msg`
- `.git/hooks/post-commit`

### Q4: 如果自动生成的版本号不对怎么办？

可以在提交后手动修改标签：
```bash
# 删除错误的标签
git tag -d mishang-v1.2.0

# 创建正确的标签
git tag mishang-v1.3.0

# 推送
git push --tags --force
```

---

## 🎉 总结

**最简单的流程：**

1. 修改代码
2. `git commit -m "[mishang] 描述"`
3. `git push && git push --tags`

**系统自动完成：**
- ✅ 版本号生成
- ✅ 标签创建
- ✅ Railway 部署

**你只需要记住：提交信息以 `[shop_code]` 开头！**
