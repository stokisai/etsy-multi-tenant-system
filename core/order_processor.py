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

        # 🎯 读取店铺特定业务规则
        self.business_rules = config.get('business_rules', {})

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

            # 🎯 2. 应用店铺特定的地址验证规则
            if not self.validate_address(order_data):
                self.log.warning(f"订单 {order_id} 地址验证失败")
                return

            # 🎯 3. 应用店铺特定的价格规则
            self.apply_pricing_rules(order_data)

            # 4. 处理每个产品
            for product in order_data.get("products", []):
                self.process_product(order_data, product)

        except Exception as e:
            self.log.error(f"处理订单失败: {e}")

    def validate_address(self, order_data: dict) -> bool:
        """验证地址（根据店铺规则）"""
        address_rules = self.business_rules.get('address_validation', {})

        # 如果没有配置规则，默认通过
        if not address_rules:
            return True

        address = order_data.get('shipping_address', {})

        # 检查是否允许PO Box
        if not address_rules.get('allow_po_box', True):
            address_line = address.get('address1', '').upper()
            if 'PO BOX' in address_line or 'P.O. BOX' in address_line:
                self.log.warning(f"店铺 {self.shop_code} 不允许PO Box地址")
                return False

        # 检查是否必须有电话
        if address_rules.get('require_phone', False):
            phone = address.get('phone', '').strip()
            if not phone:
                self.log.warning(f"店铺 {self.shop_code} 要求必须有电话号码")
                return False

        return True

    def apply_pricing_rules(self, order_data: dict):
        """应用价格规则（根据店铺规则）"""
        pricing_rules = self.business_rules.get('pricing', {})

        if not pricing_rules:
            return

        # 应用折扣
        if pricing_rules.get('apply_discount', False):
            discount_rate = pricing_rules.get('discount_rate', 0.0)
            original_price = order_data.get('total_price', 0.0)
            discounted_price = original_price * (1 - discount_rate)
            order_data['total_price'] = discounted_price
            order_data['discount_applied'] = discount_rate
            self.log.info(f"应用 {discount_rate*100}% 折扣: ${original_price} -> ${discounted_price}")

        # 检查最小订单金额
        min_order_value = pricing_rules.get('min_order_value', 0.0)
        if min_order_value > 0:
            total_price = order_data.get('total_price', 0.0)
            if total_price < min_order_value:
                self.log.warning(f"订单金额 ${total_price} 低于最小金额 ${min_order_value}")
                order_data['below_minimum'] = True

    def process_product(self, order_data: dict, product: dict):
        """处理单个产品"""
        sku = product.get("sku")
        self.log.info(f"处理产品: {sku}")

        # 🎯 1. 应用店铺特定的下单规则
        order_params = self.prepare_order_params(order_data, product)

        # 2. 选择物流商
        logistics_client = self.logistics_factory.get_client_for_sku(sku)

        # 3. 创建物流订单
        result = logistics_client.create_order(order_data, product, **order_params)

        if result and result.get("success"):
            # 4. 写入飞书
            self.feishu.write_order(order_data, product, result)
            self.log.info(f"订单创建成功: {result.get('waybill')}")

            # 🎯 5. 执行店铺特定的后续操作
            self.post_order_actions(order_data, product, result)
        else:
            self.log.error(f"订单创建失败: {result.get('error')}")

    def prepare_order_params(self, order_data: dict, product: dict) -> dict:
        """准备下单参数（根据店铺规则）"""
        order_rules = self.business_rules.get('order_submission', {})
        params = {}

        # 添加自定义备注
        if order_rules.get('add_custom_note', False):
            custom_note = order_rules.get('custom_note', '')
            params['custom_note'] = custom_note
            self.log.info(f"添加自定义备注: {custom_note}")

        # 是否需要签名
        if order_rules.get('require_signature', False):
            params['require_signature'] = True
            self.log.info("要求签名确认")

        # 是否需要保险
        if order_rules.get('insurance_required', False):
            params['insurance_required'] = True
            params['insurance_value'] = order_rules.get('insurance_value', 50.0)
            self.log.info(f"添加保险: ${params['insurance_value']}")

        return params

    def post_order_actions(self, order_data: dict, product: dict, result: dict):
        """下单后的操作（根据店铺规则）"""
        notification_rules = self.business_rules.get('notifications', {})

        # 发送微信通知
        if notification_rules.get('send_wechat', False):
            self.send_wechat_notification(order_data, result)

        # 发送邮件通知
        if notification_rules.get('send_email', False):
            self.send_email_notification(order_data, result)

        # 更新库存
        inventory_rules = self.business_rules.get('inventory', {})
        if inventory_rules.get('check_before_order', False):
            self.update_inventory(product)

    def send_wechat_notification(self, order_data: dict, result: dict):
        """发送微信通知（店铺特定）"""
        self.log.info(f"发送微信通知: 订单 {order_data.get('order_id')} 已创建")
        # TODO: 实现微信通知逻辑

    def send_email_notification(self, order_data: dict, result: dict):
        """发送邮件通知（店铺特定）"""
        self.log.info(f"发送邮件通知: 订单 {order_data.get('order_id')} 已创建")
        # TODO: 实现邮件通知逻辑

    def update_inventory(self, product: dict):
        """更新库存（店铺特定）"""
        self.log.info(f"更新库存: SKU {product.get('sku')}")
        # TODO: 实现库存更新逻辑
