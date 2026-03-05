# Mac 系统 - 完整安装指南（Tampermonkey 脚本）

## 🎯 系统架构说明

### 三个运行环境

1. **Windows Chrome** - 云途后台操作
   - 脚本：`yunexpress-feishu-shipped.user.js`
   - 功能：从云途后台同步订单状态到飞书

2. **Mac/Windows Chrome** - Etsy 后台操作
   - 脚本：`etsy-fulfiller.user.js`
   - 功能：从飞书读取订单，在 Etsy 后台标记发货

3. **Railway** - 物流下单 API 服务
   - Python 后端服务
   - 功能：邮件监控、订单解析、物流下单

---

## 🚀 Mac 上安装 Etsy 后台脚本

### 📋 前提条件

- macOS 10.15+
- Chrome 浏览器
- Tampermonkey 扩展

---

## Step-by-Step 安装步骤

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

### 第 3 步：安装 Chrome 浏览器

如果还没有安装 Chrome：

```bash
# 使用 Homebrew 安装
brew install --cask google-chrome

# 或者手动下载
# https://www.google.com/chrome/
```

---

### 第 4 步：安装 Tampermonkey 扩展

1. 打开 Chrome 浏览器
2. 访问：https://www.tampermonkey.net/
3. 点击 "Install" 安装扩展
4. 或者直接访问 Chrome 网上应用店：
   https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo

---

### 第 5 步：安装 Etsy 后台脚本

#### 方法 A：从文件安装（推荐）

1. 点击 Tampermonkey 图标
2. 选择 "管理面板"
3. 点击 "实用工具" 标签
4. 在 "从文件安装" 部分：
   - 点击 "选择文件"
   - 选择：`scripts/tampermonkey/etsy-fulfiller.user.js`
   - 点击 "安装"

#### 方法 B：从 URL 安装

1. 点击 Tampermonkey 图标
2. 选择 "管理面板"
3. 点击 "实用工具" 标签
4. 在 "从 URL 安装" 输入框中粘贴：
   ```
   https://raw.githubusercontent.com/stokisai/etsy-fulfiller/main/etsy-fulfiller.user.js
   ```
5. 点击 "安装"

---

### 第 6 步：配置飞书凭据

脚本安装后，需要配置飞书 App ID 和 App Secret：

#### 方法 A：通过脚本菜单配置

1. 访问 Etsy 订单页面：https://www.etsy.com/your/orders/sold
2. 点击 Tampermonkey 图标
3. 选择 "Etsy Order Fulfiller" 脚本
4. 点击 "配置飞书凭据"
5. 输入：
   - Feishu App ID
   - Feishu App Secret
6. 点击 "保存"

#### 方法 B：通过浏览器控制台配置

1. 访问 Etsy 订单页面
2. 按 `F12` 打开开发者工具
3. 切换到 "Console" 标签
4. 执行以下命令：

```javascript
GM_setValue('feishu_app_id', 'cli_a5d8xxxxxx');
GM_setValue('feishu_app_secret', 'your_app_secret');
```

---

### 第 7 步：测试脚本

1. 访问 Etsy 订单页面：https://www.etsy.com/your/orders/sold
2. 你应该看到页面上出现了新的按钮：
   - "拉取待处理订单" - 从飞书读取订单
   - "开始自动填充" - 自动填写订单
   - "停止" - 停止自动填充

3. 点击 "拉取待处理订单" 测试
4. 如果成功，会显示找到的订单数量

---

## 📝 使用方法

### 自动填充订单

1. 访问 Etsy 订单页面：https://www.etsy.com/your/orders/sold
2. 点击 "拉取待处理订单" 按钮
3. 查看找到的订单列表
4. 点击 "开始自动填充" 按钮
5. 脚本会自动：
   - 在 Etsy 页面上找到对应订单
   - 点击 "Mark as Shipped"
   - 填写跟踪号
   - 选择物流商
   - 提交表单
6. 完成后会更新飞书状态

### 手动填充单个订单

1. 在订单列表中找到要处理的订单
2. 点击订单旁边的 "填充" 按钮
3. 脚本会自动填写该订单

---

## 🔧 配置说明

### 飞书表格配置

脚本已内置多个飞书表格配置（在脚本第 23-28 行）：

```javascript
const FEISHU_TABLES = [
  { app_token: 'XsiMbfp5NaWUVgsVUUccHUtMn0d', table_id: 'tblao72mWjoXKR6h', name: '金亚龙订单田小康（上门取件）' },
  { app_token: 'MStWbahj8at2ZvsnheqcJtm2nYb', table_id: 'tblalRxohrGovqXK', name: '迷尚首饰订单' },
  { app_token: 'ACZYbcb3saKLuPsRQ2pc4jsEn3D', table_id: 'tblCCz6WAM1SGQO0', name: '张家港帽子' },
  { app_token: 'Cu82bgVDGaNTNsspOs4c6dAJnIc', table_id: 'tblWlIrPD6KZCy8U', name: '大自然草柳编' },
];
```

如果需要添加新的表格，编辑脚本并添加新的配置。

### 延迟时间配置

默认每个订单之间延迟 3 秒，可以通过菜单修改：

1. 点击 Tampermonkey 图标
2. 选择 "Etsy Order Fulfiller" 脚本
3. 点击 "设置延迟时间"
4. 输入新的延迟秒数（建议 2-5 秒）

---

## 🔍 故障排查

### 问题1：脚本没有运行

**检查：**
1. Tampermonkey 是否已安装？
2. 脚本是否已启用？（在 Tampermonkey 管理面板中查看）
3. 是否在正确的页面？（必须是 `https://www.etsy.com/your/orders/sold*`）

**解决：**
- 刷新页面
- 检查 Tampermonkey 图标，确保脚本已启用
- 按 F12 打开控制台，查看是否有错误信息

### 问题2：无法拉取订单

**可能原因：**
- 飞书凭据未配置或错误
- 飞书 API 调用失败
- 网络问题

**解决：**
1. 重新配置飞书凭据
2. 按 F12 打开控制台，查看错误信息
3. 检查网络连接

### 问题3：自动填充失败

**可能原因：**
- Etsy 页面结构变化
- 订单号不匹配
- 跟踪号格式错误

**解决：**
1. 检查控制台错误信息
2. 手动填充一个订单，观察 Etsy 页面结构
3. 更新脚本以适应新的页面结构

### 问题4：脚本运行太快或太慢

**解决：**
- 调整延迟时间（建议 2-5 秒）
- 延迟太短可能被 Etsy 限制
- 延迟太长会浪费时间

---

## 📊 数据流向

```
飞书多维表格
    ↓
Tampermonkey 脚本（浏览器中运行）
    ↓
读取待处理订单
    ↓
在 Etsy 页面上自动操作
    ↓
标记订单为已发货
    ↓
更新飞书状态
```

---

## 🎯 完整命令清单（复制粘贴版）

```bash
# 1. 克隆仓库
git clone https://github.com/stokisai/etsy-multi-tenant-system.git
cd etsy-multi-tenant-system

# 2. 安装 Git Hooks
./scripts/install_hooks.sh

# 3. 验证 Hooks
./scripts/check_hooks.sh

# 4. 打开脚本文件
open scripts/tampermonkey/etsy-fulfiller.user.js

# 5. 在 Chrome 中安装 Tampermonkey
# 访问：https://www.tampermonkey.net/

# 6. 安装脚本
# 在 Tampermonkey 管理面板中导入脚本

# 7. 配置飞书凭据
# 在 Etsy 订单页面，通过脚本菜单配置

# 8. 开始使用
# 访问：https://www.etsy.com/your/orders/sold
```

---

## 📚 相关文档

- [Tampermonkey 脚本配置指南](./SETUP_GUIDE.md)
- [新店铺配置清单](../NEW_SHOP_INFO_CHECKLIST.md)
- [系统运行环境架构](../RUNTIME_ARCHITECTURE.md)

---

## ⚠️ 重要提示

### 1. 浏览器窗口

- 脚本在浏览器中运行
- 必须保持 Etsy 订单页面打开
- 可以观察脚本的自动操作过程

### 2. 飞书凭据

- App ID 和 App Secret 存储在浏览器本地
- 不会被提交到服务器
- 每个浏览器需要单独配置

### 3. 运行速度

- 默认每个订单延迟 3 秒
- 不要设置太短的延迟，避免被 Etsy 限制
- 建议延迟 2-5 秒

### 4. 批量处理

- 可以一次处理多个订单
- 脚本会自动按顺序处理
- 可以随时点击 "停止" 按钮中断

---

## 🎉 完成！

现在你可以在 Mac 上使用 Etsy 后台自动化脚本了！

**下一步：**
- 测试拉取订单功能
- 测试自动填充功能
- 观察脚本操作过程
- 如果一切正常，可以批量处理订单
