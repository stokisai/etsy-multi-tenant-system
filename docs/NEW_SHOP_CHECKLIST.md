# 新店铺初始化清单

## 📋 开新店铺前需要准备的信息

当你开设新的Etsy店铺时，需要准备以下信息。建议先收集好这些信息，然后一次性完成配置。

---

## 1️⃣ 店铺基本信息

### 必需信息

| 信息项 | 说明 | 示例 | 在哪里获取 |
|--------|------|------|-----------|
| **店铺代码** | 英文标识，用于命令行 | `ocean_breeze` | 自己定义（建议用店铺名的英文） |
| **店铺名称** | 中文名称，用于显示 | `海洋微风店铺` | 自己定义 |
| **Etsy Shop ID** | Etsy店铺ID | `12345678` | Etsy后台 → Shop Manager → Settings |

### 获取Etsy Shop ID

1. 登录Etsy卖家后台
2. 进入 Shop Manager
3. 点击 Settings → Info & Appearance
4. 在URL中可以看到：`https://www.etsy.com/your/shops/12345678`
5. 最后的数字就是你的Shop ID

---

## 2️⃣ Etsy API配置

### 必需信息

| 信息项 | 说明 | 在哪里获取 |
|--------|------|-----------|
| **API Key** | Etsy API密钥 | Etsy开发者平台 |
| **API Secret** | Etsy API密钥 | Etsy开发者平台 |

### 获取Etsy API Key

1. 访问 https://www.etsy.com/developers/
2. 登录你的Etsy账号
3. 创建新应用（Create a New App）
4. 填写应用信息
5. 获取 API Key 和 API Secret

**注意：** 如果多个店铺共用一个Etsy账号，可以使用相同的API Key。

---

## 3️⃣ 飞书多维表格配置

### 必需信息

| 信息项 | 说明 | 在哪里获取 |
|--------|------|-----------|
| **App ID** | 飞书应用ID | 飞书开放平台 |
| **App Secret** | 飞书应用密钥 | 飞书开放平台 |
| **Table ID** | 多维表格ID | 飞书多维表格URL |

### 获取飞书配置

**1. 创建飞书应用（首次）**

1. 访问 https://open.feishu.cn/
2. 创建企业自建应用
3. 获取 App ID 和 App Secret
4. 开通权限：
   - `bitable:app` - 多维表格读写
   - `im:message` - 发送消息（可选）

**2. 创建多维表格**

1. 在飞书中创建新的多维表格
2. 添加必要的字段（参考下方字段列表）
3. 复制表格ID（从URL中获取）

**3. 表格字段建议**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| 订单号 | 文本 | Etsy订单号 |
| 买家姓名 | 文本 | 收件人姓名 |
| 买家邮箱 | 文本 | 买家邮箱 |
| 收货地址 | 文本 | 完整地址 |
| 城市 | 文本 | 城市 |
| 州/省 | 文本 | 州或省 |
| 邮编 | 文本 | 邮政编码 |
| 国家 | 文本 | 国家 |
| SKU | 文本 | 产品SKU |
| 产品名称 | 文本 | 产品名称 |
| 数量 | 数字 | 订单数量 |
| 跟踪号 | 文本 | 物流跟踪号 |
| 运单号 | 文本 | 物流运单号 |
| 物流商 | 单选 | yunexpress/takesend |
| 状态 | 单选 | 待处理/已下单/已发货/已完成 |
| 下单时间 | 日期 | 订单创建时间 |
| 发货时间 | 日期 | 发货时间 |
| 备注 | 文本 | 其他备注 |

---

## 4️⃣ 邮箱配置

### 必需信息

| 信息项 | 说明 | 示例 |
|--------|------|------|
| **邮箱地址** | 接收Etsy订单通知的邮箱 | `shop@yahoo.com` |
| **邮箱密码** | 邮箱密码或应用专用密码 | `xxxx xxxx xxxx xxxx` |
| **邮箱类型** | yahoo/gmail/outlook | `yahoo` |

### Yahoo邮箱设置

1. 登录Yahoo邮箱
2. 进入账户安全设置
3. 生成应用专用密码（App Password）
4. 使用应用专用密码，不要使用账户密码

### Gmail设置

1. 登录Gmail
2. 开启两步验证
3. 生成应用专用密码
4. 使用应用专用密码

---

## 5️⃣ 物流商配置

### 云途物流（必需）

| 信息项 | 说明 | 在哪里获取 |
|--------|------|-----------|
| **Customer ID** | 客户ID | 云途后台 |
| **API Key** | API密钥 | 云途后台 |
| **API Secret** | API密钥 | 云途后台 |

### 泰嘉物流（可选，用于美国订单）

| 信息项 | 说明 | 在哪里获取 |
|--------|------|-----------|
| **Client ID** | 客户ID | 泰嘉后台 |
| **Auth Token** | 认证令牌 | 泰嘉后台 |

**注意：** 如果多个店铺使用相同的物流商账号，可以共用这些配置。

---

## 6️⃣ 发件人信息

### 必需信息

| 信息项 | 说明 | 示例 |
|--------|------|------|
| **姓** | 发件人姓 | `Tian` |
| **名** | 发件人名 | `Xiaokang` |
| **公司名** | 公司名称 | `StrawCrafters` |
| **国家** | 国家代码 | `CN` |
| **省份** | 省份 | `Shandong` |
| **城市** | 城市 | `Zibo City` |
| **地址** | 详细地址 | `Building 11, Unit 2, Room 1403` |
| **邮编** | 邮政编码 | `255005` |
| **电话** | 联系电话 | `15387963207` |

**注意：** 如果多个店铺使用相同的发货地址，可以共用这些信息。

---

## 7️⃣ 可选配置

### AI配置（用于订单解析）

| 信息项 | 说明 | 默认值 |
|--------|------|--------|
| **OpenAI API Key** | OpenAI API密钥 | 共享 |
| **模型** | 使用的模型 | `gpt-4` |

### IOSS配置（欧盟订单）

| 信息项 | 说明 | 默认值 |
|--------|------|--------|
| **IOSS Code** | 欧盟IOSS代码 | `IM3720000224` |

---

## 📝 初始化步骤

### 第1步：收集信息（10分钟）

使用上面的清单，收集所有必需的信息。建议创建一个表格记录：

```
店铺代码: ocean_breeze
店铺名称: 海洋微风店铺
Etsy Shop ID: 12345678
Etsy API Key: xxxxxx
飞书 Table ID: tblXXXXXX
邮箱地址: ocean@yahoo.com
邮箱密码: xxxx xxxx xxxx xxxx
```

### 第2步：创建配置文件（2分钟）

```bash
python create_shop.py --shop ocean_breeze --name "海洋微风店铺"
```

### 第3步：编辑配置文件（3分钟）

```bash
vim configs/shops/ocean_breeze.yaml
```

填入你收集的信息：

```yaml
shop_code: ocean_breeze
shop_name: "海洋微风店铺"

etsy:
  shop_id: "12345678"
  api_key: "${ETSY_API_KEY_OCEAN}"

feishu:
  app_id: "${FEISHU_APP_ID}"
  app_secret: "${FEISHU_APP_SECRET}"
  table_id: "tblXXXXXX"

email:
  address: "ocean@yahoo.com"
  password: "${EMAIL_PASSWORD_OCEAN}"

# 其他配置保持默认即可
```

### 第4步：设置环境变量（2分钟）

```bash
vim .env
```

添加店铺特定的环境变量：

```bash
# Ocean Breeze店铺
ETSY_API_KEY_OCEAN=your_api_key_here
ETSY_API_SECRET_OCEAN=your_api_secret_here
EMAIL_PASSWORD_OCEAN=your_email_password_here

# 共享配置（如果已经配置过，不需要重复）
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
YUNEXPRESS_CUSTOMER_ID=xxxxx
YUNEXPRESS_API_KEY=xxxxx
YUNEXPRESS_API_SECRET=xxxxx
```

### 第5步：验证配置（1分钟）

```bash
python validate_config.py --shop ocean_breeze
```

检查所有配置是否正确。

### 第6步：测试运行（2分钟）

```bash
python main.py --shop ocean_breeze --task process_orders --dry-run
```

测试模式运行，不会实际执行操作。

### 第7步：正式运行

```bash
python main.py --shop ocean_breeze --task process_orders
```

开始处理订单！

---

## 🎯 快速参考

### 最小配置（必需）

```yaml
shop_code: my_shop
shop_name: "我的店铺"

etsy:
  shop_id: "12345678"
  api_key: "${ETSY_API_KEY}"

feishu:
  table_id: "tblXXXXXX"

email:
  address: "shop@yahoo.com"
  password: "${EMAIL_PASSWORD}"

logistics:
  yunexpress:
    enabled: true
```

### 完整配置（推荐）

参考 `configs/shops/template.yaml`

---

## ❓ 常见问题

### Q1: 我可以多个店铺共用一个飞书应用吗？

**A:** 可以！多个店铺可以共用同一个飞书应用（App ID和App Secret），但每个店铺需要有自己的多维表格（Table ID）。

### Q2: 我可以多个店铺共用一个物流商账号吗？

**A:** 可以！多个店铺可以共用同一个物流商账号（Customer ID、API Key等）。

### Q3: 我可以多个店铺共用一个邮箱吗？

**A:** 不建议。每个店铺最好使用独立的邮箱，这样可以更好地区分订单。

### Q4: 如果我暂时没有某些信息怎么办？

**A:** 可以先使用默认值或留空，后续再补充。但以下信息是必需的：
- Etsy Shop ID
- 飞书 Table ID
- 邮箱地址和密码
- 至少一个物流商配置

### Q5: 我需要为每个店铺创建新的飞书应用吗？

**A:** 不需要。一个飞书应用可以管理多个店铺，只需要为每个店铺创建独立的多维表格即可。

---

## 📞 需要帮助？

- 查看 [新店铺快速开始指南](./NEW_SHOP_GUIDE.md)
- 查看 [5分钟演示](./5MIN_DEMO.md)
- 查看 [完整配置说明](./CONFIGURATION.md)

---

## 🎉 总结

**必需信息（7项）：**
1. ✅ 店铺代码和名称
2. ✅ Etsy Shop ID
3. ✅ Etsy API Key
4. ✅ 飞书 Table ID
5. ✅ 邮箱地址和密码
6. ✅ 物流商配置
7. ✅ 发件人信息

**可选信息（2项）：**
1. AI配置（可共享）
2. IOSS配置（可共享）

**总时间：约20分钟**
- 收集信息：10分钟
- 配置系统：10分钟

**之后每次开新店铺：5分钟** 🚀
