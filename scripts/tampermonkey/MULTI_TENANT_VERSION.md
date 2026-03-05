# Etsy Fulfiller 多租户版本说明

## 🎯 主要改进

### ❌ 旧版本（v2.7.3）的问题

**硬编码 4 个飞书表格：**
```javascript
const FEISHU_TABLES = [
  { app_token: 'XsiMbfp5NaWUVgsVUUccHUtMn0d', table_id: 'tblao72mWjoXKR6h', name: '金亚龙订单田小康（上门取件）' },
  { app_token: 'MStWbahj8at2ZvsnheqcJtm2nYb', table_id: 'tblalRxohrGovqXK', name: '迷尚首饰订单' },
  { app_token: 'ACZYbcb3saKLuPsRQ2pc4jsEn3D', table_id: 'tblCCz6WAM1SGQO0', name: '张家港帽子' },
  { app_token: 'Cu82bgVDGaNTNsspOs4c6dAJnIc', table_id: 'tblWlIrPD6KZCy8U', name: '大自然草柳编' },
];
```

**问题：**
- ❌ 所有店铺都使用这 4 个表格
- ❌ 新店铺需要修改脚本代码
- ❌ 不灵活，不符合多租户设计

---

### ✅ 新版本（v3.0.0）的改进

**移除硬编码，改为用户配置：**
- ✅ 每个店铺独立配置飞书表格
- ✅ 不需要修改脚本代码
- ✅ 支持无限店铺
- ✅ 配置存储在浏览器本地

---

## 📋 配置说明

### 两层配置

#### 1. 飞书凭据（所有店铺共享）

**配置项：**
- Feishu App ID
- Feishu App Secret

**配置方式：**
- 点击 Tampermonkey 图标
- 选择 "🔑 配置飞书凭据（App ID/Secret）"
- 输入 App ID 和 App Secret
- 保存

**说明：**
- 这两个值所有店铺共享
- 只需要配置一次
- 用于获取飞书 Access Token

---

#### 2. 当前店铺表格（每个店铺独立）

**配置项：**
- 店铺名称（用于识别）
- Feishu App Token
- Feishu Table ID

**配置方式：**
- 点击 Tampermonkey 图标
- 选择 "📊 配置当前店铺表格（App Token/Table ID）"
- 输入店铺名称、App Token 和 Table ID
- 保存

**说明：**
- 每个店铺独立配置
- 切换店铺时需要重新配置
- 配置会保存在浏览器本地

---

## 🚀 使用流程

### 场景1：处理大自然店铺的订单

```bash
# 1. 打开 Etsy 大自然店铺的订单页面
https://www.etsy.com/your/orders/sold

# 2. 配置当前店铺表格（首次）
点击 Tampermonkey 图标 → "📊 配置当前店铺表格"
店铺名称: 大自然草柳编
App Token: Cu82bgVDGaNTNsspOs4c6dAJnIc
Table ID: tblWlIrPD6KZCy8U

# 3. 拉取订单
点击页面上的 "📥 拉取待处理订单" 按钮

# 4. 开始自动填充
点击 "▶️ 开始自动填充" 按钮
```

### 场景2：切换到迷尚店铺

```bash
# 1. 打开 Etsy 迷尚店铺的订单页面

# 2. 重新配置当前店铺表格
点击 Tampermonkey 图标 → "📊 配置当前店铺表格"
店铺名称: 迷尚首饰订单
App Token: MStWbahj8at2ZvsnheqcJtm2nYb
Table ID: tblalRxohrGovqXK

# 3. 拉取订单并处理
```

---

## 📊 配置对比

### 旧版本 vs 新版本

| 项目 | 旧版本 (v2.7.3) | 新版本 (v3.0.0) |
|------|----------------|----------------|
| 飞书表格配置 | 硬编码 4 个 | 用户手动配置 |
| 新增店铺 | 需要修改代码 | 只需配置 |
| 店铺数量 | 固定 4 个 | 无限制 |
| 配置方式 | 修改脚本 | 菜单配置 |
| 灵活性 | ❌ 低 | ✅ 高 |

---

## 🔧 菜单功能

### Tampermonkey 菜单

点击 Tampermonkey 图标，可以看到以下菜单：

1. **📋 查看当前配置**
   - 查看当前的所有配置
   - 包括飞书凭据和当前店铺表格

2. **🔑 配置飞书凭据（App ID/Secret）**
   - 配置所有店铺共享的飞书凭据
   - 只需要配置一次

3. **📊 配置当前店铺表格（App Token/Table ID）**
   - 配置当前店铺的飞书表格
   - 每次切换店铺时需要重新配置

4. **⏱️ 设置延迟时间**
   - 设置每个订单之间的延迟时间
   - 默认 3 秒

---

## 📝 配置示例

### 示例1：大自然店铺

```
【飞书凭据】（所有店铺共享）
App ID: cli_a5d8xxxxxx
App Secret: your_app_secret

【当前店铺】
店铺名称: 大自然草柳编
App Token: Cu82bgVDGaNTNsspOs4c6dAJnIc
Table ID: tblWlIrPD6KZCy8U
```

### 示例2：迷尚店铺

```
【飞书凭据】（所有店铺共享）
App ID: cli_a5d8xxxxxx  ← 不变
App Secret: your_app_secret  ← 不变

【当前店铺】
店铺名称: 迷尚首饰订单  ← 改变
App Token: MStWbahj8at2ZvsnheqcJtm2nYb  ← 改变
Table ID: tblalRxohrGovqXK  ← 改变
```

---

## ⚠️ 重要提示

### 1. 配置存储位置

- 配置存储在浏览器本地（Tampermonkey 存储）
- 不会同步到其他浏览器
- 每个浏览器需要单独配置

### 2. 切换店铺

- 每次切换店铺时，需要重新配置当前店铺表格
- 飞书凭据（App ID/Secret）不需要重新配置

### 3. 配置检查

- 使用前先点击 "📋 查看当前配置" 确认配置正确
- 如果配置错误，会提示错误信息

---

## 🎯 迁移指南

### 从旧版本迁移到新版本

#### 步骤1：卸载旧版本

1. 打开 Tampermonkey 管理面板
2. 找到 "Etsy Order Fulfiller (备选方案)" v2.7.3
3. 点击删除

#### 步骤2：安装新版本

1. 在 Tampermonkey 管理面板中
2. 点击 "实用工具" 标签
3. 从文件安装：`etsy-fulfiller-multi-tenant.user.js`

#### 步骤3：配置飞书凭据

1. 点击 Tampermonkey 图标
2. 选择 "🔑 配置飞书凭据"
3. 输入 App ID 和 App Secret

#### 步骤4：配置第一个店铺

1. 打开第一个店铺的 Etsy 订单页面
2. 点击 Tampermonkey 图标
3. 选择 "📊 配置当前店铺表格"
4. 输入店铺信息

#### 步骤5：开始使用

1. 点击 "📥 拉取待处理订单"
2. 查看订单列表
3. 点击 "▶️ 开始自动填充"

---

## 📚 相关文档

- [Mac Etsy 脚本安装指南](../../docs/MAC_ETSY_TAMPERMONKEY_SETUP.md)
- [Tampermonkey 配置指南](./SETUP_GUIDE.md)

---

## 🎉 总结

**新版本的优势：**
- ✅ 移除硬编码，更灵活
- ✅ 支持无限店铺
- ✅ 不需要修改代码
- ✅ 配置简单明了
- ✅ 符合多租户设计理念

**使用建议：**
- 建议所有用户升级到新版本
- 旧版本将不再维护
- 新版本功能更强大，更易用
