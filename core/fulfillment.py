"""
发货履约处理器 - 从飞书读取订单并在Etsy完成发货
"""
from loguru import logger
from services.feishu_service import FeishuService
from services.etsy_service import EtsyService


class FulfillmentProcessor:
    """发货履约处理器"""

    def __init__(self, shop_code: str, config: dict):
        self.shop_code = shop_code
        self.config = config
        self.log = logger.bind(shop=shop_code)

        self.feishu = FeishuService(config)
        self.etsy = EtsyService(config)

    def run(self):
        """运行发货履约"""
        # 1. 从飞书读取待处理订单
        orders = self.feishu.fetch_pending_orders()
        self.log.info(f"获取到 {len(orders)} 个待处理订单")

        if not orders:
            return

        # 2. 连接Etsy浏览器
        self.etsy.connect()

        # 3. 逐个处理
        success_count = 0
        for order in orders:
            try:
                if self.etsy.fulfill_order(order):
                    self.feishu.update_order_status(order, "done")
                    success_count += 1
                else:
                    self.feishu.update_order_status(order, "error", "自动填充失败")
            except Exception as e:
                self.log.error(f"处理订单 {order.get('order_id')} 失败: {e}")
                self.feishu.update_order_status(order, "error", str(e)[:100])

        self.log.info(f"完成: {success_count}/{len(orders)} 个订单成功")

        # 4. 关闭浏览器
        self.etsy.close()
