"""
示例：如何在代码中处理不同店铺的特定逻辑
"""
from loguru import logger


class OrderProcessor:
    """订单处理器 - 展示如何处理店铺特定逻辑"""

    def __init__(self, shop_code: str, config: dict):
        self.shop_code = shop_code
        self.config = config
        self.business_rules = config.get('business_rules', {})
        self.log = logger.bind(shop=shop_code)

    # ============================================
    # 方法1：配置驱动（推荐）
    # ============================================

    def process_order_config_driven(self, order_data: dict):
        """使用配置驱动的方式处理订单"""

        self.log.info(f"[{self.shop_code}] 开始处理订单: {order_data.get('order_id')}")

        # 🎯 从配置读取业务规则
        order_rules = self.business_rules.get('order_submission', {})

        # 添加自定义备注（如果配置了）
        if order_rules.get('add_custom_note', False):
            custom_note = order_rules.get('custom_note', '')
            order_data['note'] = custom_note
            self.log.info(f"[{self.shop_code}] 添加备注: {custom_note}")

        # 添加保险（如果配置了）
        if order_rules.get('insurance_required', False):
            insurance_value = order_rules.get('insurance_value', 50.0)
            order_data['insurance'] = insurance_value
            self.log.info(f"[{self.shop_code}] 添加保险: ${insurance_value}")

        # 要求签名（如果配置了）
        if order_rules.get('require_signature', False):
            order_data['signature_required'] = True
            self.log.info(f"[{self.shop_code}] 要求签名确认")

        return order_data

    # ============================================
    # 方法2：直接判断 shop_code（简单逻辑）
    # ============================================

    def process_order_with_shop_check(self, order_data: dict):
        """使用 shop_code 判断的方式处理订单"""

        self.log.info(f"[{self.shop_code}] 开始处理订单: {order_data.get('order_id')}")

        # 🎯 根据 shop_code 执行不同逻辑
        if self.shop_code == "mishang":
            # 迷尚店铺：易碎品处理
            order_data['note'] = "易碎品，请小心处理。Fragile, handle with care."
            order_data['insurance'] = 50.0
            order_data['signature_required'] = True
            self.log.info(f"[mishang] 应用易碎品处理规则")

        elif self.shop_code == "jinyalong_yt":
            # 金亚龙云途：重货检查
            weight = order_data.get('weight', 0)
            if weight > 30.0:
                self.log.warning(f"[jinyalong_yt] 重量超限: {weight}kg > 30kg")
                return None
            order_data['note'] = "重货，请使用加固包装。"
            self.log.info(f"[jinyalong_yt] 应用重货处理规则")

        elif self.shop_code == "zhangjiaggang":
            # 张家港：供应商直发
            order_data['note'] = "张家港供应商直发"
            order_data['supplier_code'] = "ZJG001"
            self.log.info(f"[zhangjiaggang] 应用供应商直发规则")

        elif self.shop_code == "nature":
            # 大自然：标准流程
            self.log.info(f"[nature] 使用标准流程")

        else:
            # 其他店铺：默认处理
            self.log.info(f"[{self.shop_code}] 使用默认处理")

        return order_data

    # ============================================
    # 方法3：混合模式（配置 + 代码判断）
    # ============================================

    def process_order_hybrid(self, order_data: dict):
        """混合模式：配置驱动 + 特殊逻辑判断"""

        self.log.info(f"[{self.shop_code}] 开始处理订单: {order_data.get('order_id')}")

        # 🎯 第1步：应用配置驱动的通用规则
        order_data = self.apply_config_rules(order_data)

        # 🎯 第2步：应用店铺特定的代码逻辑
        order_data = self.apply_shop_specific_logic(order_data)

        return order_data

    def apply_config_rules(self, order_data: dict) -> dict:
        """应用配置文件中的规则"""
        order_rules = self.business_rules.get('order_submission', {})

        if order_rules.get('add_custom_note', False):
            order_data['note'] = order_rules.get('custom_note', '')

        if order_rules.get('insurance_required', False):
            order_data['insurance'] = order_rules.get('insurance_value', 50.0)

        return order_data

    def apply_shop_specific_logic(self, order_data: dict) -> dict:
        """应用店铺特定的代码逻辑"""

        # 迷尚店铺：检查是否为易碎品
        if self.shop_code == "mishang":
            if self.is_fragile_item(order_data):
                order_data['packaging_type'] = 'reinforced'
                self.log.info(f"[mishang] 检测到易碎品，使用加固包装")

        # 金亚龙：检查重量限制
        elif self.shop_code == "jinyalong_yt":
            if not self.check_weight_limit(order_data):
                self.log.error(f"[jinyalong_yt] 重量超限")
                return None

        # 张家港：同步供应商库存
        elif self.shop_code == "zhangjiaggang":
            self.sync_supplier_inventory(order_data)

        return order_data

    # ============================================
    # 辅助方法
    # ============================================

    def is_fragile_item(self, order_data: dict) -> bool:
        """判断是否为易碎品"""
        fragile_keywords = ['glass', 'ceramic', 'mirror', '玻璃', '陶瓷', '镜子']
        product_name = order_data.get('product_name', '').lower()
        return any(keyword in product_name for keyword in fragile_keywords)

    def check_weight_limit(self, order_data: dict) -> bool:
        """检查重量限制"""
        weight = order_data.get('weight', 0)
        max_weight = self.business_rules.get('order_submission', {}).get('max_weight_kg', 30.0)
        return weight <= max_weight

    def sync_supplier_inventory(self, order_data: dict):
        """同步供应商库存"""
        self.log.info(f"[{self.shop_code}] 同步供应商库存")
        # TODO: 实现供应商库存同步逻辑


# ============================================
# 使用示例
# ============================================

if __name__ == "__main__":
    # 示例1：迷尚店铺配置
    mishang_config = {
        'shop_code': 'mishang',
        'business_rules': {
            'order_submission': {
                'add_custom_note': True,
                'custom_note': '易碎品，请小心处理。Fragile, handle with care.',
                'insurance_required': True,
                'insurance_value': 50.0,
                'require_signature': True
            }
        }
    }

    # 示例2：大自然店铺配置
    nature_config = {
        'shop_code': 'nature',
        'business_rules': {
            'order_submission': {
                'add_custom_note': False,
                'insurance_required': False
            }
        }
    }

    # 创建订单数据
    order_data = {
        'order_id': 'ETSY-12345',
        'product_name': 'Glass Vase',
        'weight': 2.5
    }

    # 处理迷尚店铺订单
    print("\n=== 处理迷尚店铺订单 ===")
    mishang_processor = OrderProcessor('mishang', mishang_config)
    mishang_result = mishang_processor.process_order_config_driven(order_data.copy())
    print(f"迷尚订单结果: {mishang_result}")

    # 处理大自然店铺订单
    print("\n=== 处理大自然店铺订单 ===")
    nature_processor = OrderProcessor('nature', nature_config)
    nature_result = nature_processor.process_order_config_driven(order_data.copy())
    print(f"大自然订单结果: {nature_result}")
