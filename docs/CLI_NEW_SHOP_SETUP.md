# 新店铺命令行配置步骤

## 🎯 目标

通过命令行快速配置一个新的 Etsy 店铺。

---

## 📋 前置准备

**你需要准备的信息：**
```
店铺名称：[例如：my_new_shop]
飞书 App Token：[例如：XxxxxxxxxxxxXXX]
飞书 Table ID：[例如：tblXXXXXXXXXXXX]
```

---

## 🚀 命令行操作步骤

### 第一步：进入项目目录

```bash
cd /Users/stokist/etsy-multi-tenant-system
```

---

### 第二步：创建店铺配置文件

```bash
# 复制模板
cp configs/shops/template.yaml configs/shops/my_new_shop.yaml

# 用编辑器打开
open configs/shops/my_new_shop.yaml
```

**编辑内容：**
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

保存并关闭。

---

### 第三步：创建店铺插件目录（如果需要特殊逻辑）

```bash
# 创建店铺目录
mkdir -p plugins/shops/my_new_shop

# 创建 __init__.py
cat > plugins/shops/my_new_shop/__init__.py << 'EOF'
from .processor import MyNewShopProcessor

__all__ = ['MyNewShopProcessor']
EOF

# 创建 processor.py
cat > plugins/shops/my_new_shop/processor.py << 'EOF'
from plugins.base_processor import BaseOrderProcessor

class MyNewShopProcessor(BaseOrderProcessor):
    def __init__(self, config):
        super().__init__(config)

    def process_order(self, order_data):
        # 店铺特殊逻辑
        return super().process_order(order_data)
EOF
```

---

### 第四步：测试配置

```bash
# 测试配置是否正确
python main.py --shop my_new_shop --test
```

**如果配置正确，会显示：**
```
✅ 配置文件加载成功
✅ 飞书连接成功
✅ 邮箱连接成功
```

---

### 第五步：配置 Tampermonkey 脚本

**注意：** 这一步需要在浏览器中操作，无法通过命令行完成。

#### 5.1 安装脚本

```bash
# 打开脚本文件所在目录
open scripts/tampermonkey/
```

然后：
1. 在 Chrome 中打开 Tampermonkey 管理面板
2. 点击"实用工具"
3. 从文件安装：`etsy-fulfiller-multi-tenant.user.js`

#### 5.2 配置飞书凭据（首次使用）

在浏览器中：
1. 点击 Tampermonkey 图标
2. 选择 "🔑 配置飞书凭据"
3. 输入 App ID 和 App Secret

#### 5.3 配置飞书表格

在浏览器中：
1. 点击 Tampermonkey 图标
2. 选择 "📊 配置飞书表格"
3. 输入（每行一个店铺）：
```
我的新店铺 --- XxxxxxxxxxxxXXX --- tblXXXXXXXXXXXX
```

---

### 第六步：提交代码（如果需要）

```bash
# 查看修改
git status

# 添加店铺代码（不包括配置文件）
git add plugins/shops/my_new_shop/

# 提交
git commit -m "[my_new_shop] Add new shop processor

新增店铺：我的新店铺
- 创建店铺插件目录
- 实现订单处理逻辑

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

# 推送到远程
git push
```

**注意：** 配置文件 `configs/shops/my_new_shop.yaml` 不要提交，因为包含敏感信息。

---

## 🔧 快速命令参考

### 查看所有店铺

```bash
ls -la configs/shops/
```

### 测试店铺配置

```bash
python main.py --shop my_new_shop --test
```

### 运行店铺

```bash
python main.py --shop my_new_shop
```

### 查看日志

```bash
tail -f logs/my_new_shop.log
```

### 更新脚本

```bash
# 拉取最新代码
git pull

# 重新安装依赖（如果有更新）
pip install -r requirements.txt
```

---

## 📝 完整示例

假设你要添加一个名为 "大自然草柳编" 的新店铺：

```bash
# 1. 进入项目目录
cd /Users/stokist/etsy-multi-tenant-system

# 2. 创建配置文件
cp configs/shops/template.yaml configs/shops/daziran.yaml
open configs/shops/daziran.yaml
# 编辑并保存

# 3. 创建插件目录
mkdir -p plugins/shops/daziran

# 4. 创建 __init__.py
cat > plugins/shops/daziran/__init__.py << 'EOF'
from .processor import DaziranProcessor

__all__ = ['DaziranProcessor']
EOF

# 5. 创建 processor.py
cat > plugins/shops/daziran/processor.py << 'EOF'
from plugins.base_processor import BaseOrderProcessor

class DaziranProcessor(BaseOrderProcessor):
    def __init__(self, config):
        super().__init__(config)

    def process_order(self, order_data):
        # 大自然店铺特殊逻辑
        return super().process_order(order_data)
EOF

# 6. 测试配置
python main.py --shop daziran --test

# 7. 提交代码
git add plugins/shops/daziran/
git commit -m "[daziran] Add new shop processor

新增店铺：大自然草柳编

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

---

## ⚠️ 重要提示

### 什么需要提交到 Git？

✅ **需要提交：**
- `plugins/shops/my_new_shop/` - 店铺代码

❌ **不要提交：**
- `configs/shops/my_new_shop.yaml` - 配置文件（包含敏感信息）

### 配置文件已经被 .gitignore 排除

查看 `.gitignore`：
```bash
cat .gitignore | grep configs
```

应该看到：
```
configs/shops/*.yaml
!configs/shops/template.yaml
```

这意味着：
- 所有 `configs/shops/*.yaml` 都不会被提交
- 除了 `template.yaml`（模板文件）

---

## 🎉 完成

现在你的新店铺已经配置完成！

**下一步：**
1. 在飞书表格中添加订单数据
2. 在 Etsy 后台测试自动填充
3. 运行 Python 后端监控邮件

**运行命令：**
```bash
# 运行单个店铺
python main.py --shop my_new_shop

# 运行所有店铺
python main.py --all
```
