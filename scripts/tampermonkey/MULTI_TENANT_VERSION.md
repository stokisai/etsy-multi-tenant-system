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
- ❌ 硬编码在脚本中
- ❌ 新增店铺需要修改代码
- ❌ 不灵活，不符合多租户设计

---

### ✅ 新版本（v3.1.0）的改进

**移除硬编码，改为用户配置：**
- ✅ 支持多个表格（无限个）
- ✅ 共享飞书凭证
- ✅ 用户手动配置，不需要修改代码
- ✅ 一次性拉取所有表格的订单（保持旧版本逻辑）

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

#### 2. 飞书表格（支持多个）

**配置项：**
- 店铺名称（用于识别）
- Feishu App Token
- Feishu Table ID

**配置方式：**
- 点击 Tampermonkey 图标
- 选择 "📊 配置飞书表格（支持多个）"
- 按照格式输入多个表格配置

**格式：**
```
店铺名称|App Token|Table ID
```

**示例：**
```
大自然草柳编|Cu82bgVDGaNTNsspOs4c6dAJnIc|tblWlIrPD6KZCy8U
迷尚首饰订单|MStWbahj8at2ZvsnheqcJtm2nYb|tblalRxohrGovqXK
张家港帽子|ACZYbcb3saKLuPsRQ2pc4jsEn3D|tblCCz6WAM1SGQO0
金亚龙订单田小康（上门取件）|XsiMbfp5NaWUVgsVUUccHUtMn0d|tblao72mWjoXKR6h
```

**说明：**
- 每行一个表格
- 用 `|` 分隔三个字段
- 支持无限个表格
- 配置会保存在浏览器本地

---

## 🚀 使用流程

### 首次使用

#### 步骤1：配置飞书凭据

```bash
# 1. 点击 Tampermonkey 图标
# 2. 选择 "🔑 配置飞书凭据（App ID/Secret）"
# 3. 输入：
App ID: cli_a5d8xxxxxx
App Secret: your_app_secret
```

#### 步骤2：配置飞书表格

```bash
# 1. 点击 Tampermonkey 图标
# 2. 选择 "📊 配置飞书表格（支持多个）"
# 3. 输入（每行一个表格）：
大自然草柳编|Cu82bgVDGaNTNsspOs4c6dAJnIc|tblWlIrPD6KZCy8U
迷尚首饰订单|MStWbahj8at2ZvsnheqcJtm2nYb|tblalRxohrGovqXK
张家港帽子|ACZYbcb3saKLuPsRQ2pc4jsEn3D|tblCCz6WAM1SGQO0
金亚龙订单田小康（上门取件）|XsiMbfp5NaWUVgsVUUccHUtMn0d|tblao72mWjoXKR6h
```

#### 步骤3：开始使用

```bash
# 1. 打开 Etsy 订单页面
https://www.etsy.com/your/orders/sold

# 2. 点击 "📥 拉取待处理订单"
# 脚本会自动从所有配置的表格拉取订单

# 3. 查看订单列表
# 每个订单会显示来源表格

# 4. 点击 "▶️ 开始自动填充"
# 自动填充所有订单
```

---

### 日常使用

```bash
# 1. 打开 Etsy 订单页面
# 2. 点击 "📥 拉取待处理订单"
# 3. 点击 "▶️ 开始自动填充"
```

---

## 📊 配置对比

### 旧版本 vs 新版本

| 项目 | 旧版本 (v2.7.3) | 新版本 (v3.1.0) |
|------|----------------|----------------|
| 飞书表格配置 | 硬编码 4 个 | 用户手动配置 |
| 表格数量 | 固定 4 个 | 无限制 |
| 新增店铺 | 需要修改代码 | 只需配置 |
| 配置方式 | 修改脚本 | 菜单配置 |
| 拉取逻辑 | 一次拉取所有表格 | 一次拉取所有表格 ✅ |
| 灵活性 | ❌ 低 | ✅ 高 |

---

## 🔧 菜单功能

### Tampermonkey 菜单

点击 Tampermonkey 图标，可以看到以下菜单：

1. **📋 查看当前配置**
   - 查看当前的所有配置
   - 包括飞书凭据和所有表格配置

2. **🔑 配置飞书凭据（App ID/Secret）**
   - 配置所有店铺共享的飞书凭据
   - 只需要配置一次

3. **📊 配置飞书表格（支持多个）**
   - 配置多个飞书表格
   - 每行一个表格，格式：`店铺名称|App Token|Table ID`

4. **⏱️ 设置延迟时间**
   - 设置每个订单之间的延迟时间
   - 默认 3 秒

---

## 📝 配置示例

### 完整配置示例

```
【飞书凭据】（所有店铺共享）
App ID: cli_a5d8xxxxxx
App Secret: your_app_secret

【飞书表格】（共 4 个）
1. 大自然草柳编
   App Token: Cu82bgVDGaNTNsspOs4c6dAJnIc
   Table ID: tblWlIrPD6KZCy8U

2. 迷尚首饰订单
   App Token: MStWbahj8at2ZvsnheqcJtm2nYb
   Table ID: tblalRxohrGovqXK

3. 张家港帽子
   App Token: ACZYbcb3saKLuPsRQ2pc4jsEn3D
   Table ID: tblCCz6WAM1SGQO0

4. 金亚龙订单田小康（上门取件）
   App Token: XsiMbfp5NaWUVgsVUUccHUtMn0d
   Table ID: tblao72mWjoXKR6h
```

---

## ⚠️ 重要提示

### 1. 配置存储位置

- 配置存储在浏览器本地（Tampermonkey 存储）
- 不会同步到其他浏览器
- 每个浏览器需要单独配置

### 2. 拉取逻辑

- **一次性拉取所有表格的订单**（保持旧版本逻辑）
- 并行拉取，速度快
- 如果某个表格拉取失败，不影响其他表格
- 订单列表会显示来源表格

### 3. 配置检查

- 使用前先点击 "📋 查看当前配置" 确认配置正确
- 如果配置错误，会提示错误信息

### 4. 新增店铺

- 只需要在配置中添加新的一行
- 不需要修改脚本代码
- 立即生效

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

#### 步骤4：配置飞书表格

1. 点击 Tampermonkey 图标
2. 选择 "📊 配置飞书表格（支持多个）"
3. 输入所有表格配置（每行一个）

#### 步骤5：开始使用

1. 打开 Etsy 订单页面
2. 点击 "📥 拉取待处理订单"
3. 查看订单列表
4. 点击 "▶️ 开始自动填充"

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
- ✅ 保持旧版本的多表格拉取逻辑
- ✅ 符合多租户设计理念

**使用建议：**
- 建议所有用户升级到新版本
- 旧版本将不再维护
- 新版本功能更强大，更易用

**核心特性：**
- ✅ 支持多个飞书表格
- ✅ 共享飞书凭证
- ✅ 一次性拉取所有表格的订单
- ✅ 订单列表显示来源表格
