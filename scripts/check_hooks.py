#!/usr/bin/env python3
"""
检查 Git Hooks 是否已安装
如果未安装，提示用户安装
"""

import os
import sys
from pathlib import Path

def check_hooks_installed():
    """检查 Git Hooks 是否已安装"""

    # 获取项目根目录
    project_root = Path(__file__).parent.parent

    # 检查 hooks 文件是否存在
    hooks_dir = project_root / ".git" / "hooks"

    required_hooks = [
        "prepare-commit-msg",
        "post-commit"
    ]

    missing_hooks = []
    for hook in required_hooks:
        hook_path = hooks_dir / hook
        if not hook_path.exists():
            missing_hooks.append(hook)

    if missing_hooks:
        print("⚠️  警告: Git Hooks 未安装！")
        print()
        print("缺少以下 hooks:")
        for hook in missing_hooks:
            print(f"  - {hook}")
        print()
        print("Git Hooks 用于自动管理版本号和标签。")
        print("没有 hooks，提交时不会自动添加版本号。")
        print()
        print("请运行以下命令安装:")
        print("  ./scripts/install_hooks.sh")
        print()

        # 询问是否继续
        response = input("是否继续运行（不推荐）? (y/N): ").strip().lower()
        if response != 'y':
            print("已取消。请先安装 Git Hooks。")
            sys.exit(1)
        print()
        print("⚠️  继续运行，但提交时不会有自动版本号。")
        print()
    else:
        # Hooks 已安装，静默通过
        pass

if __name__ == "__main__":
    check_hooks_installed()
