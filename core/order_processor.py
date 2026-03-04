"""
订单处理器 - 核心业务逻辑
"""
from loguru import logger
from modules.email_monitor import EmailMonitor
from modules.order_parser import OrderParser
from modules.logistics.factory import LogisticsFactory
from services.feishu_service import FeishuService


class OrderProcessor:
    """订单处理器"""

    def __init__(self, shop_code: str, config: dict):
        self.shop_code = shop_code
        self.config = config
        self.log = logger.bind(shop=shop_code)

        # 初始化服务
        self.email_monitor = EmailMonitor(config)
        self.order_parser = OrderParser(config)
        self.feishu = FeishuService(config)
        self.logistics_factory = LogisticsFactory(config)

    def run(self):
        """运行订单处理"""
        # 1. 检查邮件
        if not self.config.get("email", {}).get("enabled", False):
            self.log.info("邮件监控未启用")
            return

        emails = self.email_monitor.fetch_new_orders()
        self.log.info(f"获取到 {len(emails)} 封新邮件")

        for email_data in emails:
            self.process_single_order(email_data)

    def process_single_order(self, email_data: dict):
        """处理单个订单"""
        try:
            # 1. 解析订单
            order_data = self.order_parser.parse(email_data)
            if not order_data:
                self.log.error("订单解析失败")
                return

            order_id = order_data.get("order_id")
            self.log.info(f"处理订单: {order_id}")

            # 2. 处理每个产品
            for product in order_data.get("products", []):
                self.process_product(order_data, product)

        except Exception as e:
            self.log.error(f"处理订单失败: {e}")

    def process_product(self, order_data: dict, product: dict):
        """处理单个产品"""
        sku = product.get("sku")
        self.log.info(f"处理产品: {sku}")

        # 1. 选择物流商
        logistics_client = self.logistics_factory.get_client_for_sku(sku)

        # 2. 创建物流订单
        result = logistics_client.create_order(order_data, product)

        if result and result.get("success"):
            # 3. 写入飞书
            self.feishu.write_order(order_data, product, result)
            self.log.info(f"订单创建成功: {result.get('waybill')}")
        else:
            self.log.error(f"订单创建失败: {result.get('error')}")
