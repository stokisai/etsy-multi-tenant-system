# 面对新店铺，你需要做什么？

## 🎯 简单回答

**每次开新店铺，你需要提供这些信息：**

### 必需信息（5项）

1. **店铺代码** - 例如：`ocean_breeze`（英文，用于命令行）
2. **店铺名称** - 例如：`海洋微风店铺`（中文，用于显示）
3. **Etsy Shop ID** - 例如：`12345678`（在Etsy后台查看）
4. **飞书 Table ID** - 例如：`tblXXXXXX`（为这个店铺创建的多维表格ID）
5. **邮箱地址和密码** - 例如：`ocean@yahoo.com` + 应用专用密码

### 首次还需要（可共享）

6. **Etsy API Key** - 从Etsy开发者平台获取（多个店铺可共用）
7. **飞书 App ID 和 Secret** - 从飞书开放平台获取（多个店铺可共用）
8. **物流商配置** - 云途或泰嘉的API密钥（多个店铺可共用）
9. **发件人信息** - 姓名、地址、电话等（多个店铺可共用）

---

## 📋 详细步骤

### 第1步：收集信息（2-10分钟）

**首次开店铺（约10分钟）：**
使用这个表格收集所有信息：
👉 [信息收集表格](./INFO_COLLECTION_FORM.md)

**后续店铺（约2分钟）：**
只需要收集5项必需信息（上面列出的1-5项）

### 第2步：创建配置（1分钟）

```bash
python create_shop.py --shop ocean_breeze --name "海洋微风店铺"
```

这个命令会：
- 从模板创建配置文件
- 自动填入店铺代码和名称
- 生成 `configs/shops/ocean_breeze.yaml`

### 第3步：编辑配置（1-3分钟）

```bash
vim configs/shops/ocean_breeze.yaml
```

**只需要修改这几个地方：**

```yaml
# 1. Etsy Shop ID
etsy:
  shop_id: "12345678"  # 改成你的

# 2. 飞书 Table ID
feishu:
  table_id: "tblXXXXXX"  # 改成你的

# 3. 邮箱地址
email:
  address: "ocean@yahoo.com"  # 改成你的
  password: "${EMAIL_PASSWORD_OCEAN}"  # 环境变量名

# 4. 发件人信息（如果和其他店铺不同）
sender:
  first_name: "John"
  last_name: "Doe"
  # ... 其他信息
```

**其他配置保持默认即可！**

### 第4步：设置环境变量（1-2分钟）

```bash
vim .env
```

**添加店铺特定的环境变量：**

```bash
# Ocean Breeze店铺
ETSY_API_KEY_OCEAN=your_api_key_here
ETSY_API_SECRET_OCEAN=your_api_secret_here
EMAIL_PASSWORD_OCEAN=your_email_password_here
```

**首次还需要添加共享配置：**

```bash
# 共享配置（所有店铺共用）
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
YUNEXPRESS_CUSTOMER_ID=xxxxx
YUNEXPRESS_API_KEY=xxxxx
YUNEXPRESS_API_SECRET=xxxxx
TAKESEND_CLIENT_ID=xxxxx
TAKESEND_AUTH_TOKEN=xxxxx
OPENAI_API_KEY=sk-xxxxx
```

### 第5步：验证配置（1分钟）

```bash
python validate_config.py --shop ocean_breeze
```

这个命令会检查：
- ✅ 配置文件是否存在
- ✅ 必需字段是否填写
- ✅ Etsy配置是否正确
- ✅ 飞书配置是否正确
- ✅ 物流配置是否正确

如果有问题，会明确告诉你哪里需要修改。

### 第6步：开始使用（立即）

```bash
python main.py --shop ocean_breeze --task process_orders
```

完成！系统开始自动处理订单。

---

## 🎯 核心要点

### 什么需要每次提供？

**每个店铺独立的信息：**
- 店铺代码和名称
- Etsy Shop ID
- 飞书 Table ID（每个店铺一个表格）
- 邮箱地址和密码

### 什么可以共享？

**多个店铺可以共用：**
- Etsy API Key（如果是同一个Etsy账号）
- 飞书 App ID 和 Secret（一个应用管理多个店铺）
- 物流商配置（云途、泰嘉的API密钥）
- 发件人信息（如果发货地址相同）
- AI配置（OpenAI API Key）
- IOSS代码（欧盟订单）

### 什么不需要修改？

**这些配置保持默认即可：**
- 物流商的base_url
- 邮箱的IMAP服务器配置
- 功能开关（features）
- 日志配置
- 重试配置

---

## 📊 时间估算

### 首次开店铺（约20分钟）

```
收集信息：10分钟
├── Etsy Shop ID和API Key
├── 飞书配置
├── 邮箱配置
├── 物流商配置
└── 发件人信息

配置系统：10分钟
├── 创建配置文件：1分钟
├── 编辑配置文件：3分钟
├── 设置环境变量：3分钟
├── 验证配置：1分钟
├── 测试运行：1分钟
└── 正式运行：1分钟
```

### 后续店铺（约5分钟）

```
收集信息：2分钟
├── 店铺代码和名称
├── Etsy Shop ID
├── 飞书 Table ID
└── 邮箱地址

配置系统：3分钟
├── 创建配置文件：1分钟
├── 编辑配置文件：1分钟（只改4个字段）
└── 验证运行：1分钟
```

---

## 🎓 实际案例

### 案例1：第一个店铺（Nature店铺）

**收集的信息：**
```
店铺代码: nature
店铺名称: 大自然店铺
Etsy Shop ID: 12345678
Etsy API Key: sk-proj-xxxxx
飞书 App ID: cli_xxxxx
飞书 App Secret: xxxxx
飞书 Table ID: tblNature123
邮箱: nature@yahoo.com
邮箱密码: xxxx xxxx xxxx xxxx
云途 Customer ID: xxxxx
云途 API Key: xxxxx
泰嘉 Client ID: xxxxx
发件人: Xiaokang Tian
发件地址: Building 11, Unit 2, Room 1403, Zibo City
```

**操作：**
```bash
# 1. 创建配置
python create_shop.py --shop nature --name "大自然店铺"

# 2. 编辑配置（填入上面的信息）
vim configs/shops/nature.yaml

# 3. 设置环境变量
vim .env  # 添加所有环境变量

# 4. 验证和运行
python validate_config.py --shop nature
python main.py --shop nature --task process_orders
```

**时间：约20分钟**

### 案例2：第二个店铺（Ocean Breeze店铺）

**只需要收集：**
```
店铺代码: ocean_breeze
店铺名称: 海洋微风店铺
Etsy Shop ID: 87654321
飞书 Table ID: tblOcean456
邮箱: ocean@yahoo.com
邮箱密码: yyyy yyyy yyyy yyyy
```

**其他信息（共享）：**
- Etsy API Key - 使用相同的
- 飞书 App ID - 使用相同的
- 物流商配置 - 使用相同的
- 发件人信息 - 使用相同的

**操作：**
```bash
# 1. 创建配置
python create_shop.py --shop ocean_breeze --name "海洋微风店铺"

# 2. 编辑配置（只改4个字段）
vim configs/shops/ocean_breeze.yaml
# 修改：shop_id, table_id, email.address, email.password

# 3. 设置环境变量（只添加3行）
vim .env
# 添加：
# ETSY_API_KEY_OCEAN=xxxxx
# ETSY_API_SECRET_OCEAN=xxxxx
# EMAIL_PASSWORD_OCEAN=yyyy yyyy yyyy yyyy

# 4. 验证和运行
python validate_config.py --shop ocean_breeze
python main.py --shop ocean_breeze --task process_orders
```

**时间：约5分钟**

---

## 💡 常见问题

### Q1: 我必须为每个店铺创建新的飞书应用吗？

**A:** 不需要！一个飞书应用可以管理多个店铺。

- **共享：** App ID 和 App Secret
- **独立：** 每个店铺有自己的 Table ID（多维表格）

### Q2: 我可以多个店铺用同一个邮箱吗？

**A:** 技术上可以，但不建议。

- **建议：** 每个店铺用独立邮箱，便于区分订单
- **如果必须共用：** 需要在订单解析时区分店铺

### Q3: 物流商配置可以共享吗？

**A:** 可以！多个店铺可以使用同一个物流商账号。

- 云途、泰嘉的API密钥可以共享
- 所有店铺使用相同的物流商配置

### Q4: 如果我暂时没有某些信息怎么办？

**A:** 可以先用默认值，后续再补充。

**最低要求（必需）：**
- Etsy Shop ID
- 飞书 Table ID
- 邮箱地址和密码
- 至少一个物流商配置

**可以后续补充：**
- 第二个物流商配置
- AI配置
- IOSS配置

### Q5: 配置文件可以放在其他地方吗？

**A:** 可以，使用 `--config` 参数指定：

```bash
python main.py --config /path/to/my_config.yaml --task process_orders
```

---

## 🎯 总结

**面对新店铺，你需要：**

1. **收集5项必需信息**（首次需要9项）
2. **运行1个命令创建配置**
3. **编辑1个配置文件**（只改4个字段）
4. **添加3行环境变量**
5. **验证和运行**

**总时间：**
- 首次：约20分钟
- 后续：约5分钟

**核心优势：**
- ✅ 不需要复制代码
- ✅ 不需要修改代码
- ✅ 不需要部署多个服务
- ✅ 配置集中管理
- ✅ 5分钟开新店

---

## 📚 相关文档

- **[📋 详细清单](./NEW_SHOP_CHECKLIST.md)** - 完整的信息收集清单
- **[📝 收集表格](./INFO_COLLECTION_FORM.md)** - 可打印的表格
- **[🎯 流程图](./WORKFLOW.md)** - 可视化流程
- **[🚀 快速开始](./NEW_SHOP_GUIDE.md)** - 详细指南
- **[🎬 5分钟演示](./5MIN_DEMO.md)** - 完整演示

---

**就是这么简单！从1到100，只需要5分钟！** 🚀
