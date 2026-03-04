# Railway部署配置指南

## 🎯 Railway环境变量配置

Railway的环境变量**必须在Railway控制台手动配置**，不能写在代码里（安全原因）。

但我们可以提供一个清单和脚本，让配置过程更简单。

---

## 📋 第1步：准备环境变量清单

### 必需的环境变量

```bash
# 飞书配置
FEISHU_APP_ID=cli_xxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxx

# 云途物流配置
YUNEXPRESS_CUSTOMER_ID=C123456
YUNEXPRESS_API_KEY=xxxxxxxxxxxxxxxx
YUNEXPRESS_API_SECRET=xxxxxxxxxxxxxxxx

# 泰嘉物流配置（可选）
TAKESEND_CLIENT_ID=xxxxxxxx
TAKESEND_AUTH_TOKEN=xxxxxxxxxxxxxxxx

# AI配置（可选）
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# IOSS配置
IOSS_CODE=IM3720000224
```

---

## 🚀 第2步：在Railway控制台配置

### 2.1 登录Railway

访问：https://railway.app

### 2.2 创建新项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择 `stokisai/etsy-multi-tenant-system`
4. Railway会自动检测并开始部署

### 2.3 配置环境变量

1. 进入项目页面
2. 点击项目名称
3. 点击 "Variables" 标签
4. 点击 "New Variable"
5. 逐个添加上面的环境变量

**快捷方式：批量添加**

点击 "RAW Editor"，粘贴以下内容（替换为你的实际值）：

```
FEISHU_APP_ID=cli_xxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxx
YUNEXPRESS_CUSTOMER_ID=C123456
YUNEXPRESS_API_KEY=xxxxxxxxxxxxxxxx
YUNEXPRESS_API_SECRET=xxxxxxxxxxxxxxxx
TAKESEND_CLIENT_ID=xxxxxxxx
TAKESEND_AUTH_TOKEN=xxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
IOSS_CODE=IM3720000224
```

点击 "Update Variables"

### 2.4 配置启动命令

Railway会自动检测 `Procfile`，如果没有，手动添加：

1. 在项目根目录创建 `Procfile`
2. 内容：
```
web: python api/app.py
```

### 2.5 触发重新部署

环境变量配置后，Railway会自动重新部署。

---

## 🔧 第3步：验证部署

### 3.1 检查部署状态

在Railway控制台查看：
- Deployments 标签
- 查看日志，确保没有错误

### 3.2 获取API地址

在Railway控制台：
1. 点击 "Settings"
2. 找到 "Domains"
3. 复制生成的域名，例如：
   ```
   https://etsy-multi-tenant-system-production.up.railway.app
   ```

### 3.3 测试API

```bash
# 测试健康检查
curl https://your-app.railway.app/health

# 应该返回：
# {"status": "ok"}
```

---

## 📝 第4步：更新本地配置

### 4.1 更新店铺配置文件

在MacBook上，更新配置文件：

```bash
cd etsy-multi-tenant-system
vim configs/shops/your_shop.yaml
```

添加Railway API地址：

```yaml
logistics:
  yunexpress:
    label_mvp_url: "https://your-app.railway.app/api/label/yunexpress"
  takesend:
    label_mvp_url: "https://your-app.railway.app/api/label/takesend"
```

### 4.2 提交更新

```bash
git add configs/shops/your_shop.yaml
git commit -m "Update Railway API URL"
git push
```

Railway会自动检测到push并重新部署。

---

## 🔄 后续更新

### 更新代码

```bash
# 在MacBook上
git add .
git commit -m "Update code"
git push

# Railway自动检测并部署
```

### 更新环境变量

1. 登录Railway控制台
2. 进入项目
3. 点击 "Variables"
4. 修改或添加变量
5. Railway自动重新部署

---

## 🎯 环境变量管理最佳实践

### ✅ 应该做的

1. **在Railway控制台配置敏感信息**
   - API密钥
   - 密码
   - Token

2. **在代码中使用环境变量**
   ```python
   import os
   api_key = os.getenv('YUNEXPRESS_API_KEY')
   ```

3. **提供环境变量清单**
   - 在文档中列出所有需要的变量
   - 提供示例值（脱敏）

### ❌ 不应该做的

1. **不要在代码中硬编码密钥**
   ```python
   # ❌ 错误
   api_key = "sk-xxxxxxxxxxxxx"

   # ✅ 正确
   api_key = os.getenv('OPENAI_API_KEY')
   ```

2. **不要提交 `.env` 文件到Git**
   - 已经在 `.gitignore` 中

3. **不要在公开的地方分享环境变量**
   - 不要截图包含密钥的界面
   - 不要在聊天中发送真实密钥

---

## 🛠️ 辅助工具

### 环境变量检查脚本

创建 `scripts/check_railway_env.py`：

```python
#!/usr/bin/env python3
"""
检查Railway环境变量是否配置完整
"""
import os

REQUIRED_VARS = [
    'FEISHU_APP_ID',
    'FEISHU_APP_SECRET',
    'YUNEXPRESS_CUSTOMER_ID',
    'YUNEXPRESS_API_KEY',
    'YUNEXPRESS_API_SECRET',
]

OPTIONAL_VARS = [
    'TAKESEND_CLIENT_ID',
    'TAKESEND_AUTH_TOKEN',
    'OPENAI_API_KEY',
    'IOSS_CODE',
]

def check_env():
    print("检查Railway环境变量配置...")
    print("=" * 60)

    missing = []

    print("\n必需变量：")
    for var in REQUIRED_VARS:
        value = os.getenv(var)
        if value:
            print(f"  ✅ {var}: {value[:10]}...")
        else:
            print(f"  ❌ {var}: 未配置")
            missing.append(var)

    print("\n可选变量：")
    for var in OPTIONAL_VARS:
        value = os.getenv(var)
        if value:
            print(f"  ✅ {var}: {value[:10]}...")
        else:
            print(f"  ⚠️  {var}: 未配置")

    print("\n" + "=" * 60)

    if missing:
        print(f"❌ 缺少 {len(missing)} 个必需变量")
        print("\n请在Railway控制台配置以下变量：")
        for var in missing:
            print(f"  - {var}")
        return False
    else:
        print("✅ 所有必需变量已配置")
        return True

if __name__ == "__main__":
    check_env()
```

在Railway部署后，可以在日志中看到检查结果。

---

## 📊 环境变量清单（复制使用）

### 完整清单（替换为实际值）

```bash
# 飞书配置
FEISHU_APP_ID=
FEISHU_APP_SECRET=

# 云途物流配置
YUNEXPRESS_CUSTOMER_ID=
YUNEXPRESS_API_KEY=
YUNEXPRESS_API_SECRET=

# 泰嘉物流配置
TAKESEND_CLIENT_ID=
TAKESEND_AUTH_TOKEN=

# AI配置
OPENAI_API_KEY=

# IOSS配置
IOSS_CODE=IM3720000224
```

---

## 🎉 总结

**Railway环境变量配置流程：**

1. ✅ 准备环境变量清单（使用上面的模板）
2. ✅ 在Railway控制台批量添加
3. ✅ Railway自动重新部署
4. ✅ 测试API是否正常
5. ✅ 更新本地配置文件中的API地址

**时间：约5分钟**

**关键点：**
- 环境变量必须在Railway控制台配置
- 不要在代码中硬编码密钥
- 使用批量添加功能更快捷

---

## ❓ 常见问题

### Q: 可以在代码中配置环境变量吗？

**A:** 不推荐。环境变量应该在Railway控制台配置，这样：
- 更安全（不会泄露到代码中）
- 更灵活（可以随时修改，不需要重新部署代码）
- 符合最佳实践

### Q: 如何查看Railway的环境变量？

**A:**
1. 登录Railway控制台
2. 进入项目
3. 点击 "Variables" 标签
4. 可以看到所有配置的变量（值会被隐藏）

### Q: 修改环境变量后需要重新部署吗？

**A:** Railway会自动重新部署，不需要手动操作。

### Q: 可以从本地 `.env` 文件同步到Railway吗？

**A:** Railway CLI支持，但不推荐：
```bash
# 不推荐
railway variables set $(cat .env)
```

推荐在Railway控制台手动配置，更安全。

---

**查看Railway官方文档：** https://docs.railway.app/develop/variables
