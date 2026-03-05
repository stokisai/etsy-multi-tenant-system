# Tampermonkey 脚本说明

## 📌 概述

这个目录包含用于云途后台自动化操作的 Tampermonkey 脚本。

## 🎯 功能

- 自动拉取运单号
- 自动拉取跟踪号
- 自动获取收货状态
- 自动同步数据到飞书多维表格

## 🖥️ 运行环境

### 支持的平台
- ✅ Windows + Chrome + Tampermonkey
- ✅ Mac + Chrome + Tampermonkey

### 脚本通用性
- 同一个脚本可以在 Windows 和 Mac 上运行
- 不需要针对不同平台修改代码

## 📂 脚本列表

### 1. `etsy-fulfiller.user.js` (v2.7.3)
**功能：** Etsy 后台自动发货填充

**匹配网址：**
```
https://www.etsy.com/your/orders/sold*
```

**主要功能：**
- 从飞书多维表格读取待处理订单
- 自动在 Etsy 后台完成发货填充
- 支持多个飞书表格
- 自动填写跟踪号
- 支持运单末端号码
- 批量处理订单

### 2. `yunexpress-feishu-shipped.user.js` (v3.2.0)
**功能：** 从云途后台拉取订单信息并同步到飞书

**匹配网址：**
```
*://oms2.yunexpress.cn/*
```

**主要功能：**
- 扫描云途后台订单
- 自动同步「已发货」和「已收货」状态到飞书多维表格
- 支持多个飞书表格同步
- 同步跟踪号（运单号和运单末端号码）
- 蓝色按钮一键全同步

## 🚀 安装步骤

### 1. 安装 Tampermonkey
- Chrome 浏览器访问：https://www.tampermonkey.net/
- 点击 "Install" 安装扩展

### 2. 导入脚本
1. 点击 Tampermonkey 图标
2. 选择 "管理面板"
3. 点击 "实用工具" 标签
4. 在 "从 URL 安装" 或 "从文件安装" 导入脚本：
   - 文件路径：`scripts/tampermonkey/yunexpress-feishu-shipped.user.js`

### 3. 配置脚本
在脚本中配置以下信息：
```javascript
// 飞书配置（使用 Tampermonkey 存储）
// 在浏览器控制台执行：
GM_setValue('feishu_app_id', 'cli_a5d8xxxxxx');
GM_setValue('feishu_app_secret', 'your_app_secret');

// 或者使用脚本内置的配置界面
```

**飞书表格配置：**
脚本已内置多个飞书表格配置，在脚本第 30-35 行：
```javascript
const FEISHU_TABLES = [
  { app_token: 'XsiMbfp5NaWUVgsVUUccHUtMn0d', table_id: 'tblao72mWjoXKR6h', name: '表1-上门取件' },
  { app_token: 'MStWbahj8at2ZvsnheqcJtm2nYb', table_id: 'tblalRxohrGovqXK', name: '表2-上门取件' },
  { app_token: 'ACZYbcb3saKLuPsRQ2pc4jsEn3D', table_id: 'tblCCz6WAM1SGQO0', name: '表3-上门取件' },
  { app_token: 'Cu82bgVDGaNTNsspOs4c6dAJnIc', table_id: 'tblWlIrPD6KZCy8U', name: '表4-上门取件' },
];
```

## 🔄 数据流向

```
云途后台网页
    ↓
Tampermonkey 脚本（浏览器中运行）
    ↓
飞书 API
    ↓
飞书多维表格
```

## 📝 使用说明

### 自动运行
1. 打开云途后台网页
2. 脚本会自动检测页面并运行
3. 在浏览器控制台查看运行日志

### 手动触发
1. 按 `F12` 打开开发者工具
2. 在控制台输入：`window.syncYunExpressOrders()`
3. 查看同步结果

## 🐛 调试

### 查看日志
```javascript
// 在浏览器控制台查看
console.log('[YunExpress] 脚本运行状态');
```

### 常见问题

**Q: 脚本不运行？**
- 检查 Tampermonkey 是否启用
- 检查脚本是否匹配当前网址
- 查看浏览器控制台是否有错误

**Q: 同步失败？**
- 检查飞书配置是否正确
- 检查网络连接
- 查看飞书 API 返回的错误信息

**Q: Windows 和 Mac 脚本不同步？**
- 使用 Git 管理脚本
- 两个平台都从同一个仓库拉取

## 🔐 安全注意事项

1. **不要在脚本中硬编码敏感信息**
   - 使用 Tampermonkey 的 `GM_getValue` / `GM_setValue` 存储配置
   - 或者使用环境变量

2. **定期更新脚本**
   ```bash
   cd ~/etsy-multi-tenant-system
   git pull
   # 重新导入脚本到 Tampermonkey
   ```

## 📊 多店铺支持

### 方案1：单个脚本支持多店铺（推荐）
```javascript
// 自动检测当前登录的店铺
const SHOP_CODE = detectShopCode();

function detectShopCode() {
    // 从云途后台页面中提取店铺信息
    const shopName = document.querySelector('.shop-name')?.textContent;
    if (shopName.includes('大自然')) return 'nature';
    if (shopName.includes('迷尚')) return 'mishang';
    return 'nature'; // 默认
}
```

### 方案2：每个店铺独立脚本
```
yunexpress-nature.user.js
yunexpress-mishang.user.js
yunexpress-jinyalong.user.js
```

## 🔄 同步策略

### 实时同步
- 页面加载时自动同步
- 每5分钟自动同步一次

### 手动同步
- 添加页面按钮
- 快捷键触发（如 `Ctrl+Shift+S`）

## 📚 相关文档

- [飞书 API 文档](https://open.feishu.cn/document/home/index)
- [Tampermonkey 文档](https://www.tampermonkey.net/documentation.php)
- [云途物流 API](https://www.yunexpress.com/api-docs)
