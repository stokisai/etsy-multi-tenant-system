"""
配置验证脚本 - 检查配置是否正确
"""
import sys
from pathlib import Path
from config_loader import get_config_loader
from shop_registry import get_shop_registry


def check_env_vars():
    """检查环境变量"""
    import os
    from dotenv import load_dotenv

    load_dotenv()

    required_vars = [
        "FEISHU_APP_ID",
        "FEISHU_APP_SECRET",
    ]

    optional_vars = [
        "YUNEXPRESS_APP_ID",
        "TAKESEND_CLIENT_ID",
        "YAHOO_EMAIL",
        "OPENROUTER_API_KEY",
    ]

    print("🔍 检查环境变量...")
    print()

    missing = []
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"  ✓ {var}: {'*' * 10}")
        else:
            print(f"  ✗ {var}: 未设置")
            missing.append(var)

    print()
    print("可选环境变量:")
    for var in optional_vars:
        value = os.getenv(var)
        if value:
            print(f"  ✓ {var}: {'*' * 10}")
        else:
            print(f"  - {var}: 未设置")

    print()

    if missing:
        print(f"❌ 缺少必需的环境变量: {', '.join(missing)}")
        return False
    else:
        print("✅ 所有必需的环境变量已设置")
        return True


def check_config_files():
    """检查配置文件"""
    print()
    print("📁 检查配置文件...")
    print()

    config_dir = Path("configs")
    shops_dir = config_dir / "shops"

    # 检查全局配置
    global_config = config_dir / "global.yaml"
    if global_config.exists():
        print(f"  ✓ 全局配置: {global_config}")
    else:
        print(f"  ✗ 全局配置不存在: {global_config}")
        return False

    # 检查店铺配置
    if not shops_dir.exists():
        print(f"  ✗ 店铺配置目录不存在: {shops_dir}")
        return False

    shop_configs = list(shops_dir.glob("*.yaml"))
    shop_configs = [f for f in shop_configs if f.stem != "template"]

    if not shop_configs:
        print(f"  ⚠️  没有找到店铺配置文件")
        print(f"     请复制 configs/shops/template.yaml 并创建店铺配置")
        return False

    print(f"  ✓ 找到 {len(shop_configs)} 个店铺配置:")
    for config in shop_configs:
        print(f"     - {config.stem}")

    print()
    print("✅ 配置文件检查通过")
    return True


def check_shops():
    """检查店铺配置"""
    print()
    print("🏪 检查店铺配置...")
    print()

    try:
        registry = get_shop_registry()
        shops = registry.get_all_shops()

        if not shops:
            print("  ⚠️  没有找到可用的店铺")
            return False

        print(f"  找到 {len(shops)} 个店铺:")
        print()

        for shop in shops:
            status = "✓" if shop.enabled else "✗"
            print(f"  {status} {shop.shop_code:15} - {shop.shop_name}")

            # 检查关键配置
            config = shop.config
            issues = []

            # 检查飞书配置
            if not config.get("feishu", {}).get("order_table"):
                issues.append("缺少飞书订单表配置")

            # 检查物流配置
            logistics = config.get("logistics", {})
            if not logistics.get("yunexpress", {}).get("enabled") and \
               not logistics.get("takesend", {}).get("enabled"):
                issues.append("没有启用任何物流商")

            if issues:
                for issue in issues:
                    print(f"       ⚠️  {issue}")

        print()
        print("✅ 店铺配置检查完成")
        return True

    except Exception as e:
        print(f"  ❌ 检查店铺配置时出错: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_dependencies():
    """检查依赖"""
    print()
    print("📦 检查依赖...")
    print()

    required_packages = [
        "yaml",
        "loguru",
        "requests",
        "dotenv",
        "playwright",
        "pydantic",
        "flask",
    ]

    missing = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"  ✓ {package}")
        except ImportError:
            print(f"  ✗ {package}")
            missing.append(package)

    print()

    if missing:
        print(f"❌ 缺少依赖: {', '.join(missing)}")
        print("   运行: pip install -r requirements.txt")
        return False
    else:
        print("✅ 所有依赖已安装")
        return True


def main():
    """主函数"""
    print()
    print("=" * 50)
    print("  Etsy 多租户系统 - 配置验证")
    print("=" * 50)
    print()

    checks = [
        ("依赖检查", check_dependencies),
        ("环境变量检查", check_env_vars),
        ("配置文件检查", check_config_files),
        ("店铺配置检查", check_shops),
    ]

    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ {name}失败: {e}")
            results.append((name, False))

    # 总结
    print()
    print("=" * 50)
    print("  检查结果总结")
    print("=" * 50)
    print()

    all_passed = True
    for name, result in results:
        status = "✅" if result else "❌"
        print(f"  {status} {name}")
        if not result:
            all_passed = False

    print()

    if all_passed:
        print("🎉 所有检查通过！系统已准备就绪。")
        print()
        print("下一步:")
        print("  python main.py --list-shops")
        print("  python main.py --shop <shop_code> --task process_orders")
        return 0
    else:
        print("⚠️  部分检查未通过，请修复上述问题。")
        print()
        print("帮助:")
        print("  查看 QUICKSTART.md 获取详细配置说明")
        return 1


if __name__ == "__main__":
    sys.exit(main())
