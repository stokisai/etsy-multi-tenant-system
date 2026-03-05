# Mac 从零开始配置指南

## 🎯 目标

在一台全新的 Mac 上，从零开始配置整个 Etsy 多租户系统。

---

## 📋 前置条件

- ✅ Mac 电脑（macOS 10.15 或更高版本）
- ✅ 有管理员权限
- ✅ 有网络连接

---

## 🚀 完整步骤

### 第一步：安装 Homebrew（如果还没有）

```bash
# 检查是否已安装 Homebrew
which brew

# 如果没有安装，执行以下命令安装
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装完成后，按照提示添加到 PATH
# 通常需要执行类似这样的命令（根据实际提示）：
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# 验证安装
brew --version
```

---

### 第二步：安装 Python 3

```bash
# 安装 Python 3
brew install python@3.11

# 验证安装
python3 --version

# 应该显示类似：Python 3.11.x
```

---

### 第三步：安装 Git（如果还没有）

```bash
# 检查是否已安装 Git
which git

# 如果没有安装，执行以下命令
brew install git

# 验证安装
git --version

# 配置 Git（首次使用）
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

---

### 第四步：克隆项目仓库

```bash
# 进入你想要存放项目的目录（例如用户主目录）
cd ~

# 克隆仓库
git clone https://github.com/stokisai/etsy-multi-tenant-system.git

# 进入项目目录
cd etsy-multi-tenant-system

# 查看项目结构
ls -la
```

---

### 第五步：安装 Python 依赖

```bash
# 确保在项目目录中
pwd
# 应该显示：/Users/你的用户名/etsy-multi-tenant-system

# 安装依赖
pip3 install -r requirements.txt

# 如果遇到权限问题，使用：
pip3 install --user -r requirements.txt
```

---

### 第六步：安装 Chrome 浏览器（如果还没有）

```bash
# 下载并安装 Chrome
# 访问：https://www.google.com/chrome/
# 或者使用 Homebrew Cask：
brew install --cask google-chrome
```

---

### 第七步：安装 Tampermonkey 扩展

1. 打开 Chrome 浏览器
2. 访问：https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
3. 点击"添加至 Chrome"
4. 点击"添加扩展程序"
5. 验证安装：点击浏览器右上角的拼图图标，应该能看到 Tampermonkey

---

### 第八步：安装 Tampermonkey 脚本

```bash
# 打开脚本目录
open ~/etsy-multi-tenant-system/scripts/tampermonkey/
```

然后在 Chrome 中：
1. 点击 Tampermonkey 图标
2. 选择"管理面板"
3. 点击"实用工具"标签
4. 在"从文件安装"区域，点击"选择文件"
5. 选择 `etsy-fulfiller-multi-tenant.user.js`
6. 点击"安装"

---

### 第九步：配置飞书凭据

在 Chrome 中：
1. 点击 Tampermonkey 图标
2. 找到 "Etsy Order Fulfiller (多租户版)"
3. 点击 "🔑 配置飞书凭据（App ID/Secret）"
4. 输入：
   ```
   App ID: cli_a5d8xxxxxx
   App Secret: your_app_secret
   ```

**如何获取飞书凭据：**
1. 访问：https://open.feishu.cn/
2. 登录并进入"开发者后台"
3. 选择你的应用
4. 在"凭证与基础信息"中找到 App ID 和 App Secret

---

### 第十步：配置飞书表格

在 Chrome 中：
1. 点击 Tampermonkey 图标
2. 找到 "Etsy Order Fulfiller (多租户版)"
3. 点击 "📊 配置飞书表格（支持多个）"
4. 输入表格配置（每行一个店铺）：

**格式：**
```
店铺名称 --- App Token --- Table ID
```

**示例：**
```
大自然草柳编 --- Cu82bgVDGaNTNsspOs4c6dAJnIc --- tblWlIrPD6KZCy8U
迷尚首饰订单 --- MStWbahj8at2ZvsnheqcJtm2nYb --- tblalRxohrGovqXK
```

5. 点击"确定"保存

---

### 第十一步：创建店铺配置文件（可选）

**如果需要 Python 后端功能（邮件监控、自动下单）：**

```bash
# 进入项目目录
cd ~/etsy-multi-tenant-system

# 复制配置模板
cp configs/shops/template.yaml configs/shops/my_shop.yaml

# 编辑配置文件
open configs/shops/my_shop.yaml
```

**编辑内容：**
```yaml
shop_name: "我的店铺"

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

### 第十二步：测试配置

#### 测试 Tampermonkey 脚本

1. 打开 Etsy 订单页面：
   ```
   https://www.etsy.com/your/orders/sold
   ```

2. 页面右上角应该出现浮动面板：
   ```
   🚀 Etsy Order Fulfiller
   已配置 X 个飞书表格
   ```

3. 点击 "📥 拉取待处理订单"

4. 如果配置正确，应该能看到订单列表

#### 测试 Python 后端（如果配置了）

```bash
# 进入项目目录
cd ~/etsy-multi-tenant-system

# 测试配置
python3 main.py --shop my_shop --test

# 如果配置正确，应该显示：
# ✅ 配置文件加载成功
# ✅ 飞书连接成功
# ✅ 邮箱连接成功
```

---

### 第十三步：运行系统（可选）

**如果需要运行 Python 后端：**

```bash
# 运行单个店铺
python3 main.py --shop my_shop

# 运行所有店铺
python3 main.py --all

# 后台运行
nohup python3 main.py --shop my_shop > logs/my_shop.log 2>&1 &

# 查看日志
tail -f logs/my_shop.log
```

---

## 📊 目录结构

安装完成后，你的目录结构应该是这样的：

```
~/etsy-multi-tenant-system/
├── configs/
│   └── shops/
│       ├── template.yaml          # 模板（已提交）
│       └── my_shop.yaml           # 你的配置（不提交）
├── plugins/
│   └── shops/
│       └── my_shop/               # 店铺插件（提交）
│           ├── __init__.py
│           └── processor.py
├── scripts/
│   └── tampermonkey/
│       ├── etsy-fulfiller-multi-tenant.user.js
│       └── yunexpress-feishu-shipped.user.js
├── docs/
├── logs/
├── main.py
└── requirements.txt
```

---

## 🔧 常见问题

### Q1: pip3 命令找不到

**解决方案：**
```bash
# 使用 python3 -m pip 代替
python3 -m pip install -r requirements.txt
```

### Q2: 权限被拒绝

**解决方案：**
```bash
# 使用 --user 参数
pip3 install --user -r requirements.txt
```

### Q3: Homebrew 安装失败

**解决方案：**
1. 检查网络连接
2. 尝试使用国内镜像：
   ```bash
   export HOMEBREW_BREW_GIT_REMOTE="https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git"
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

### Q4: Git 克隆失败

**解决方案：**
```bash
# 如果是网络问题，尝试使用 SSH
git clone git@github.com:stokisai/etsy-multi-tenant-system.git

# 或者配置代理
git config --global http.proxy http://127.0.0.1:7890
```

### Q5: Tampermonkey 脚本不工作

**检查清单：**
1. ✅ 脚本已启用（在 Tampermonkey 管理面板中）
2. ✅ 已配置飞书凭据
3. ✅ 已配置飞书表格
4. ✅ 在正确的页面（Etsy 订单页面）
5. ✅ 浏览器控制台没有错误

---

## 📝 快速命令参考

### 更新项目

```bash
cd ~/etsy-multi-tenant-system
git pull
pip3 install -r requirements.txt
```

### 查看日志

```bash
# 实时查看日志
tail -f logs/my_shop.log

# 查看最近 100 行
tail -n 100 logs/my_shop.log

# 搜索错误
grep "ERROR" logs/my_shop.log
```

### 重启服务

```bash
# 查找进程
ps aux | grep main.py

# 停止进程
kill <进程ID>

# 重新启动
nohup python3 main.py --shop my_shop > logs/my_shop.log 2>&1 &
```

---

## 🎉 完成

恭喜！你已经在 Mac 上完成了整个系统的配置。

**下一步：**
1. 在飞书表格中添加订单数据
2. 在 Etsy 后台测试自动填充
3. 根据需要配置更多店铺

**需要帮助？**
- 查看其他文档：`docs/`
- 检查日志：`logs/`
- 查看浏览器控制台

---

## 📚 相关文档

- [命令行新店铺配置](./CLI_NEW_SHOP_SETUP.md)
- [Mac Etsy 脚本安装指南](./MAC_ETSY_TAMPERMONKEY_SETUP.md)
- [多租户版本说明](../scripts/tampermonkey/MULTI_TENANT_VERSION.md)
- [配置 vs 代码说明](./CONFIG_VS_CODE.md)
