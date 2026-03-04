"""
跟踪号处理器 - 查询物流跟踪号并回填到飞书
"""
from loguru import logger
from services.feishu_service import FeishuService
from modules.logistics.factory import LogisticsFactory


class TrackingProcessor:
    """跟踪号处理器"""

    def __init__(self, shop_code: str, config: dict):
        self.shop_code = shop_code
        self.config = config
        self.log = logger.bind(shop=shop_code)

        self.feishu = FeishuService(config)
        self.logistics_factory = LogisticsFactory(config)

    def run(self):
        """运行跟踪号查询"""
        # 1. 从飞书读取需要查询跟踪号的订单
        orders = self.feishu.fetch_orders_need_tracking()
        self.log.info(f"获取到 {len(orders)} 个需要查询跟踪号的订单")

        for order in orders:
            self.process_order(order)

    def process_order(self, order: dict):
        """处理单个订单"""
        waybill = order.get("waybill")
        logistics_type = order.get("logistics_type", "yunexpress")

        try:
            # 获取物流客户端
            client = self.logistics_factory.get_client(logistics_type)

            # 查询末端跟踪号
            tracking = client.get_last_mile_tracking(waybill)

            if tracking:
                self.log.info(f"查询到跟踪号: {waybill} -> {tracking}")
                self.feishu.update_tracking(order, tracking)
            else:
                self.log.warning(f"未查询到跟踪号: {waybill}")

        except Exception as e:
            self.log.error(f"查询跟踪号失败: {waybill}, {e}")
