# 5分钟开通新店铺 - 演示脚本

## 场景：你刚开了一个新的Etsy店铺，想要使用自动化系统

---

## ⏱️ 第1分钟：创建配置文件

```bash
# 使用快速创建工具
$ python create_shop.py --shop ocean_breeze --name "海洋微风店铺"

✅ 成功创建店铺配置：configs/shops/ocean_breeze.yaml

📝 下一步：
1. 编辑配置文件：configs/shops/ocean_breeze.yaml
2. 设置环境变量（.env文件）
3. 运行测试：python main.py --shop ocean_breeze --task process_orders --dry-run
4. 正式运行：python main.py --shop ocean_breeze --task process_orders

📖 查看完整指南：docs/NEW_SHOP_GUIDE.md
```

**说明：** 工具自动从模板创建配置文件，只需要提供店铺代码和名称。

---

## ⏱️ 第2-3分钟：编辑配置文件

```bash
$ vim configs/shops/ocean_breeze.yaml
```

**需要修改的关键配置：**

```yaml
# 1. Etsy店铺信息
etsy:
  shop_id: "987654"  # 改成你的店铺ID
  api_key: "${ETSY_API_KEY_OCEAN}"

# 2. 飞书表格ID
feishu:
  table_id: "tblOceanBreeze123"  # 改成你的表格ID

# 3. 邮箱地址
email:
  address: "ocean_breeze@yahoo.com"  # 改成你的邮箱
  password: "${EMAIL_PASSWORD_OCEAN}"

# 4. 发件人信息（如果和其他店铺不同）
sender:
  first_name: "John"
  last_name: "Doe"
  company: "Ocean Breeze Co."
  # ... 其他信息
```

**提示：** 大部分配置可以保持默认值，只需要修改店铺特定的信息。

---

## ⏱️ 第4分钟：设置环境变量

```bash
$ vim .env
```

**添加新店铺的环境变量：**

```bash
# Ocean Breeze店铺
ETSY_API_KEY_OCEAN=your_api_key_here
ETSY_API_SECRET_OCEAN=your_api_secret_here
EMAIL_PASSWORD_OCEAN=your_email_password_here

# 其他共享的环境变量（如果已经配置过，不需要重复）
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
YUNEXPRESS_CUSTOMER_ID=xxxxx
YUNEXPRESS_API_KEY=xxxxx
YUNEXPRESS_API_SECRET=xxxxx
```

---

## ⏱️ 第5分钟：验证和运行

### 步骤1：验证配置（30秒）

```bash
$ python validate_config.py --shop ocean_breeze

🔍 验证店铺配置：ocean_breeze
============================================================
✅ 配置文件加载成功

📋 检查必需字段：
  ✅ 店铺代码
  ✅ 店铺名称
  ✅ Etsy配置
  ✅ 飞书配置
  ✅ 物流配置

🛍️  Etsy配置：
  ✅ Shop ID: 987654
  ✅ API Key: sk-proj-xx...

📊 飞书配置：
  ✅ App ID: cli_xxxxx...
  ✅ Table ID: tblOceanBreeze123

🚚 物流配置：
  ✅ 默认物流商: yunexpress
  ✅ yunexpress 已启用
  ✅ takesend 已启用

📧 邮箱配置：
  ✅ 邮箱地址: ocean_breeze@yahoo.com

📦 发件人信息：
  ✅ 发件人: John Doe
  ✅ 发件地址: 123 Main St

============================================================
✅ 配置验证通过！可以开始使用。

下一步：
  python main.py --shop ocean_breeze --task process_orders --dry-run
```

### 步骤2：测试运行（30秒）

```bash
$ python main.py --shop ocean_breeze --task process_orders --dry-run

[INFO] 加载店铺配置: ocean_breeze
[INFO] 店铺名称: 海洋微风店铺
[INFO] 默认物流商: yunexpress
[INFO] 启用的功能: 邮箱监控, 订单处理, 发货履约
[INFO] 🧪 测试模式：不会实际执行操作
[INFO] 开始监控邮箱: ocean_breeze@yahoo.com
[INFO] 检查新订单...
[INFO] 找到 0 个新订单
[INFO] 测试完成
```

### 步骤3：正式运行（立即开始）

```bash
$ python main.py --shop ocean_breeze --task process_orders

[INFO] 加载店铺配置: ocean_breeze
[INFO] 开始处理订单...
[INFO] 监控邮箱: ocean_breeze@yahoo.com
[INFO] 找到 3 个新订单
[INFO] 处理订单 1/3: #1234567890
[INFO] AI解析订单信息...
[INFO] 匹配产品: SKU-US-001
[INFO] 创建泰嘉物流订单...
[INFO] ✅ 订单创建成功，运单号: TS123456789
[INFO] 写入飞书表格...
[INFO] ✅ 订单处理完成
...
```

---

## 🎉 完成！

**5分钟内完成：**
- ✅ 创建配置文件
- ✅ 编辑关键配置
- ✅ 设置环境变量
- ✅ 验证配置
- ✅ 开始自动化

**现在你可以：**
- 自动处理新订单
- 自动创建物流订单
- 自动标记发货
- 自动回传跟踪号

---

## 🔄 定时任务（可选）

设置cron定时运行：

```bash
# 编辑crontab
$ crontab -e

# 添加定时任务
# 每10分钟检查新订单
*/10 * * * * cd /path/to/etsy-multi-tenant-system && python main.py --shop ocean_breeze --task process_orders

# 每小时执行发货履约
0 * * * * cd /path/to/etsy-multi-tenant-system && python main.py --shop ocean_breeze --task fulfill_orders

# 每天早上9点回传跟踪号
0 9 * * * cd /path/to/etsy-multi-tenant-system && python main.py --shop ocean_breeze --task return_tracking
```

---

## 📊 对比：之前 vs 现在

### 之前（使用3个独立仓库）

```
第1天：
- 克隆 etsy-fulfiller 仓库
- 修改配置文件
- 修改硬编码的店铺信息
- 测试

第2天：
- 克隆 caoliubian-etsy-xiadan 仓库
- 修改配置文件
- 修改硬编码的店铺信息
- 配置邮箱监控
- 测试

第3天：
- 克隆 label-mvp 仓库
- 修改配置文件
- 部署到Railway
- 测试

总计：3天，大量重复工作
```

### 现在（使用多租户系统）

```
5分钟：
- 创建配置文件
- 编辑关键配置
- 验证和运行

总计：5分钟，零重复工作
```

---

## 💡 关键优势

1. **速度快** - 从3天到5分钟，提升99%
2. **零重复** - 不需要复制代码，不需要修改多处
3. **易维护** - 修改一次，所有店铺受益
4. **可扩展** - 支持无限店铺，成本固定

---

## 🚀 下一步

- 查看 [完整配置说明](./CONFIGURATION.md)
- 了解 [SKU规则配置](./SKU_RULES.md)
- 学习 [物流商集成](./LOGISTICS.md)
- 阅读 [项目总结](./PROJECT_SUMMARY.md)

---

*这就是从1到100的力量！* 🎯
