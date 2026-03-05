#!/bin/bash

# Git Hooks 安装脚本
# 用法: ./scripts/install_hooks.sh

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Git Hooks 安装工具 ===${NC}"
echo ""

# 检查是否在 Git 仓库中
if [ ! -d .git ]; then
    echo -e "${YELLOW}错误: 当前目录不是 Git 仓库${NC}"
    echo "请在项目根目录运行此脚本"
    exit 1
fi

# 复制 hooks
echo "正在安装 Git Hooks..."

cp scripts/git-hooks/prepare-commit-msg .git/hooks/prepare-commit-msg
chmod +x .git/hooks/prepare-commit-msg
echo "✅ 已安装: prepare-commit-msg"

cp scripts/git-hooks/post-commit .git/hooks/post-commit
chmod +x .git/hooks/post-commit
echo "✅ 已安装: post-commit"

echo ""
echo -e "${GREEN}🎉 Git Hooks 安装完成！${NC}"
echo ""
echo "现在你可以使用简化的提交流程："
echo "  git commit -m \"[mishang] 添加功能\""
echo ""
echo "系统会自动："
echo "  ✅ 生成版本号"
echo "  ✅ 创建标签"
echo ""
