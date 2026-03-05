#!/bin/bash

# 店铺特定代码提交脚本
# 用法: ./scripts/shop_commit.sh <shop_code> <type> <version> <description>
# 例如: ./scripts/shop_commit.sh mishang Add 1.2.0 "add fragile item detection"

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ $# -lt 4 ]; then
    echo -e "${RED}错误: 参数不足${NC}"
    echo "用法: $0 <shop_code> <type> <version> <description>"
    echo ""
    echo "参数说明:"
    echo "  shop_code   : 店铺代码 (例如: mishang, nature, jinyalong)"
    echo "  type        : 提交类型 (Add, Update, Fix, Refactor, Remove)"
    echo "  version     : 版本号 (例如: 1.2.0)"
    echo "  description : 简短描述 (例如: 'add fragile item detection')"
    echo ""
    echo "示例:"
    echo "  $0 mishang Add 1.2.0 'add fragile item detection'"
    echo "  $0 nature Fix 1.1.1 'fix SKU matching logic'"
    exit 1
fi

SHOP_CODE=$1
TYPE=$2
VERSION=$3
DESCRIPTION=$4

# 验证 type
VALID_TYPES=("Add" "Update" "Fix" "Refactor" "Remove")
if [[ ! " ${VALID_TYPES[@]} " =~ " ${TYPE} " ]]; then
    echo -e "${RED}错误: 无效的提交类型 '${TYPE}'${NC}"
    echo "有效类型: ${VALID_TYPES[@]}"
    exit 1
fi

# 验证版本号格式
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}错误: 无效的版本号格式 '${VERSION}'${NC}"
    echo "版本号格式应为: X.Y.Z (例如: 1.2.0)"
    exit 1
fi

# 店铺插件目录
SHOP_DIR="plugins/shops/${SHOP_CODE}"

# 检查店铺目录是否存在
if [ ! -d "$SHOP_DIR" ]; then
    echo -e "${RED}错误: 店铺目录不存在: ${SHOP_DIR}${NC}"
    exit 1
fi

echo -e "${GREEN}=== 店铺特定代码提交工具 ===${NC}"
echo ""
echo "店铺代码: ${SHOP_CODE}"
echo "提交类型: ${TYPE}"
echo "版本号:   v${VERSION}"
echo "描述:     ${DESCRIPTION}"
echo ""

# 检查是否有未提交的更改
if ! git diff --quiet "$SHOP_DIR"; then
    echo -e "${YELLOW}检测到未提交的更改:${NC}"
    git diff --stat "$SHOP_DIR"
    echo ""
else
    echo -e "${RED}错误: 没有检测到任何更改${NC}"
    exit 1
fi

# 查看当前最新版本
echo -e "${YELLOW}当前版本历史:${NC}"
git tag -l "${SHOP_CODE}-v*" | tail -5 || echo "  (无版本历史)"
echo ""

# 确认提交
read -p "确认提交? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 1
fi

# 添加文件
echo -e "${GREEN}添加文件...${NC}"
git add "$SHOP_DIR"

# 提交
echo -e "${GREEN}创建提交...${NC}"
COMMIT_MSG="[${SHOP_CODE}] ${TYPE}: ${DESCRIPTION} v${VERSION}

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

git commit -m "$COMMIT_MSG"

# 打标签
TAG_NAME="${SHOP_CODE}-v${VERSION}"
echo -e "${GREEN}创建标签: ${TAG_NAME}${NC}"
git tag "$TAG_NAME"

# 推送
echo -e "${GREEN}推送到远程仓库...${NC}"
git push && git push --tags

echo ""
echo -e "${GREEN}✅ 完成!${NC}"
echo ""
echo "提交信息:"
git log -1 --pretty=format:"%h - %s" HEAD
echo ""
echo ""
echo "标签: ${TAG_NAME}"
echo ""
echo -e "${YELLOW}Railway 将自动检测到更新并重新部署${NC}"
