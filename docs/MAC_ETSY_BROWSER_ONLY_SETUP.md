# Mac Etsy 后台脚本配置指南（仅浏览器部分）

## 🎯 目标

在 Mac 的 Chrome 浏览器上配置 Etsy 后台自动填充脚本。

**注意：** 这个指南只包含浏览器部分，不包含 Python 后端。

---

## 📋 前置条件

- ✅ Mac 电脑
- ✅ 有飞书账号和权限
- ✅ 有 Etsy 店铺账号
- ✅ 知道飞书 App ID、App Secret、App Token、Table ID

---

## 🚀 完整步骤

### 第一步：安装 Chrome 浏览器

**检查是否已安装：**
1. 打开 Launchpad
2. 搜索 "Chrome"
3. 如果找到，跳过此步骤

**如果没有安装：**
1. 访问：https://www.google.com/chrome/
2. 点击"下载 Chrome"
3. 下载完成后，打开 `.dmg` 文件
4. 将 Chrome 拖到"应用程序"文件夹
5. 打开 Chrome

---

### 第二步：安装 Tampermonkey 扩展

1. 打开 Chrome 浏览器
2. 访问：https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
3. 点击"添加至 Chrome"
4. 点击"添加扩展程序"
5. 等待安装完成

**验证安装：**
- 点击浏览器右上角的拼图图标（扩展程序）
- 应该能看到 Tampermonkey
- 点击图钉图标，将 Tampermonkey 固定到工具栏

---

### 第三步：下载脚本文件

**方法1：从 GitHub 下载（推荐）**

1. 访问：https://github.com/stokisai/etsy-multi-tenant-system
2. 点击绿色的 "Code" 按钮
3. 选择 "Download ZIP"
4. 下载完成后，解压 ZIP 文件
5. 找到文件：`scripts/tampermonkey/etsy-fulfiller-multi-tenant.user.js`

**方法2：使用命令行下载**

```bash
# 打开终端（Terminal）
# 进入下载目录
cd ~/Downloads

# 克隆仓库
git clone https://github.com/stokisai/etsy-multi-tenant-system.git

# 打开脚本目录
open etsy-multi-tenant-system/scripts/tampermonkey/
```

---

### 第四步：安装脚本到 Tampermonkey

1. 打开 Chrome 浏览器
2. 点击 Tampermonkey 图标（右上角）
3. 选择"管理面板"
4. 点击"实用工具"标签
5. 在"从文件安装"区域，点击"选择文件"
6. 找到并选择 `etsy-fulfiller-multi-tenant.user.js`
7. 点击"安装"
8. 看到安装成功的提示

**验证安装：**
- 在 Tampermonkey 管理面板中
- 应该能看到 "Etsy Order Fulfiller (多租户版)"
- 状态应该是"已启用"（绿色）

---

### 第五步：准备飞书信息

**你需要准备以下信息：**

#### 5.1 飞书凭据（所有店铺共享）

```
App ID: cli_a5d8xxxxxx
App Secret: your_app_secret
```

**如何获取：**
1. 访问：https://open.feishu.cn/
2. 登录并进入"开发者后台"
3. 选择你的应用
4. 在"凭证与基础信息"中找到 App ID 和 App Secret

#### 5.2 飞书表格信息（每个店铺独立）

```
店铺名称：大自然草柳编
App Token：Cu82bgVDGaNTNsspOs4c6dAJnIc
Table ID：tblWlIrPD6KZCy8U
```

**如何获取 App Token：**
1. 打开飞书表格
2. 查看浏览器地址栏：`https://example.feishu.cn/base/XxxxxxxxxxxxXXX`
3. 复制 `base/` 后面的字符串

**如何获取 Table ID：**
1. 在表格中，点击右上角"..."
2. 选择"复制链接"
3. 链接格式：`https://example.feishu.cn/base/XxxxxxxxxxxxXXX?table=tblXXXXXXXXXXXX`
4. 复制 `table=` 后面的字符串

---

### 第六步：配置飞书凭据

1. 打开 Chrome 浏览器
2. 点击 Tampermonkey 图标（右上角）
3. 找到 "Etsy Order Fulfiller (多租户版)"
4. 点击 "🔑 配置飞书凭据（App ID/Secret）"
5. 在弹出的对话框中输入：
   ```
   App ID: cli_a5d8xxxxxx
   ```
6. 点击"确定"
7. 在下一个对话框中输入：
   ```
   App Secret: your_app_secret
   ```
8. 点击"确定"
9. 看到提示："✅ 飞书凭据已保存！"

**注意：** 飞书凭据所有店铺共享，只需要配置一次。

---

### 第七步：配置飞书表格

1. 点击 Tampermonkey 图标（右上角）
2. 找到 "Etsy Order Fulfiller (多租户版)"
3. 点击 "📊 配置飞书表格（支持多个）"
4. 在弹出的对话框中输入（每行一个店铺）：

**格式：**
```
店铺名称 --- App Token --- Table ID
```

**单个店铺示例：**
```
大自然草柳编 --- Cu82bgVDGaNTNsspOs4c6dAJnIc --- tblWlIrPD6KZCy8U
```

**多个店铺示例：**
```
大自然草柳编 --- Cu82bgVDGaNTNsspOs4c6dAJnIc --- tblWlIrPD6KZCy8U
迷尚首饰订单 --- MStWbahj8at2ZvsnheqcJtm2nYb --- tblalRxohrGovqXK
张家港帽子 --- ACZYbcb3saKLuPsRQ2pc4jsEn3D --- tblCCz6WAM1SGQO0
```

5. 点击"确定"
6. 看到提示："✅ 已保存 X 个飞书表格配置！"

---

### 第八步：验证配置

1. 点击 Tampermonkey 图标
2. 找到 "Etsy Order Fulfiller (多租户版)"
3. 点击 "📋 查看当前配置"
4. 确认配置正确：

```
📋 当前配置

【飞书凭据】（所有店铺共享）
App ID: cli_a5d8xxxxxx
App Secret: ✅ 已配置

【飞书表格】（共 3 个）
1. 大自然草柳编
   App Token: Cu82bgVDGaNTNsspOs4c6dAJnIc
   Table ID: tblWlIrPD6KZCy8U

2. 迷尚首饰订单
   App Token: MStWbahj8at2ZvsnheqcJtm2nYb
   Table ID: tblalRxohrGovqXK

3. 张家港帽子
   App Token: ACZYbcb3saKLuPsRQ2pc4jsEn3D
   Table ID: tblCCz6WAM1SGQO0

【其他设置】
延迟时间: 3 秒
```

---

### 第九步：测试脚本

#### 9.1 准备测试数据

1. 打开飞书表格
2. 添加一条测试订单：
   ```
   Etsy订单号：1234567890
   运单号：YT1234567890CN
   运单末端号码：LY123456789CN
   收货状态：已收货
   顾客姓名：Test Customer
   ```

#### 9.2 测试拉取订单

1. 打开 Etsy 订单页面：
   ```
   https://www.etsy.com/your/orders/sold
   ```

2. 页面右上角应该出现一个浮动面板：
   ```
   🚀 Etsy Order Fulfiller
   已配置 3 个飞书表格
   ✅ 大自然草柳编, 迷尚首饰订单, 张家港帽子
   ```

3. 点击 "📥 拉取待处理订单"

4. 等待几秒钟，应该能看到订单列表：
   ```
   找到 1 个待处理订单

   1. 1234567890
   跟踪号: LY123456789CN
   顾客: Test Customer
   来源: 大自然草柳编
   ```

#### 9.3 测试自动填充

**注意：** 当前版本的自动填充功能还在开发中。

点击 "▶️ 开始自动填充" 会提示：
```
自动填充功能开发中...

当前版本只支持拉取订单。
完整的自动填充功能将在后续版本中实现。
```

---

## 🔧 常见问题

### Q1: 找不到 Tampermonkey 图标

**解决方案：**
1. 点击浏览器右上角的拼图图标（扩展程序）
2. 找到 Tampermonkey
3. 点击图钉图标，将其固定到工具栏

### Q2: 脚本没有自动加载

**解决方案：**
1. 确认在正确的页面：`https://www.etsy.com/your/orders/sold`
2. 刷新页面（Command + R）
3. 检查 Tampermonkey 管理面板中脚本是否已启用

### Q3: 拉取订单时提示"请先配置飞书凭据"

**解决方案：**
1. 点击 Tampermonkey 图标
2. 选择 "🔑 配置飞书凭据"
3. 输入 App ID 和 App Secret

### Q4: 拉取订单时提示"飞书 API 错误"

**可能原因：**
- App Token 或 Table ID 错误
- 飞书凭据过期
- 没有表格访问权限

**解决方案：**
1. 检查 App Token 和 Table ID 是否正确
2. 重新配置飞书凭据
3. 确认有表格访问权限

### Q5: 订单列表为空

**可能原因：**
- 飞书表格中没有符合条件的订单

**筛选条件：**
- 收货状态 = "已收货" 或 "已发货"
- 有运单号或运单末端号码
- 有 Etsy 订单号

**解决方案：**
1. 检查飞书表格中的数据
2. 确认字段名称正确：
   - `Etsy订单号`
   - `运单号`
   - `运单末端号码`
   - `收货状态`
   - `顾客姓名`

### Q6: 如何添加新店铺？

**解决方案：**
1. 点击 Tampermonkey 图标
2. 选择 "📊 配置飞书表格"
3. 在现有配置后面添加新的一行：
   ```
   现有店铺1 --- Token1 --- TableID1
   现有店铺2 --- Token2 --- TableID2
   新店铺 --- NewToken --- NewTableID
   ```

### Q7: 如何删除某个店铺？

**解决方案：**
1. 点击 Tampermonkey 图标
2. 选择 "📊 配置飞书表格"
3. 删除对应的那一行
4. 点击"确定"保存

---

## 📝 快速参考

### 配置格式

**飞书凭据：**
```
App ID: cli_a5d8xxxxxx
App Secret: your_app_secret
```

**飞书表格：**
```
店铺名称 --- App Token --- Table ID
```

### Tampermonkey 菜单

- 📋 查看当前配置
- 🔑 配置飞书凭据（App ID/Secret）
- 📊 配置飞书表格（支持多个）
- ⏱️ 设置延迟时间

### 飞书表格字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| Etsy订单号 | 文本 | 必填 |
| 运单号 | 文本 | 云途运单号 |
| 运单末端号码 | 文本 | 末端追踪号 |
| 收货状态 | 单选 | 已收货、已发货 |
| 顾客姓名 | 文本 | 收件人姓名 |

---

## 🎉 完成

恭喜！你已经在 Mac 上完成了 Etsy 后台脚本的配置。

**下一步：**
1. 在飞书表格中添加真实订单数据
2. 在 Etsy 后台测试拉取订单
3. 等待自动填充功能开发完成

**需要帮助？**
- 查看浏览器控制台（Command + Option + J）
- 检查 Tampermonkey 日志
- 查看配置是否正确

---

## 📚 相关文档

- [多租户版本说明](../scripts/tampermonkey/MULTI_TENANT_VERSION.md)
- [Tampermonkey 配置指南](../scripts/tampermonkey/SETUP_GUIDE.md)
