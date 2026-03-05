#!/bin/bash

# Git Hooks 检查脚本
# 在运行系统前检查 hooks 是否已安装

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "======================================================================"
echo "  检查 Git Hooks 安装状态"
echo "======================================================================"
echo ""

# 检查是否在 Git 仓库中
if [ ! -d .git ]; then
    echo -e "${YELLOW}提示: 当前目录不是 Git 仓库，跳过 hooks 检查${NC}"
    exit 0
fi

# 检查 hooks 是否存在
HOOKS_MISSING=0

if [ ! -f .git/hooks/prepare-commit-msg ]; then
    echo -e "${RED}✗ prepare-commit-msg 未安装${NC}"
    HOOKS_MISSING=1
else
    echo -e "${GREEN}✓ prepare-commit-msg 已安装${NC}"
fi

if [ ! -f .git/hooks/post-commit ]; then
    echo -e "${RED}✗ post-commit 未安装${NC}"
    HOOKS_MISSING=1
else
    echo -e "${GREEN}✓ post-commit 已安装${NC}"
fi

echo ""

if [ $HOOKS_MISSING -eq 1 ]; then
    echo "======================================================================"
    echo -e "${RED}  ⚠️  警告: Git Hooks 未安装！${NC}"
    echo "======================================================================"
    echo ""
    echo "Git Hooks 用于自动管理版本号和标签。"
    echo "没有 hooks，提交店铺代码时不会自动添加版本号。"
    echo ""
    echo "请运行以下命令安装:"
    echo -e "  ${GREEN}./scripts/install_hooks.sh${NC}"
    echo ""
    echo "======================================================================"
    echo ""

    read -p "是否继续运行（不推荐）? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "已取消。请先安装 Git Hooks。"
        exit 1
    fi

    echo ""
    echo -e "${YELLOW}⚠️  继续运行，但提交时不会有自动版本号。${NC}"
    echo ""
else
    echo -e "${GREEN}✓ Git Hooks 已正确安装${NC}"
    echo ""
fi
