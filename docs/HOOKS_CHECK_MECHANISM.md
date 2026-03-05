# Git Hooks 安装检查机制

## 🎯 问题

**用户担心：** 在新电脑/新店铺上忘记安装 Git Hooks，导致版本管理混乱。

**后果：**
- 提交时不会自动添加版本号
- 不会自动创建标签
- 版本历史混乱
- 难以追踪店铺代码变更

---

## ✅ 解决方案

我们创建了**三层保护机制**，确保不会忘记安装 hooks：

### 1. README 强调（第一层）

在 README 的显眼位置强调必须安装 hooks：

```markdown
### ⚠️ 重要：首次使用必须安装 Git Hooks

在新电脑上克隆仓库后，必须先安装 Git Hooks（只需一次）：

./scripts/install_hooks.sh
```

### 2. 检查脚本（第二层）

提供独立的检查脚本：

```bash
# 检查 hooks 是否已安装
./scripts/check_hooks.sh

# 输出：
# ✓ prepare-commit-msg 已安装
# ✓ post-commit 已安装
# ✓ Git Hooks 已正确安装
```

如果未安装，会显示警告并询问是否继续。

### 3. main.py 自动检查（第三层）

在 `main.py` 启动时自动检查：

```python
def check_git_hooks():
    """检查 Git Hooks 是否已安装"""
    # 检查 hooks 文件是否存在
    # 如果未安装，显示警告并询问是否继续
```

每次运行系统时都会检查，确保不会遗漏。

---

## 📋 完整流程

### 新电脑/新店铺的标准流程

```bash
# 1. 克隆仓库
git clone https://github.com/stokisai/etsy-multi-tenant-system.git
cd etsy-multi-tenant-system

# 2. 安装 Git Hooks（必须！）
./scripts/install_hooks.sh

# 输出：
# === Git Hooks 安装工具 ===
# 正在安装 Git Hooks...
# ✅ 已安装: prepare-commit-msg
# ✅ 已安装: post-commit
# 🎉 Git Hooks 安装完成！

# 3. 检查是否安装成功（可选）
./scripts/check_hooks.sh

# 输出：
# ✓ prepare-commit-msg 已安装
# ✓ post-commit 已安装
# ✓ Git Hooks 已正确安装

# 4. 安装依赖
pip install -r requirements.txt

# 5. 创建店铺配置
cp configs/shops/template.yaml configs/shops/newshop.yaml
vim configs/shops/newshop.yaml

# 6. 开始使用
python main.py --shop newshop --task process_orders
```

---

## 🔍 如果忘记安装会怎样？

### 场景1：运行 main.py

```bash
python main.py --shop newshop --task process_orders

# 输出：
# ======================================================================
# ⚠️  警告: Git Hooks 未安装！
# ======================================================================
#
# Git Hooks 用于自动管理版本号和标签。
# 没有 hooks，提交店铺代码时不会自动添加版本号。
#
# 缺少以下 hooks:
#   - prepare-commit-msg
#   - post-commit
#
# 请运行以下命令安装:
#   ./scripts/install_hooks.sh
#
# ======================================================================
#
# 是否继续运行（不推荐）? (y/N):
```

用户必须明确选择是否继续，不会无意中遗漏。

### 场景2：运行检查脚本

```bash
./scripts/check_hooks.sh

# 输出：
# ======================================================================
#   检查 Git Hooks 安装状态
# ======================================================================
#
# ✗ prepare-commit-msg 未安装
# ✗ post-commit 未安装
#
# ======================================================================
#   ⚠️  警告: Git Hooks 未安装！
# ======================================================================
#
# Git Hooks 用于自动管理版本号和标签。
# 没有 hooks，提交店铺代码时不会自动添加版本号。
#
# 请运行以下命令安装:
#   ./scripts/install_hooks.sh
#
# ======================================================================
#
# 是否继续运行（不推荐）? (y/N):
```

---

## 📊 保护机制对比

| 保护层 | 触发时机 | 强制性 | 用户体验 |
|--------|---------|-------|---------|
| **README 强调** | 阅读文档时 | ❌ 提醒 | 被动 |
| **检查脚本** | 手动运行时 | ⚠️ 询问 | 主动 |
| **main.py 检查** | 每次运行时 | ⚠️ 询问 | 自动 |

---

## 🎯 最佳实践

### 推荐的新店铺开通流程

1. **克隆仓库**
   ```bash
   git clone https://github.com/stokisai/etsy-multi-tenant-system.git
   cd etsy-multi-tenant-system
   ```

2. **立即安装 hooks**（第一件事！）
   ```bash
   ./scripts/install_hooks.sh
   ```

3. **验证安装**
   ```bash
   ./scripts/check_hooks.sh
   ```

4. **继续其他配置**
   ```bash
   pip install -r requirements.txt
   # ... 其他步骤
   ```

---

## 🔧 技术实现

### 检查逻辑

```python
def check_git_hooks():
    """检查 Git Hooks 是否已安装"""
    project_root = Path(__file__).parent
    hooks_dir = project_root / ".git" / "hooks"

    # 如果不是 Git 仓库，跳过检查
    if not hooks_dir.exists():
        return

    required_hooks = ["prepare-commit-msg", "post-commit"]
    missing_hooks = [h for h in required_hooks if not (hooks_dir / h).exists()]

    if missing_hooks:
        # 显示警告
        # 询问是否继续
        # 如果选择 No，退出程序
```

### 安装脚本

```bash
#!/bin/bash
# scripts/install_hooks.sh

# 复制 hooks 源文件到 .git/hooks/
cp scripts/git-hooks/prepare-commit-msg .git/hooks/prepare-commit-msg
chmod +x .git/hooks/prepare-commit-msg

cp scripts/git-hooks/post-commit .git/hooks/post-commit
chmod +x .git/hooks/post-commit

echo "✅ Git Hooks 安装完成！"
```

---

## 📚 相关文档

- [超简单提交指南](./SIMPLE_COMMIT_GUIDE.md) - 如何使用 Git Hooks
- [店铺代码提交指南](./SHOP_CODE_COMMIT_GUIDE.md) - 详细的提交流程
- [配置 vs 代码](./CONFIG_VS_CODE.md) - 理解什么应该提交

---

## ❓ 常见问题

### Q1: 为什么不能自动安装 hooks？

**A:** 出于安全考虑，Git 不允许自动安装 hooks。Hooks 可以执行任意代码，如果自动安装会有安全风险。

### Q2: 如果我忘记安装会怎样？

**A:** 系统会在运行时检查并警告你。你可以选择继续运行，但提交时不会有自动版本号。

### Q3: 我可以跳过安装吗？

**A:** 技术上可以，但**强烈不推荐**。没有 hooks，版本管理会混乱，难以追踪店铺代码变更。

### Q4: 如何验证 hooks 是否正确安装？

**A:** 运行 `./scripts/check_hooks.sh` 或者提交一次代码，看是否自动添加版本号。

### Q5: 如果我在多台电脑上工作？

**A:** 每台电脑都需要安装一次 hooks。克隆仓库后立即运行 `./scripts/install_hooks.sh`。

---

## 🎉 总结

**三层保护机制确保不会忘记安装 hooks：**

1. ✅ README 强调 - 文档中明确说明
2. ✅ 检查脚本 - 手动验证安装状态
3. ✅ 自动检查 - 运行时自动提醒

**标准流程：**
```bash
git clone → ./scripts/install_hooks.sh → 继续配置
```

**记住：安装 hooks 是第一件事！** 🎯
