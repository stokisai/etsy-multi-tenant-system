# 配置方式对比

## 🎯 三种配置方式

### 方式1：交互式配置工具（⭐推荐）

```bash
python setup_shop.py
```

**特点：**
- ✅ 最简单，只需回答问题
- ✅ 自动生成配置文件
- ✅ 自动更新环境变量
- ✅ 智能检测共享配置
- ✅ 提供默认值
- ✅ 验证必填项

**适合：**
- 所有用户
- 特别是不熟悉YAML的用户

**时间：**
- 首次：5-10分钟
- 后续：2-3分钟

---

### 方式2：快速创建工具

```bash
python create_shop.py --shop my_shop --name "我的店铺"
vim configs/shops/my_shop.yaml  # 手动编辑
vim .env  # 手动添加环境变量
```

**特点：**
- ✅ 从模板创建配置
- ⚠️ 需要手动编辑配置文件
- ⚠️ 需要手动添加环境变量
- ⚠️ 需要理解YAML格式

**适合：**
- 熟悉YAML的用户
- 需要精细控制配置的用户

**时间：**
- 首次：10-15分钟
- 后续：5分钟

---

### 方式3：完全手动

```bash
cp configs/shops/template.yaml configs/shops/my_shop.yaml
vim configs/shops/my_shop.yaml  # 手动编辑所有内容
vim .env  # 手动添加所有环境变量
```

**特点：**
- ⚠️ 最复杂
- ⚠️ 容易出错
- ⚠️ 需要理解所有配置项

**适合：**
- 高级用户
- 需要完全自定义的场景

**时间：**
- 首次：20-30分钟
- 后续：10分钟

---

## 📊 详细对比

| 特性 | 交互式工具 | 快速创建 | 完全手动 |
|------|-----------|---------|---------|
| **易用性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **速度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **出错率** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **自动化** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **灵活性** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **学习成本** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |

---

## 🎬 实际案例

### 案例：配置新店铺 "Ocean Breeze"

#### 使用交互式工具

```bash
$ python setup_shop.py

# 回答问题：
店铺代码: ocean_breeze
店铺名称: 海洋微风店铺
Etsy Shop ID: 12345678
飞书 Table ID: tblOcean123
邮箱地址: ocean@yahoo.com
邮箱密码: xxxx xxxx xxxx xxxx
邮箱类型: yahoo

# 完成！
✅ 配置文件已生成
✅ 环境变量已更新
```

**时间：3分钟**

---

#### 使用快速创建工具

```bash
$ python create_shop.py --shop ocean_breeze --name "海洋微风店铺"

$ vim configs/shops/ocean_breeze.yaml
# 手动修改：
shop_code: ocean_breeze
shop_name: "海洋微风店铺"
etsy:
  shop_id: "12345678"
feishu:
  table_id: "tblOcean123"
email:
  address: "ocean@yahoo.com"
  password: "${EMAIL_PASSWORD_OCEAN}"
# ... 其他配置

$ vim .env
# 手动添加：
EMAIL_PASSWORD_OCEAN=xxxx xxxx xxxx xxxx
```

**时间：5分钟**

---

#### 完全手动

```bash
$ cp configs/shops/template.yaml configs/shops/ocean_breeze.yaml

$ vim configs/shops/ocean_breeze.yaml
# 手动修改所有内容：
shop_code: ocean_breeze
shop_name: "海洋微风店铺"
enabled: true
etsy:
  shop_id: "12345678"
  api_key: "${ETSY_API_KEY_OCEAN}"
  api_secret: "${ETSY_API_SECRET_OCEAN}"
feishu:
  app_id: "${FEISHU_APP_ID}"
  app_secret: "${FEISHU_APP_SECRET}"
  table_id: "tblOcean123"
  field_mapping:
    order_id: "订单号"
    buyer_name: "买家姓名"
    # ... 所有字段
email:
  provider: "yahoo"
  address: "ocean@yahoo.com"
  password: "${EMAIL_PASSWORD_OCEAN}"
  imap_server: "imap.mail.yahoo.com"
  imap_port: 993
  # ... 所有配置
logistics:
  # ... 所有物流配置
sender:
  # ... 所有发件人信息
# ... 所有其他配置

$ vim .env
# 手动添加所有环境变量
EMAIL_PASSWORD_OCEAN=xxxx xxxx xxxx xxxx
ETSY_API_KEY_OCEAN=xxxxx
ETSY_API_SECRET_OCEAN=xxxxx
# ... 其他变量
```

**时间：10-15分钟**

---

## 💡 推荐

### 新用户

**推荐：交互式配置工具** ⭐

理由：
- 最简单
- 最快速
- 不容易出错
- 不需要学习YAML

### 有经验的用户

**推荐：快速创建工具**

理由：
- 快速创建基础配置
- 可以精细调整
- 灵活性高

### 高级用户

**推荐：根据需求选择**

- 标准配置 → 交互式工具
- 自定义配置 → 快速创建或手动

---

## 🎯 决策树

```
需要配置新店铺
    │
    ├─ 熟悉YAML格式？
    │   │
    │   ├─ 否 → 使用交互式工具 ⭐
    │   │
    │   └─ 是 → 需要自定义配置？
    │           │
    │           ├─ 否 → 使用交互式工具 ⭐
    │           │
    │           └─ 是 → 使用快速创建工具
    │
    └─ 追求速度？
        │
        ├─ 是 → 使用交互式工具 ⭐
        │
        └─ 否 → 根据需求选择
```

---

## 📝 总结

**99%的情况下，使用交互式配置工具就够了！**

```bash
python setup_shop.py
```

**优势：**
- ✅ 最简单
- ✅ 最快速
- ✅ 最不容易出错
- ✅ 自动化程度最高

**只有在需要高度自定义时，才考虑其他方式。**

---

## 🚀 开始使用

```bash
# 推荐方式
python setup_shop.py

# 查看详细指南
cat docs/SETUP_TOOL_GUIDE.md
```

**就是这么简单！** 🎉
