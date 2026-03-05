"""
主入口 - 多租户Etsy自动化系统
"""
import sys
import argparse
from pathlib import Path
from loguru import logger
from shop_registry import get_shop_registry
from core.order_processor import OrderProcessor
from core.fulfillment import FulfillmentProcessor
from core.tracking import TrackingProcessor


def check_git_hooks():
    """检查 Git Hooks 是否已安装"""
    project_root = Path(__file__).parent
    hooks_dir = project_root / ".git" / "hooks"

    # 如果不是 Git 仓库，跳过检查
    if not hooks_dir.exists():
        return

    required_hooks = ["prepare-commit-msg", "post-commit"]
    missing_hooks = [h for h in required_hooks if not (hooks_dir / h).exists()]

    if missing_hooks:
        print("\n" + "="*60)
        print("⚠️  警告: Git Hooks 未安装！")
        print("="*60)
        print("\nGit Hooks 用于自动管理版本号和标签。")
        print("没有 hooks，提交店铺代码时不会自动添加版本号。")
        print("\n缺少以下 hooks:")
        for hook in missing_hooks:
            print(f"  - {hook}")
        print("\n请运行以下命令安装:")
        print("  ./scripts/install_hooks.sh")
        print("\n" + "="*60 + "\n")

        response = input("是否继续运行（不推荐）? (y/N): ").strip().lower()
        if response != 'y':
            print("\n已取消。请先安装 Git Hooks。")
            sys.exit(1)
        print("\n⚠️  继续运行，但提交时不会有自动版本号。\n")


def setup_logging(shop_code: str, config: dict):
    """配置日志"""
    logger.remove()

    # 控制台输出
    logger.add(
        sys.stderr,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{extra[shop]}</cyan> | <level>{message}</level>",
        level=config.get("logging", {}).get("level", "INFO")
    )

    # 文件输出
    log_file = config.get("logging", {}).get("file", f"logs/{shop_code}.log")
    logger.add(
        log_file,
        rotation=config.get("logging", {}).get("rotation", "10 MB"),
        retention=config.get("logging", {}).get("retention", "7 days"),
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {extra[shop]} | {message}",
        level="DEBUG"
    )

    return logger.bind(shop=shop_code)


def process_orders(shop_code: str, config: dict):
    """处理订单"""
    log = setup_logging(shop_code, config)
    log.info(f"开始处理订单: {config['shop_name']}")

    processor = OrderProcessor(shop_code, config)
    processor.run()

    log.info("订单处理完成")


def return_tracking(shop_code: str, config: dict):
    """回填跟踪号"""
    log = setup_logging(shop_code, config)
    log.info(f"开始回填跟踪号: {config['shop_name']}")

    processor = TrackingProcessor(shop_code, config)
    processor.run()

    log.info("跟踪号回填完成")


def fulfill_orders(shop_code: str, config: dict):
    """发货履约"""
    log = setup_logging(shop_code, config)
    log.info(f"开始发货履约: {config['shop_name']}")

    processor = FulfillmentProcessor(shop_code, config)
    processor.run()

    log.info("发货履约完成")


def main():
    # 首先检查 Git Hooks 是否已安装
    check_git_hooks()

    parser = argparse.ArgumentParser(description="Etsy多租户自动化系统")

    parser.add_argument(
        "--shop",
        type=str,
        help="店铺代码（如: nature, jinyalong）"
    )

    parser.add_argument(
        "--all",
        action="store_true",
        help="处理所有启用的店铺"
    )

    parser.add_argument(
        "--task",
        type=str,
        required=True,
        choices=["process_orders", "return_tracking", "fulfill_orders", "calculate_profit"],
        help="要执行的任务"
    )

    parser.add_argument(
        "--list-shops",
        action="store_true",
        help="列出所有可用的店铺"
    )

    args = parser.parse_args()

    registry = get_shop_registry()

    # 列出店铺
    if args.list_shops:
        print("\n可用店铺:")
        for shop in registry.get_all_shops():
            status = "✓" if shop.enabled else "✗"
            print(f"  {status} {shop.shop_code:15} - {shop.shop_name}")
        return

    # 确定要处理的店铺
    if args.all:
        shops = registry.get_enabled_shops()
        if not shops:
            print("没有启用的店铺")
            sys.exit(1)
    elif args.shop:
        shop = registry.get_shop(args.shop)
        if not shop:
            print(f"店铺不存在: {args.shop}")
            sys.exit(1)
        if not shop.enabled:
            print(f"店铺未启用: {args.shop}")
            sys.exit(1)
        shops = [shop]
    else:
        print("请指定 --shop 或 --all")
        sys.exit(1)

    # 执行任务
    task_map = {
        "process_orders": process_orders,
        "return_tracking": return_tracking,
        "fulfill_orders": fulfill_orders,
    }

    task_func = task_map.get(args.task)
    if not task_func:
        print(f"未实现的任务: {args.task}")
        sys.exit(1)

    for shop in shops:
        try:
            task_func(shop.shop_code, shop.config)
        except Exception as e:
            logger.error(f"处理店铺 {shop.shop_code} 时出错: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    main()
