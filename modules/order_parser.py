"""
订单解析模块 - 从邮件中解析 Etsy 订单信息
"""
import re
from loguru import logger


class OrderParser:
    """订单解析器"""

    def __init__(self, config: dict):
        self.config = config
        self.log = logger.bind(module="order_parser")

    def parse(self, email_data: dict) -> dict:
        """解析订单邮件"""
        try:
            subject = email_data.get('subject', '')
            body = email_data.get('body', '')

            self.log.info(f"解析邮件: {subject}")

            # 提取订单号
            order_id = self._extract_order_id(subject, body)
            if not order_id:
                self.log.error("无法提取订单号")
                return None

            # 提取客户信息
            customer_info = self._extract_customer_info(body)

            # 提取收货地址
            shipping_address = self._extract_shipping_address(body)

            # 提取产品信息
            products = self._extract_products(body)

            # 提取订单金额
            total_price = self._extract_total_price(body)

            order_data = {
                'order_id': order_id,
                'customer_name': customer_info.get('name', ''),
                'customer_email': customer_info.get('email', ''),
                'shipping_address': shipping_address,
                'products': products,
                'total_price': total_price,
                'email_id': email_data.get('id'),
                'order_date': email_data.get('date')
            }

            self.log.info(f"订单解析成功: {order_id}")
            return order_data

        except Exception as e:
            self.log.error(f"订单解析失败: {e}")
            return None

    def _extract_order_id(self, subject: str, body: str) -> str:
        """提取订单号"""
        # 从主题中提取
        # 例如: "You sold 2 items! Order #1234567890"
        match = re.search(r'Order #(\d+)', subject)
        if match:
            return match.group(1)

        # 从正文中提取
        match = re.search(r'Order number[:\s]+#?(\d+)', body, re.IGNORECASE)
        if match:
            return match.group(1)

        return None

    def _extract_customer_info(self, body: str) -> dict:
        """提取客户信息"""
        customer_info = {}

        # 提取客户姓名
        name_match = re.search(r'Sold to[:\s]+([^\n]+)', body, re.IGNORECASE)
        if name_match:
            customer_info['name'] = name_match.group(1).strip()

        # 提取客户邮箱
        email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', body)
        if email_match:
            customer_info['email'] = email_match.group(1)

        return customer_info

    def _extract_shipping_address(self, body: str) -> dict:
        """提取收货地址"""
        address = {}

        # 这是一个简化版本，实际需要根据 Etsy 邮件格式调整
        # 提取地址块
        address_match = re.search(
            r'Ship to[:\s]+([^\n]+)\n([^\n]+)\n([^\n]+)\n([^\n]+)',
            body,
            re.IGNORECASE
        )

        if address_match:
            address['name'] = address_match.group(1).strip()
            address['address1'] = address_match.group(2).strip()
            address['city_state_zip'] = address_match.group(3).strip()
            address['country'] = address_match.group(4).strip()

            # 解析城市、州、邮编
            csz_match = re.match(r'([^,]+),\s*([A-Z]{2})\s+(\d{5})', address['city_state_zip'])
            if csz_match:
                address['city'] = csz_match.group(1).strip()
                address['state'] = csz_match.group(2).strip()
                address['postal_code'] = csz_match.group(3).strip()

        return address

    def _extract_products(self, body: str) -> list:
        """提取产品信息"""
        products = []

        # 简化版本：提取产品名称和数量
        # 实际需要根据 Etsy 邮件格式调整
        product_matches = re.findall(
            r'(\d+)x\s+([^\n]+)\s+\$([0-9.]+)',
            body
        )

        for match in product_matches:
            quantity = int(match[0])
            name = match[1].strip()
            price = float(match[2])

            products.append({
                'name': name,
                'quantity': quantity,
                'price': price,
                'sku': self._extract_sku(name)
            })

        return products

    def _extract_sku(self, product_name: str) -> str:
        """从产品名称中提取 SKU"""
        # 简化版本：假设 SKU 在产品名称中
        # 实际需要根据具体格式调整
        sku_match = re.search(r'\(([A-Z0-9-]+)\)', product_name)
        if sku_match:
            return sku_match.group(1)
        return product_name

    def _extract_total_price(self, body: str) -> float:
        """提取订单总金额"""
        # 提取总金额
        total_match = re.search(r'Total[:\s]+\$([0-9.]+)', body, re.IGNORECASE)
        if total_match:
            return float(total_match.group(1))
        return 0.0
