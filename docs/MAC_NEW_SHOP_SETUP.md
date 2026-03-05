# Mac 新店铺完整配置指南

## 🎯 目标

在 Mac 上为一个全新的 Etsy 店铺配置完整的自动化系统。

---

## 📋 前置条件

- ✅ Mac 电脑
- ✅ Chrome 浏览器
- ✅ 已安装 Tampermonkey 扩展
- ✅ 有飞书账号和权限
- ✅ 有 Etsy 店铺账号

---

## 🚀 完整步骤

### 第一步：准备飞书多维表格

#### 1.1 创建飞书多维表格

1. 打开飞书，进入"多维表格"
2. 创建新表格，命名为：`[店铺名称]订单`
3. 添加以下字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| Etsy订单号 | 文本 | 必填 |
| 运单号 | 文本 | 云途运单号 |
| 运单末端号码 | 文本 | 末端追踪号 |
| 收货状态 | 单选 | 选项：已收货、已发货 |
| 顾客姓名 | 文本 | 收件人姓名 |

#### 1.2 获取表格信息

**获取 App Token：**
1. 打开飞书表格
2. 查看浏览器地址栏：`https://example.feishu.cn/base/XxxxxxxxxxxxXXX`
3. 复制 `base/` 后面的字符串，这就是 **App Token**

**获取 Table ID：**
1. 在表格中，点击右上角"..."
2. 选择"复制链接"
3. 链接格式：`https://example.feishu.cn/base/XxxxxxxxxxxxXXX?table=tblXXXXXXXXXXXX`
4. 复制 `table=` 后面的字符串，这就是 **Table ID**

**记录下来：**
```
店铺名称：[你的店铺名称]
App Token：XxxxxxxxxxxxXXX
Table ID：tblXXXXXXXXXXXX
```

---

### 第二步：安装 Tampermonkey 脚本

#### 2.1 安装云途后台脚本（Windows 专用）

**注意：** 这个脚本只能在 Windows 上使用，Mac 不需要安装。

如果你有 Windows 电脑，参考：`docs/WINDOWS_YUNEXPRESS_SETUP.md`

#### 2.2 安装 Etsy 后台脚本（Mac 可用）

1. 打开 Chrome 浏览器
2. 点击 Tampermonkey 图标 → "管理面板"
3. 点击"实用工具"标签
4. 在"从文件安装"区域，选择文件：
   ```
   scripts/tampermonkey/etsy-fulfiller-multi-tenant.user.js
   ```
5. 点击"安装"

---

### 第三步：配置 Etsy 后台脚本

#### 3.1 配置飞书凭据（首次使用）

**如果是第一次使用，需要配置飞书凭据：**

1. 打开 Chrome，点击 Tampermonkey 图标
2. 找到 "Etsy Order Fulfiller (多租户版)"
3. 点击 "🔑 配置飞书凭据（App ID/Secret）"
4. 输入：
   ```
   App ID: cli_a5d8xxxxxx
   App Secret: your_app_secret
   ```

**如何获取飞书凭据：**
1. 打开飞书开放平台：https://open.feishu.cn/
2. 进入"开发者后台"
3. 选择你的应用
4. 在"凭证与基础信息"中找到 App ID 和 App Secret

**注意：** 飞书凭据所有店铺共享，只需要配置一次。

#### 3.2 配置飞书表格

1. 点击 Tampermonkey 图标
2. 找到 "Etsy Order Fulfiller (多租户版)"
3. 点击 "📊 配置飞书表格（支持多个）"
4. 输入表格配置（每行一个表格）：

**格式：**
```
店铺名称 --- App Token --- Table ID
```

**示例（单个店铺）：**
```
我的新店铺 --- XxxxxxxxxxxxXXX --- tblXXXXXXXXXXXX
```

**示例（多个店铺）：**
```
大自然草柳编 --- Cu82bgVDGaNTNsspOs4c6dAJnIc --- tblWlIrPD6KZCy8U
迷尚首饰订单 --- MStWbahj8at2ZvsnheqcJtm2nYb --- tblalRxohrGovqXK
我的新店铺 --- XxxxxxxxxxxxXXX --- tblXXXXXXXXXXXX
```

5. 点击"确定"保存

#### 3.3 验证配置

1. 点击 Tampermonkey 图标
2. 选择 "📋 查看当前配置"
3. 确认配置正确：
   - ✅ 飞书凭据已配置
   - ✅ 表格列表包含你的新店铺

---

### 第四步：测试 Etsy 后台自动填充

#### 4.1 准备测试数据

1. 在飞书表格中添加一条测试订单：
   ```
   Etsy订单号：1234567890
   运单号：YT1234567890CN
   运单末端号码：LY123456789CN
   收货状态：已收货
   顾客姓名：Test Customer
   ```

#### 4.2 测试拉取订单

1. 打开 Etsy 订单页面：
   ```
   https://www.etsy.com/your/orders/sold
   ```

2. 页面右上角会出现一个浮动面板：
   ```
   🚀 Etsy Order Fulfiller
   已配置 X 个飞书表格
   ```

3. 点击 "📥 拉取待处理订单"

4. 查看订单列表，应该能看到：
   ```
   1. 1234567890
   跟踪号: LY123456789CN
   顾客: Test Customer
   来源: 我的新店铺
   ```

#### 4.3 测试自动填充

**注意：** 当前版本的自动填充功能还在开发中，只能拉取订单。

完整的自动填充功能将在后续版本中实现。

---

### 第五步：配置 Python 后端（可选）

**如果需要邮件监控和自动下单功能：**

#### 5.1 创建店铺配置文件

1. 复制模板：
   ```bash
   cd /Users/stokist/etsy-multi-tenant-system
   cp configs/shops/template.yaml configs/shops/my_new_shop.yaml
   ```

2. 编辑配置文件：
   ```bash
   open configs/shops/my_new_shop.yaml
   ```

3. 填入店铺信息：
   ```yaml
   shop_name: "我的新店铺"

   feishu:
     app_token: "XxxxxxxxxxxxXXX"
     table_id: "tblXXXXXXXXXXXX"

   email:
     address: "your_email@gmail.com"
     password: "your_app_password"

   logistics:
     provider: "yunexpress"
     api_key: "your_api_key"
   ```

#### 5.2 创建店铺插件（如果需要特殊逻辑）

1. 创建店铺目录：
   ```bash
   mkdir -p plugins/shops/my_new_shop
   ```

2. 创建 `__init__.py`：
   ```python
   from .processor import MyNewShopProcessor

   __all__ = ['MyNewShopProcessor']
   ```

3. 创建 `processor.py`：
   ```python
   from plugins.base_processor import BaseOrderProcessor

   class MyNewShopProcessor(BaseOrderProcessor):
       def __init__(self, config):
           super().__init__(config)

       def process_order(self, order_data):
           # 店铺特殊逻辑
           return super().process_order(order_data)
   ```

#### 5.3 测试 Python 后端

```bash
cd /Users/stokist/etsy-multi-tenant-system
python main.py --shop my_new_shop
```

---

## 📊 配置总结

### 必须配置的内容

| 配置项 | 位置 | 说明 |
|--------|------|------|
| 飞书多维表格 | 飞书 | 创建表格，获取 App Token 和 Table ID |
| 飞书凭据 | Tampermonkey | App ID 和 App Secret（所有店铺共享） |
| 飞书表格配置 | Tampermonkey | 店铺名称、App Token、Table ID |

### 可选配置的内容

| 配置项 | 位置 | 说明 |
|--------|------|------|
| 店铺配置文件 | `configs/shops/` | 邮件、物流等配置 |
| 店铺插件 | `plugins/shops/` | 特殊业务逻辑 |

---

## 🔧 常见问题

### Q1: 拉取订单时提示"请先配置飞书凭据"

**解决方案：**
1. 点击 Tampermonkey 图标
2. 选择 "🔑 配置飞书凭据"
3. 输入 App ID 和 App Secret

### Q2: 拉取订单时提示"请先配置飞书表格"

**解决方案：**
1. 点击 Tampermonkey 图标
2. 选择 "📊 配置飞书表格"
3. 输入表格配置

### Q3: 拉取订单时提示"飞书 API 错误"

**可能原因：**
- App Token 或 Table ID 错误
- 飞书凭据过期
- 没有表格访问权限

**解决方案：**
1. 检查 App Token 和 Table ID 是否正确
2. 重新配置飞书凭据
3. 确认有表格访问权限

### Q4: 订单列表为空

**可能原因：**
- 飞书表格中没有符合条件的订单
- 筛选条件不匹配

**筛选条件：**
- 收货状态 = "已收货" 或 "已发货"
- 有运单号或运单末端号码
- 有 Etsy 订单号

### Q5: 如何添加多个店铺？

**解决方案：**
1. 点击 Tampermonkey 图标
2. 选择 "📊 配置飞书表格"
3. 每行添加一个店铺：
   ```
   店铺1 --- Token1 --- TableID1
   店铺2 --- Token2 --- TableID2
   店铺3 --- Token3 --- TableID3
   ```

---

## 📚 相关文档

- [Mac Etsy 脚本安装指南](./MAC_ETSY_TAMPERMONKEY_SETUP.md)
- [Tampermonkey 配置指南](../scripts/tampermonkey/SETUP_GUIDE.md)
- [多租户版本说明](../scripts/tampermonkey/MULTI_TENANT_VERSION.md)
- [配置 vs 代码说明](./CONFIG_VS_CODE.md)

---

## 🎉 完成

恭喜！你已经完成了新店铺的配置。

**下一步：**
1. 在飞书表格中添加真实订单数据
2. 在 Etsy 后台测试自动填充
3. 根据需要配置 Python 后端

**需要帮助？**
- 查看相关文档
- 检查配置是否正确
- 查看浏览器控制台日志
