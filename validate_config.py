#!/usr/bin/env python3
"""
配置验证工具
使用方式：python validate_config.py --shop my_shop
"""
import argparse
import sys
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent))

from config_loader import ConfigLoader
from loguru import logger


def validate_shop_config(shop_code: str) -> bool:
    """验证店铺配置"""

    print(f"\n🔍 验证店铺配置：{shop_code}")
    print("=" * 60)

    try:
        # 加载配置
        config = ConfigLoader.load_shop_config(shop_code)
        print("✅ 配置文件加载成功")

        # 验证必需字段
        required_fields = {
            "shop_code": "店铺代码",
            "shop_name": "店铺名称",
            "etsy": "Etsy配置",
            "feishu": "飞书配置",
            "logistics": "物流配置",
        }

        print("\n📋 检查必需字段：")
        all_valid = True

        for field, description in required_fields.items():
            if field in config and config[field]:
                print(f"  ✅ {description}")
            else:
                print(f"  ❌ {description} - 缺失或为空")
                all_valid = False

        # 验证Etsy配置
        print("\n🛍️  Etsy配置：")
        etsy = config.get("etsy", {})
        if etsy.get("shop_id"):
            print(f"  ✅ Shop ID: {etsy['shop_id']}")
        else:
            print("  ❌ Shop ID 未配置")
            all_valid = False

        if etsy.get("api_key"):
            print(f"  ✅ API Key: {etsy['api_key'][:10]}...")
        else:
            print("  ❌ API Key 未配置")
            all_valid = False

        # 验证飞书配置
        print("\n📊 飞书配置：")
        feishu = config.get("feishu", {})
        if feishu.get("app_id"):
            print(f"  ✅ App ID: {feishu['app_id'][:10]}...")
        else:
            print("  ❌ App ID 未配置")
            all_valid = False

        if feishu.get("table_id"):
            print(f"  ✅ Table ID: {feishu['table_id']}")
        else:
            print("  ❌ Table ID 未配置")
            all_valid = False

        # 验证物流配置
        print("\n🚚 物流配置：")
        logistics = config.get("logistics", {})
        default_provider = logistics.get("default_provider")

        if default_provider:
            print(f"  ✅ 默认物流商: {default_provider}")
        else:
            print("  ❌ 默认物流商未配置")
            all_valid = False

        # 检查启用的物流商
        enabled_providers = []
        for provider in ["yunexpress", "takesend"]:
            provider_config = logistics.get(provider, {})
            if provider_config.get("enabled"):
                enabled_providers.append(provider)
                print(f"  ✅ {provider} 已启用")

                # 检查必需的认证信息
                if provider == "yunexpress":
                    if not provider_config.get("customer_id"):
                        print(f"    ⚠️  customer_id 未配置")
                        all_valid = False
                    if not provider_config.get("api_key"):
                        print(f"    ⚠️  api_key 未配置")
                        all_valid = False

                elif provider == "takesend":
                    if not provider_config.get("client_id"):
                        print(f"    ⚠️  client_id 未配置")
                        all_valid = False
                    if not provider_config.get("auth_token"):
                        print(f"    ⚠️  auth_token 未配置")
                        all_valid = False

        if not enabled_providers:
            print("  ⚠️  没有启用任何物流商")
            all_valid = False

        # 验证邮箱配置
        print("\n📧 邮箱配置：")
        email = config.get("email", {})
        if email.get("address"):
            print(f"  ✅ 邮箱地址: {email['address']}")
        else:
            print("  ⚠️  邮箱地址未配置（如果不使用邮箱监控可忽略）")

        # 验证发件人信息
        print("\n📦 发件人信息：")
        sender = config.get("sender", {})
        if sender.get("first_name") and sender.get("last_name"):
            print(f"  ✅ 发件人: {sender['first_name']} {sender['last_name']}")
        else:
            print("  ⚠️  发件人姓名未配置")
            all_valid = False

        if sender.get("address"):
            print(f"  ✅ 发件地址: {sender['address']}")
        else:
            print("  ⚠️  发件地址未配置")
            all_valid = False

        # 总结
        print("\n" + "=" * 60)
        if all_valid:
            print("✅ 配置验证通过！可以开始使用。")
            print(f"\n下一步：")
            print(f"  python main.py --shop {shop_code} --task process_orders --dry-run")
            return True
        else:
            print("❌ 配置验证失败，请检查上述错误。")
            return False

    except FileNotFoundError:
        print(f"❌ 错误：配置文件不存在")
        print(f"   请先创建配置文件：")
        print(f"   python create_shop.py --shop {shop_code} --name \"店铺名称\"")
        return False

    except Exception as e:
        print(f"❌ 错误：{e}")
        logger.exception("配置验证失败")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="验证店铺配置",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例：
  python validate_config.py --shop nature
  python validate_config.py --shop my_new_shop
        """
    )

    parser.add_argument(
        '--shop',
        required=True,
        help='店铺代码'
    )

    args = parser.parse_args()

    # 验证配置
    success = validate_shop_config(args.shop)

    # 返回退出码
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
