# 云途后台 Tampermonkey 脚本配置指南

## 📋 目录
1. [安装 Tampermonkey](#安装-tampermonkey)
2. [导入脚本](#导入脚本)
3. [配置脚本](#配置脚本)
4. [使用说明](#使用说明)
5. [多店铺配置](#多店铺配置)
6. [故障排查](#故障排查)

---

## 1. 安装 Tampermonkey

### Windows Chrome
1. 打开 Chrome 浏览器
2. 访问：https://www.tampermonkey.net/
3. 点击 "Download" → "Chrome"
4. 在 Chrome 网上应用店中点击 "添加至 Chrome"

### Mac Chrome
1. 打开 Chrome 浏览器
2. 访问：https://www.tampermonkey.net/
3. 点击 "Download" → "Chrome"
4. 在 Chrome 网上应用店中点击 "添加至 Chrome"

---

## 2. 导入脚本

### 方法1：从文件导入（推荐）

1. 点击浏览器右上角的 Tampermonkey 图标
2. 选择 "管理面板"
3. 点击 "实用工具" 标签
4. 在 "从文件安装" 区域，点击 "选择文件"
5. 选择 `yunexpress-order-sync.user.js` 文件
6. 点击 "安装"

### 方法2：从 URL 导入

1. 将脚本上传到 GitHub 或其他托管平台
2. 在 Tampermonkey 管理面板的 "实用工具" 中
3. 在 "从 URL 安装" 输入脚本 URL
4. 点击 "安装"

### 方法3：手动创建

1. 点击 Tampermonkey 图标 → "管理面板"
2. 点击 "+" 按钮创建新脚本
3. 复制 `yunexpress-order-sync.user.js` 的全部内容
4. 粘贴到编辑器中
5. 按 `Ctrl+S` (Windows) 或 `Cmd+S` (Mac) 保存

---

## 3. 配置脚本

### 3.1 首次配置

脚本安装后，需要配置飞书和店铺信息。

#### 打开配置界面

1. 访问云途后台：https://www.yunexpress.com/
2. 页面右上角会出现 "云途订单同步" 面板
3. 点击 "配置" 按钮

#### 输入配置信息

在弹出的对话框中输入 JSON 格式的配置：

```json
{
  "FEISHU_APP_ID": "cli_a5d8xxxxxx",
  "FEISHU_APP_SECRET": "your_feishu_app_secret",
  "NATURE_FEISHU_APP_TOKEN": "Cu82bgVDGaNTNsspOs4c6dAJnIc",
  "NATURE_FEISHU_TABLE_ID": "tblWlIrPD6KZCy8U",
  "MISHANG_FEISHU_APP_TOKEN": "MStWbahj8at2ZvsnheqcJtm2nYb",
  "MISHANG_FEISHU_TABLE_ID": "tblalRxohrGovqXK",
  "JINYALONG_FEISHU_APP_TOKEN": "your_jinyalong_app_token",
  "JINYALONG_FEISHU_TABLE_ID": "your_jinyalong_table_id"
}
```

### 3.2 配置项说明

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `FEISHU_APP_ID` | 飞书应用 ID（所有店铺共享） | `cli_a5d8xxxxxx` |
| `FEISHU_APP_SECRET` | 飞书应用密钥（所有店铺共享） | `your_secret` |
| `{SHOP}_FEISHU_APP_TOKEN` | 店铺的飞书表格 App Token | `Cu82bgVDGaNTNsspOs4c6dAJnIc` |
| `{SHOP}_FEISHU_TABLE_ID` | 店铺的飞书表格 Table ID | `tblWlIrPD6KZCy8U` |

### 3.3 获取飞书配置

#### 获取 App ID 和 App Secret

1. 访问飞书开放平台：https://open.feishu.cn/
2. 进入 "开发者后台" → "我的应用"
3. 选择你的应用
4. 在 "凭证与基础信息" 中找到 App ID 和 App Secret

#### 获取 App Token 和 Table ID

1. 打开飞书多维表格
2. 点击右上角 "..." → "高级设置"
3. 在 URL 中找到：
   ```
   https://xxx.feishu.cn/base/Cu82bgVDGaNTNsspOs4c6dAJnIc?table=tblWlIrPD6KZCy8U
                              ^^^^^^^^^^^^^^^^^^^^^^^^        ^^^^^^^^^^^^^^^^
                              这是 App Token                   这是 Table ID
   ```

---

## 4. 使用说明

### 4.1 自动同步

脚本会在以下情况自动运行：
- 打开云途后台页面时
- 页面加载完成后

### 4.2 手动同步

#### 方法1：使用控制面板

1. 访问云途后台
2. 在右上角的 "云途订单同步" 面板中
3. 选择店铺（如果需要切换）
4. 点击 "立即同步" 按钮

#### 方法2：使用浏览器控制台

1. 按 `F12` 打开开发者工具
2. 切换到 "Console" 标签
3. 输入：`window.syncYunExpressOrders()`
4. 按 `Enter` 执行

### 4.3 查看同步结果

同步完成后，控制面板会显示：
- ✅ 成功同步的订单数量
- ❌ 失败的订单数量
- 📝 详细的错误信息（如果有）

---

## 5. 多店铺配置

### 5.1 店铺识别

脚本支持三种方式识别当前店铺：

#### 方法1：自动检测（推荐）
脚本会从云途后台页面中提取店铺名称，自动匹配对应的配置。

#### 方法2：手动选择
在控制面板的下拉菜单中选择当前店铺。

#### 方法3：URL 参数
在云途后台 URL 中添加参数：
```
https://www.yunexpress.com/orders?shop_code=nature
```

### 5.2 店铺配置映射

| 店铺代码 | 店铺名称 | 关键词 |
|---------|---------|--------|
| `nature` | 大自然草柳编 | "大自然", "nature" |
| `mishang` | 迷尚 | "迷尚", "mishang" |
| `jinyalong` | 金亚龙 | "金亚龙", "jinyalong" |

### 5.3 切换店铺

1. 在控制面板的下拉菜单中选择店铺
2. 脚本会自动保存你的选择
3. 下次打开页面时会自动使用上次选择的店铺

---

## 6. 故障排查

### 6.1 脚本不运行

**症状：** 打开云途后台，没有看到控制面板

**解决方法：**
1. 检查 Tampermonkey 是否启用
   - 点击 Tampermonkey 图标
   - 确保 "启用" 选项已勾选
2. 检查脚本是否启用
   - 打开 Tampermonkey 管理面板
   - 找到 "云途后台订单同步" 脚本
   - 确保开关是打开状态
3. 检查脚本匹配规则
   - 确保当前 URL 匹配脚本的 `@match` 规则
   - 默认匹配：`https://www.yunexpress.com/*`

### 6.2 同步失败

**症状：** 点击 "立即同步" 后显示错误

**可能原因和解决方法：**

#### 错误1：获取飞书 Token 失败
```
获取飞书 Token 失败: invalid app_id or app_secret
```
**解决：** 检查飞书 App ID 和 App Secret 是否正确

#### 错误2：未找到店铺配置
```
未找到店铺配置: xxx
```
**解决：**
1. 检查店铺代码是否正确
2. 确保已配置该店铺的飞书信息

#### 错误3：未找到订单数据
```
未找到订单数据
```
**解决：**
1. 确保云途后台页面已加载完成
2. 检查页面中是否有订单列表
3. 可能需要调整脚本中的选择器（见下文）

### 6.3 调整页面选择器

如果云途后台的 HTML 结构发生变化，可能需要调整脚本中的选择器。

#### 打开脚本编辑器

1. 点击 Tampermonkey 图标 → "管理面板"
2. 找到 "云途后台订单同步" 脚本
3. 点击脚本名称进入编辑模式

#### 修改选择器

找到 `extractOrderData()` 函数，修改选择器：

```javascript
function extractOrderData() {
    const orders = [];

    // 🔧 根据实际页面结构修改这里的选择器
    const orderRows = document.querySelectorAll('.order-list tr, .data-table tbody tr');

    orderRows.forEach(row => {
        // 🔧 修改这些选择器以匹配实际的 HTML 结构
        const orderNumber = row.querySelector('.order-number, [data-field="orderNumber"]')?.textContent.trim();
        const trackingNumber = row.querySelector('.tracking-number, [data-field="trackingNumber"]')?.textContent.trim();
        const status = row.querySelector('.status, [data-field="status"]')?.textContent.trim();

        if (orderNumber) {
            orders.push({
                order_number: orderNumber,
                tracking_number: trackingNumber || '',
                delivery_status: status || '',
                sync_time: new Date().toISOString()
            });
        }
    });

    return orders;
}
```

#### 如何找到正确的选择器

1. 在云途后台页面按 `F12` 打开开发者工具
2. 点击左上角的 "选择元素" 工具（或按 `Ctrl+Shift+C`）
3. 点击页面中的订单号、跟踪号等元素
4. 在开发者工具中查看元素的 class 或 data 属性
5. 使用这些属性更新脚本中的选择器

### 6.4 查看详细日志

在浏览器控制台查看脚本运行日志：

1. 按 `F12` 打开开发者工具
2. 切换到 "Console" 标签
3. 查找以 `[YunExpress]` 开头的日志

---

## 7. 高级配置

### 7.1 自动同步间隔

如果需要定时自动同步，可以在脚本末尾添加：

```javascript
// 每5分钟自动同步一次
setInterval(() => {
    console.log('[YunExpress] 自动同步触发');
    handleSyncClick();
}, 5 * 60 * 1000);
```

### 7.2 快捷键触发

添加快捷键支持（例如 `Ctrl+Shift+S`）：

```javascript
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleSyncClick();
    }
});
```

### 7.3 通知提醒

同步完成后显示浏览器通知：

```javascript
// 在 handleSyncClick 函数的成功回调中添加
if (Notification.permission === 'granted') {
    new Notification('云途订单同步', {
        body: `成功同步 ${result.successCount} 条订单`,
        icon: 'https://www.yunexpress.com/favicon.ico'
    });
}
```

---

## 8. Windows 和 Mac 同步

### 8.1 使用 Git 同步脚本

#### 初始设置

**Windows：**
```bash
cd C:\Users\YourName\Documents
git clone https://github.com/stokisai/etsy-multi-tenant-system.git
```

**Mac：**
```bash
cd ~/
git clone https://github.com/stokisai/etsy-multi-tenant-system.git
```

#### 更新脚本

**Windows：**
```bash
cd C:\Users\YourName\Documents\etsy-multi-tenant-system
git pull
# 然后在 Tampermonkey 中重新导入脚本
```

**Mac：**
```bash
cd ~/etsy-multi-tenant-system
git pull
# 然后在 Tampermonkey 中重新导入脚本
```

### 8.2 配置同步

Tampermonkey 的配置存储在浏览器本地，不会自动同步。

#### 导出配置（Windows）

1. 打开 Tampermonkey 管理面板
2. 点击 "实用工具" 标签
3. 在 "导出" 区域，选择要导出的脚本
4. 点击 "导出到文件"
5. 保存到 `etsy-multi-tenant-system/scripts/tampermonkey/` 目录

#### 导入配置（Mac）

1. 从 Git 拉取最新的脚本文件
2. 打开 Tampermonkey 管理面板
3. 点击 "实用工具" 标签
4. 在 "从文件安装" 区域导入脚本

---

## 9. 安全建议

1. **不要在脚本中硬编码敏感信息**
   - 使用 Tampermonkey 的存储功能（`GM_getValue` / `GM_setValue`）
   - 不要将包含密钥的脚本提交到 Git

2. **定期更新脚本**
   - 从 Git 拉取最新版本
   - 检查是否有安全更新

3. **限制脚本权限**
   - 只在必要的网站上运行脚本
   - 定期检查 `@match` 规则

4. **备份配置**
   - 定期导出 Tampermonkey 配置
   - 保存到安全的位置

---

## 10. 常见问题

### Q1: 脚本在 Windows 和 Mac 上表现不同？
**A:** 脚本是跨平台的，应该表现一致。如果有差异，检查：
- Chrome 版本是否一致
- Tampermonkey 版本是否一致
- 脚本版本是否一致

### Q2: 如何批量配置多个店铺？
**A:** 使用配置对话框一次性输入所有店铺的配置（JSON 格式）。

### Q3: 脚本会影响云途后台的正常使用吗？
**A:** 不会。脚本只是读取页面数据并调用飞书 API，不会修改云途后台的任何功能。

### Q4: 如何禁用自动同步？
**A:** 在脚本中注释掉自动同步的代码，或者在控制面板中关闭脚本。

---

## 11. 技术支持

如果遇到问题，请：
1. 查看浏览器控制台的错误日志
2. 检查 Tampermonkey 的脚本日志
3. 在 GitHub 仓库提交 Issue
4. 联系技术支持

---

## 12. 更新日志

### v1.0.0 (2026-03-05)
- ✅ 初始版本
- ✅ 支持多店铺配置
- ✅ 自动同步订单到飞书
- ✅ Windows 和 Mac 通用
