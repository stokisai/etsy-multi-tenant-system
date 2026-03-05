# 新店铺配置信息清单

## 📋 开通新店铺前，请准备以下信息

### ✅ 必填信息（核心配置）

#### 1. 店铺基本信息
- [ ] **店铺代码**（英文，用于命令行）
  - 示例：`jinyalong`, `mishang`, `nature`
  - 用途：命令行参数 `--shop jinyalong`

- [ ] **店铺名称**（中文，用于显示）
  - 示例：`金亚龙`, `迷尚`, `大自然草柳编`

---

#### 2. Etsy 店铺信息
- [ ] **Etsy Shop ID**
  - 在哪里找：Etsy 店铺后台 URL 中
  - 示例：`https://www.etsy.com/your/shops/YOUR_SHOP_ID`

---

#### 3. 飞书多维表格信息
- [ ] **飞书 App Token**
  - 在哪里找：打开飞书多维表格，URL 中的第一段 ID
  - 示例：`Cu82bgVDGaNTNsspOs4c6dAJnIc`
  - URL 格式：`https://xxx.feishu.cn/base/[这里是App Token]?table=[这里是Table ID]`

- [ ] **飞书 Table ID**
  - 在哪里找：打开飞书多维表格，URL 中的第二段 ID
  - 示例：`tblWlIrPD6KZCy8U`
  - URL 格式：`https://xxx.feishu.cn/base/[App Token]?table=[这里是Table ID]`

---

#### 4. 邮箱信息
- [ ] **邮箱提供商**
  - 选择：`yahoo`, `gmail`, 或 `outlook`
  - 用途：接收 Etsy 订单通知邮件

- [ ] **邮箱地址**
  - 示例：`your_shop@yahoo.com`
  - 注意：每个店铺使用不同的邮箱

- [ ] **邮箱应用专用密码**
  - 不是登录密码，而是应用专用密码
  - Yahoo：在账户安全设置中生成
  - Gmail：在 Google 账户安全设置中生成
  - Outlook：在 Microsoft 账户安全设置中生成

- [ ] **IMAP 服务器**（根据邮箱提供商选择）
  - Yahoo：`imap.mail.yahoo.com`
  - Gmail：`imap.gmail.com`
  - Outlook：`outlook.office365.com`

---

#### 5. 物流配置
- [ ] **默认物流商**
  - 选择：`yunexpress`（云途）或 `takesend`（泰嘉）
  - 大部分店铺使用：`yunexpress`

- [ ] **是否启用泰嘉物流**
  - 选择：`true` 或 `false`
  - 如果不使用泰嘉，设置为 `false`

---

#### 6. SKU 规则
- [ ] **SKU 前缀列表**
  - 示例：`Nature`, `XCFQ`, `hangzhou`, `Mishang`, `JYL`
  - 用途：根据 SKU 前缀自动选择物流商
  - 格式：
    ```yaml
    sku_rules:
      prefix_mapping:
        "Nature": "yunexpress"
        "XCFQ": "yunexpress"
        "Mishang": "takesend"
    ```

---

#### 7. 发件人信息
- [ ] **姓名**（First Name + Last Name）
  - 示例：`Xiaokang Tian`

- [ ] **公司名称**
  - 示例：`StrawCrafters`

- [ ] **省份**
  - 示例：`Shandong`

- [ ] **城市**
  - 示例：`Zibo City`

- [ ] **详细地址**
  - 示例：`Building 11, Unit 2, Room 1403`

- [ ] **邮编**
  - 示例：`255005`

- [ ] **电话**
  - 示例：`15387963207`

---

### 🔧 可选信息（高级配置）

#### 8. 飞书字段映射（如果表格字段名称不同）
- [ ] 订单号字段名称（默认：`订单号`）
- [ ] 买家姓名字段名称（默认：`买家姓名`）
- [ ] SKU 字段名称（默认：`SKU`）
- [ ] 跟踪号字段名称（默认：`跟踪号`）
- [ ] 运单号字段名称（默认：`运单号`）

---

#### 9. IOSS 代码（欧盟订单）
- [ ] **IOSS 代码**（如果有欧盟订单）
  - 示例：`IM3720000224`

---

#### 10. 功能开关
- [ ] 是否启用自动好评（默认：`true`）
- [ ] 是否启用自动回传跟踪号（默认：`true`）
- [ ] 是否启用邮箱监控（默认：`true`）
- [ ] 是否启用订单处理（默认：`true`）
- [ ] 是否启用发货履约（默认：`true`）

---

## 📝 配置步骤

### 第一步：复制模板
```bash
cd ~/etsy-multi-tenant-system
cp configs/shops/template.yaml configs/shops/your_shop_code.yaml
```

### 第二步：编辑配置文件
```bash
vim configs/shops/your_shop_code.yaml
```

### 第三步：填写信息
根据上面的清单，逐项填写配置文件中的信息。

### 第四步：验证配置
```bash
python validate_config.py --shop your_shop_code
```

### 第五步：测试运行
```bash
python main.py --shop your_shop_code --task process_orders --dry-run
```

---

## 🎯 快速配置示例

假设你要开通"金亚龙"店铺，以下是需要填写的信息：

```yaml
# 1. 店铺基本信息
shop_code: "jinyalong"
shop_name: "金亚龙"

# 2. Etsy 配置
etsy:
  shop_id: "jinyalong_shop_12345"

# 3. 飞书配置
feishu:
  app_id: "${FEISHU_APP_ID}"  # 保持不变
  app_secret: "${FEISHU_APP_SECRET}"  # 保持不变
  table_id: "tblao72mWjoXKR6h"  # 填入你的 Table ID

# 4. 邮箱配置
email:
  provider: "yahoo"  # 或 gmail, outlook
  address: "jinyalong@yahoo.com"
  password: "abcd efgh ijkl mnop"  # 应用专用密码
  imap_server: "imap.mail.yahoo.com"  # 根据提供商选择

# 5. 物流配置
logistics:
  default_provider: "yunexpress"
  yunexpress:
    enabled: true
  takesend:
    enabled: false

# 6. SKU 规则
sku_rules:
  prefix_mapping:
    "JYL": "yunexpress"
    "Jinyalong": "yunexpress"

# 7. 发件人信息
sender:
  first_name: "Xiaokang"
  last_name: "Tian"
  company: "JinYaLong"
  province: "Shandong"
  city: "Zibo City"
  address: "Building 11, Unit 2, Room 1403"
  postal_code: "255005"
  phone: "15387963207"
```

---

## ⚠️ 重要提示

### 不需要填写的信息（使用环境变量）
以下信息已经在环境变量中配置，**不需要在配置文件中修改**：

- ❌ `FEISHU_APP_ID` - 飞书应用 ID（所有店铺共享）
- ❌ `FEISHU_APP_SECRET` - 飞书应用密钥（所有店铺共享）
- ❌ `YUNEXPRESS_APP_ID` - 云途 App ID（所有店铺共享）
- ❌ `YUNEXPRESS_APP_SECRET` - 云途 App Secret（所有店铺共享）
- ❌ `TAKESEND_CLIENT_ID` - 泰嘉 Client ID（所有店铺共享）
- ❌ `TAKESEND_AUTH_TOKEN` - 泰嘉 Auth Token（所有店铺共享）

这些信息在 `.env` 文件或 Railway Variables 中配置，所有店铺共享。

---

## 📊 信息收集表格（可打印）

| 配置项 | 你的信息 | 备注 |
|--------|---------|------|
| **店铺代码** | _____________ | 英文，如 `jinyalong` |
| **店铺名称** | _____________ | 中文，如 `金亚龙` |
| **Etsy Shop ID** | _____________ | 从 Etsy 后台获取 |
| **飞书 App Token** | _____________ | 从飞书表格 URL 获取 |
| **飞书 Table ID** | _____________ | 从飞书表格 URL 获取 |
| **邮箱地址** | _____________ | 接收订单通知 |
| **默认物流商** | ☐ 云途 ☐ 泰嘉 | 选择一个 |
| **SKU 前缀 1** | _____________ | 如 `Nature` |
| **SKU 前缀 2** | _____________ | 如 `XCFQ` |
| **SKU 前缀 3** | _____________ | 如 `hangzhou` |
| **发件人姓名** | _____________ | 如 `Xiaokang Tian` |
| **公司名称** | _____________ | 如 `StrawCrafters` |
| **省份** | _____________ | 如 `Shandong` |
| **城市** | _____________ | 如 `Zibo City` |
| **详细地址** | _____________ | 完整地址 |
| **邮编** | _____________ | 6位数字 |
| **电话** | _____________ | 11位数字 |

---

## 🚀 配置完成后

```bash
# 1. 验证配置
python validate_config.py --shop your_shop_code

# 2. 测试运行（不实际执行）
python main.py --shop your_shop_code --task process_orders --dry-run

# 3. 正式运行
python main.py --shop your_shop_code --task process_orders
```

---

## 📚 相关文档

- [配置模板](../configs/shops/template.yaml) - 完整的配置模板
- [快速开始指南](./NEW_SHOP_GUIDE.md) - 5分钟开通新店铺
- [配置工具使用指南](./SETUP_TOOL_GUIDE.md) - 交互式配置工具

---

## ❓ 常见问题

### Q1: 飞书 App Token 和 Table ID 在哪里找？
**A:** 打开飞书多维表格，查看浏览器地址栏：
```
https://xxx.feishu.cn/base/Cu82bgVDGaNTNsspOs4c6dAJnIc?table=tblWlIrPD6KZCy8U
                              ^^^^^^^^^^^^^^^^^^^^^^^^        ^^^^^^^^^^^^^^^^
                              这是 App Token                   这是 Table ID
```

### Q2: Yahoo 邮箱密码是什么？
**A:** 不是你的登录密码，而是**应用专用密码**：
1. 登录 Yahoo 账户
2. 进入账户安全设置
3. 生成应用专用密码
4. 使用生成的密码

### Q3: SKU 前缀是什么？
**A:** 你的产品 SKU 的开头部分，用于识别产品来源或物流方式。
- 示例：如果你的 SKU 是 `Nature-Basket-001`，前缀就是 `Nature`
- 用途：系统根据前缀自动选择物流商

### Q4: 如果我不使用泰嘉物流怎么办？
**A:** 在配置文件中设置：
```yaml
logistics:
  default_provider: "yunexpress"
  takesend:
    enabled: false  # 设置为 false
```

### Q5: 配置文件会被提交到 Git 吗？
**A:** 不会。配置文件已被 `.gitignore` 忽略，只保存在本地。

---

## 📞 需要帮助？

如果在配置过程中遇到问题，请查看：
- [故障排查指南](./TROUBLESHOOTING.md)
- [完整文档列表](../README.md#文档)

---

## 📧 邮箱配置详细说明

### 为什么每个店铺需要独立的邮箱配置？

每个店铺在 Etsy 注册时使用的邮箱都不同：
- 有的使用 Yahoo 邮箱
- 有的使用 Gmail 邮箱
- 有的使用 Outlook 邮箱

因此，每个店铺的邮箱配置都需要单独填写。

### 邮箱配置示例

#### 示例1：Yahoo 邮箱
```yaml
email:
  provider: "yahoo"
  address: "nature_shop@yahoo.com"
  password: "abcd efgh ijkl mnop"  # Yahoo 应用专用密码
  imap_server: "imap.mail.yahoo.com"
  imap_port: 993
```

#### 示例2：Gmail 邮箱
```yaml
email:
  provider: "gmail"
  address: "mishang_shop@gmail.com"
  password: "abcd efgh ijkl mnop"  # Google 应用专用密码
  imap_server: "imap.gmail.com"
  imap_port: 993
```

#### 示例3：Outlook 邮箱
```yaml
email:
  provider: "outlook"
  address: "jinyalong_shop@outlook.com"
  password: "abcd efgh ijkl mnop"  # Microsoft 应用专用密码
  imap_server: "outlook.office365.com"
  imap_port: 993
```

### 如何生成应用专用密码？

#### Yahoo 邮箱
1. 登录 Yahoo 账户：https://login.yahoo.com/
2. 进入账户安全设置
3. 找到 "生成应用密码" 或 "App passwords"
4. 选择 "其他应用"，输入名称（如 "Etsy Automation"）
5. 点击 "生成"，复制生成的密码
6. 将密码填入配置文件（格式：`abcd efgh ijkl mnop`）

#### Gmail 邮箱
1. 登录 Google 账户：https://myaccount.google.com/
2. 进入 "安全性" → "两步验证"（必须先启用）
3. 找到 "应用专用密码" 或 "App passwords"
4. 选择 "邮件" 和 "其他设备"
5. 点击 "生成"，复制生成的密码
6. 将密码填入配置文件

#### Outlook 邮箱
1. 登录 Microsoft 账户：https://account.microsoft.com/
2. 进入 "安全性" → "高级安全选项"
3. 找到 "应用密码"
4. 点击 "创建新的应用密码"
5. 复制生成的密码
6. 将密码填入配置文件

### ⚠️ 重要提示

1. **不要使用登录密码**
   - 配置文件中的密码必须是"应用专用密码"
   - 不是你登录邮箱时使用的密码

2. **密码格式**
   - 应用专用密码通常是 16 位字符
   - 可能包含空格（如 `abcd efgh ijkl mnop`）
   - 直接复制粘贴到配置文件中

3. **安全性**
   - 配置文件已被 `.gitignore` 保护，不会提交到 Git
   - 密码只保存在本地
   - 不要将配置文件分享给他人

4. **测试邮箱连接**
   ```bash
   # 验证邮箱配置是否正确
   python main.py --shop your_shop --task test_email
   ```

