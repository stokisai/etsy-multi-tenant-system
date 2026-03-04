#!/usr/bin/env python3
"""
新店铺快速创建工具
使用方式：python create_shop.py --shop my_new_shop --name "我的新店铺"
"""
import argparse
import os
import shutil
from pathlib import Path


def create_shop_config(shop_code: str, shop_name: str):
    """创建新店铺配置文件"""

    # 获取项目根目录
    project_root = Path(__file__).parent
    template_path = project_root / "configs" / "shops" / "template.yaml"
    new_config_path = project_root / "configs" / "shops" / f"{shop_code}.yaml"

    # 检查模板是否存在
    if not template_path.exists():
        print(f"❌ 错误：模板文件不存在 {template_path}")
        return False

    # 检查配置文件是否已存在
    if new_config_path.exists():
        print(f"⚠️  警告：配置文件已存在 {new_config_path}")
        overwrite = input("是否覆盖？(y/N): ").strip().lower()
        if overwrite != 'y':
            print("❌ 取消创建")
            return False

    # 复制模板
    shutil.copy(template_path, new_config_path)

    # 读取配置文件
    with open(new_config_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 替换店铺代码和名称
    content = content.replace('shop_code: template', f'shop_code: {shop_code}')
    content = content.replace('shop_name: "店铺模板"', f'shop_name: "{shop_name}"')

    # 写回配置文件
    with open(new_config_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ 成功创建店铺配置：{new_config_path}")
    print()
    print("📝 下一步：")
    print(f"1. 编辑配置文件：{new_config_path}")
    print(f"2. 设置环境变量（.env文件）")
    print(f"3. 运行测试：python main.py --shop {shop_code} --task process_orders --dry-run")
    print(f"4. 正式运行：python main.py --shop {shop_code} --task process_orders")
    print()
    print("📖 查看完整指南：docs/NEW_SHOP_GUIDE.md")

    return True


def main():
    parser = argparse.ArgumentParser(
        description="快速创建新店铺配置",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例：
  python create_shop.py --shop nature --name "大自然店铺"
  python create_shop.py --shop my_shop --name "我的店铺"
        """
    )

    parser.add_argument(
        '--shop',
        required=True,
        help='店铺代码（英文，用于命令行和文件名）'
    )

    parser.add_argument(
        '--name',
        required=True,
        help='店铺名称（中文，用于显示）'
    )

    args = parser.parse_args()

    # 验证店铺代码格式
    if not args.shop.replace('_', '').replace('-', '').isalnum():
        print("❌ 错误：店铺代码只能包含字母、数字、下划线和连字符")
        return

    # 创建配置
    create_shop_config(args.shop, args.name)


if __name__ == "__main__":
    main()
