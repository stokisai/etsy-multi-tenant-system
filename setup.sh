#!/bin/bash
# 初始化脚本 - 快速设置多租户系统

set -e

echo "🚀 Etsy多租户系统初始化"
echo "========================"
echo ""

# 检查Python版本
echo "📋 检查Python版本..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "   Python版本: $python_version"

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
    echo "   ✓ 虚拟环境创建成功"
else
    echo "   ✓ 虚拟环境已存在"
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📥 安装依赖..."
pip install -r requirements.txt -q
echo "   ✓ 依赖安装完成"

# 创建必要的目录
echo "📁 创建目录结构..."
mkdir -p logs
mkdir -p data
mkdir -p modules/logistics
mkdir -p services
mkdir -p api/routes
mkdir -p scripts/tampermonkey
mkdir -p core
echo "   ✓ 目录创建完成"

# 创建 __init__.py 文件
echo "📝 创建模块初始化文件..."
touch core/__init__.py
touch modules/__init__.py
touch modules/logistics/__init__.py
touch services/__init__.py
touch api/__init__.py
touch api/routes/__init__.py
echo "   ✓ 初始化文件创建完成"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  .env 文件不存在"
    echo "   请创建 .env 文件并配置环境变量"
    echo "   参考 QUICKSTART.md 中的配置说明"
else
    echo "   ✓ .env 文件已存在"
fi

# 安装 Playwright 浏览器
echo "🌐 安装 Playwright 浏览器..."
playwright install chromium
echo "   ✓ Playwright 浏览器安装完成"

echo ""
echo "✅ 初始化完成！"
echo ""
echo "下一步："
echo "1. 配置 .env 文件（如果还没有）"
echo "2. 创建店铺配置: cp configs/shops/template.yaml configs/shops/myshop.yaml"
echo "3. 编辑店铺配置: vim configs/shops/myshop.yaml"
echo "4. 测试运行: python main.py --list-shops"
echo ""
echo "详细说明请查看 QUICKSTART.md"
