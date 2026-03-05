# Mac 系统 - Etsy 后台自动化安装指南

## 🎯 功能说明

这个脚本用于在 Mac 上自动化 Etsy 后台操作：
- 从飞书多维表格读取待发货订单
- 自动登录 Etsy 后台
- 标记订单为已发货
- 填写跟踪号

## 📋 系统要求

- macOS 10.15+
- Python 3.8+
- Chrome 浏览器

---

## 🚀 完整安装步骤

### 第 1 步：克隆仓库

```bash
# 如果还没有克隆
git clone https://github.com/stokisai/etsy-multi-tenant-system.git
cd etsy-multi-tenant-system
```

---

### 第 2 步：安装 Git Hooks（必须！）

```bash
# 安装 Git Hooks
./scripts/install_hooks.sh

# 验证安装
./scripts/check_hooks.sh
```

**预期输出：**
```
✓ prepare-commit-msg 已安装
✓ post-commit 已安装
✓ Git Hooks 已正确安装
```

---

### 第 3 步：创建 Python 虚拟环境（推荐）

```bash
# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 你会看到命令行前面出现 (venv)
```

---

### 第 4 步：安装 Python 依赖

```bash
# 安装所有依赖
pip install -r requirements.txt
```

**预期输出：**
```
Successfully installed playwright-1.40.0 loguru-0.7.2 ...
```

---

### 第 5 步：安装 Playwright 浏览器（关键！）

```bash
# 安装 Chromium 浏览器
playwright install chromium
```

**预期输出：**
```
Downloading Chromium 123.0.6312.4 (playwright build v1091)
...
✔ Chromium 123.0.6312.4 downloaded to /Users/xxx/Library/Caches/ms-playwright/chromium-1091
```

**这一步很重要！** Playwright 需要下载专用的浏览器。

---

### 第 6 步：创建店铺配置文件

```bash
# 复制模板
cp configs/shops/template.yaml configs/shops/yourshop.yaml

# 编辑配置
vim configs/shops/yourshop.yaml
# 或者用 VS Code: code configs/shops/yourshop.yaml
```

**必须填写的配置：**

```yaml
# 店铺基本信息
shop_code: "yourshop"
shop_name: "你的店铺名称"

# Etsy 配置
etsy:
  shop_id: "your_shop_id"
  email: "your_etsy_email@example.com"
  password: "your_etsy_password"

# 飞书配置
feishu:
  app_id: "${FEISHU_APP_ID}"  # 保持不变
  app_secret: "${FEISHU_APP_SECRET}"  # 保持不变
  app_token: "your_app_token"  # 填入你的 App Token
  table_id: "your_table_id"  # 填入你的 Table ID

# 邮箱配置
email:
  provider: "yahoo"  # 或 gmail, outlook
  address: "your_email@yahoo.com"
  password: "your_app_password"
  imap_server: "imap.mail.yahoo.com"
  imap_port: 993
```

---

### 第 7 步：配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

**填写以下环境变量：**
```bash
# 飞书配置（所有店铺共享）
FEISHU_APP_ID=your_feishu_app_id
FEISHU_APP_SECRET=your_feishu_app_secret

# 云途配置（所有店铺共享）
YUNEXPRESS_APP_ID=your_yunexpress_app_id
YUNEXPRESS_APP_SECRET=your_yunexpress_app_secret

# 泰嘉配置（所有店铺共享，可选）
TAKESEND_CLIENT_ID=your_takesend_client_id
TAKESEND_AUTH_TOKEN=your_takesend_auth_token
```

---

### 第 8 步：测试 Playwright

```bash
# 运行测试脚本
python3 test_playwright.py
```

**预期结果：**
- 浏览器窗口会自动打开
- 访问 Etsy 网站
- 生成截图文件 `test_etsy.png`
- 输出：`✅ Playwright 测试成功！`

如果测试成功，说明 Playwright 安装正确！

---

### 第 9 步：运行 Etsy 后台自动化

```bash
# 运行发货履约任务
python3 main.py --shop yourshop --task fulfill_orders
```

**流程：**
1. 从飞书读取待发货订单
2. 自动打开浏览器
3. 登录 Etsy 后台
4. 逐个标记订单为已发货
5. 填写跟踪号
6. 更新飞书状态

**你会看到：**
- 浏览器自动打开
- 自动登录 Etsy
- 自动填写表单
- 控制台显示进度

---

## 📝 常用命令

### 处理订单（邮箱监控 + 物流下单）

```bash
python3 main.py --shop yourshop --task process_orders
```

### 发货履约（Etsy 后台标记发货）

```bash
python3 main.py --shop yourshop --task fulfill_orders
```

### 回传跟踪号

```bash
python3 main.py --shop yourshop --task return_tracking
```

### 测试模式（不实际执行）

```bash
python3 main.py --shop yourshop --task fulfill_orders --dry-run
```

---

## 🔍 故障排查

### 问题1：找不到 python 命令

```bash
# 使用 python3
python3 --version

# 如果没有安装 Python 3
brew install python3
```

### 问题2：playwright 安装失败

```bash
# 重新安装
pip uninstall playwright
pip install playwright

# 重新安装浏览器
playwright install chromium
```

### 问题3：浏览器无法启动

```bash
# 检查浏览器是否安装
playwright install --help

# 查看已安装的浏览器
ls ~/Library/Caches/ms-playwright/
```

### 问题4：Etsy 登录失败

**可能原因：**
- 邮箱或密码错误
- Etsy 需要验证码
- IP 被限制

**解决方案：**
1. 检查配置文件中的邮箱和密码
2. 手动登录一次 Etsy，完成验证
3. 使用无痕模式测试

### 问题5：飞书 API 调用失败

```bash
# 检查环境变量
cat .env | grep FEISHU

# 检查配置文件
cat configs/shops/yourshop.yaml | grep feishu
```

---

## 🎯 完整命令清单（复制粘贴版）

```bash
# 1. 克隆仓库
git clone https://github.com/stokisai/etsy-multi-tenant-system.git
cd etsy-multi-tenant-system

# 2. 安装 Git Hooks
./scripts/install_hooks.sh

# 3. 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 4. 安装依赖
pip install -r requirements.txt

# 5. 安装 Playwright 浏览器
playwright install chromium

# 6. 创建配置
cp configs/shops/template.yaml configs/shops/yourshop.yaml
vim configs/shops/yourshop.yaml

# 7. 配置环境变量
cp .env.example .env
vim .env

# 8. 测试 Playwright
python3 test_playwright.py

# 9. 运行自动化
python3 main.py --shop yourshop --task fulfill_orders
```

---

## 📚 相关文档

- [新店铺配置清单](./NEW_SHOP_INFO_CHECKLIST.md)
- [系统运行环境架构](./RUNTIME_ARCHITECTURE.md)
- [故障排查指南](./TROUBLESHOOTING.md)

---

## ⚠️ 重要提示

### 1. 浏览器窗口

- Playwright 会打开一个浏览器窗口
- **不要关闭这个窗口**，让脚本自动操作
- 你可以观察脚本的操作过程

### 2. 登录信息

- Etsy 邮箱和密码存储在配置文件中
- 配置文件已被 `.gitignore` 保护，不会提交到 Git
- 不要将配置文件分享给他人

### 3. 运行时间

- 每个订单大约需要 10-15 秒
- 如果有 100 个订单，大约需要 15-25 分钟
- 可以在后台运行，不影响其他工作

### 4. 错误处理

- 如果某个订单失败，脚本会继续处理下一个
- 失败的订单会在飞书中标记为"错误"
- 可以手动处理失败的订单

---

## 🎉 完成！

现在你可以在 Mac 上运行 Etsy 后台自动化了！

**下一步：**
- 测试运行几个订单
- 观察浏览器操作过程
- 检查飞书中的状态更新
- 如果一切正常，可以批量处理订单
