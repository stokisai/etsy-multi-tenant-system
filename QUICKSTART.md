# 快速开始指南

## 1. 安装依赖

```bash
cd etsy-multi-tenant-system
pip install -r requirements.txt
```

## 2. 配置环境变量

创建 `.env` 文件：

```bash
# 飞书配置
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# 云途物流
YUNEXPRESS_APP_ID=your_app_id
YUNEXPRESS_APP_SECRET=your_app_secret
YUNEXPRESS_SOURCE_KEY=your_source_key

# 泰嘉物流
TAKESEND_CLIENT_ID=your_client_id
TAKESEND_AUTH_TOKEN=your_auth_token

# 邮箱配置
YAHOO_EMAIL=your_email@yahoo.com
YAHOO_APP_PASSWORD=your_app_password

# OpenRouter AI
OPENROUTER_API_KEY=your_api_key
```

## 3. 创建店铺配置

```bash
# 复制模板
cp configs/shops/template.yaml configs/shops/myshop.yaml

# 编辑配置
vim configs/shops/myshop.yaml
```

关键配置项：
- `shop_code`: 店铺唯一标识
- `shop_name`: 店铺名称
- `feishu.order_table`: 飞书表格信息
- `logistics`: 物流配置
- `sku_rules`: SKU规则

## 4. 测试配置

```bash
# 列出所有店铺
python main.py --list-shops

# 应该看到：
# 可用店铺:
#   ✓ myshop - 我的店铺
```

## 5. 运行任务

### 处理订单
```bash
python main.py --shop myshop --task process_orders
```

### 发货履约
```bash
python main.py --shop myshop --task fulfill_orders
```

### 跟踪号回填
```bash
python main.py --shop myshop --task return_tracking
```

### 处理所有店铺
```bash
python main.py --all --task process_orders
```

## 6. 设置定时任务

### 使用 cron (Linux/Mac)

```bash
# 编辑 crontab
crontab -e

# 添加任务
*/5 * * * * cd /path/to/etsy-multi-tenant-system && python main.py --all --task process_orders
0 */2 * * * cd /path/to/etsy-multi-tenant-system && python main.py --all --task return_tracking
```

### 使用 launchd (Mac)

创建 `~/Library/LaunchAgents/com.etsy.automation.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.etsy.automation</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/python3</string>
        <string>/path/to/etsy-multi-tenant-system/main.py</string>
        <string>--all</string>
        <string>--task</string>
        <string>process_orders</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

加载任务：
```bash
launchctl load ~/Library/LaunchAgents/com.etsy.automation.plist
```

## 7. 部署到 Railway

### 7.1 准备文件

确保有以下文件：
- `Procfile`
- `railway.toml`
- `requirements.txt`

### 7.2 部署

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
railway init

# 部署
railway up
```

### 7.3 设置环境变量

在 Railway 控制台设置所有环境变量。

## 8. 监控和日志

### 查看日志
```bash
tail -f logs/myshop.log
```

### 日志级别
在配置文件中调整：
```yaml
logging:
  level: "DEBUG"  # DEBUG, INFO, WARNING, ERROR
```

## 常用命令

```bash
# 列出所有店铺
python main.py --list-shops

# 处理单个店铺
python main.py --shop nature --task process_orders

# 处理所有店铺
python main.py --all --task process_orders

# 发货履约
python main.py --shop jinyalong --task fulfill_orders

# 跟踪号回填
python main.py --shop mishang --task return_tracking
```

## 故障排查

### 问题1: 配置文件找不到
```bash
# 检查文件是否存在
ls configs/shops/

# 检查文件名是否正确
python main.py --list-shops
```

### 问题2: 环境变量未加载
```bash
# 确保 .env 文件在项目根目录
ls -la .env

# 手动加载测试
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.getenv('FEISHU_APP_ID'))"
```

### 问题3: 飞书API调用失败
```bash
# 检查凭据是否正确
# 检查网络连接
# 查看详细日志
```

## 下一步

- 阅读 [MIGRATION.md](./MIGRATION.md) 了解如何从旧系统迁移
- 查看 [README.md](./README.md) 了解系统架构
- 配置更多店铺
- 设置监控告警
