"""
云途物流提供商实现
从 caoliubian-etsy-xiadan/logistics/yunexpress.py 迁移
"""
import json
import requests
from typing import Dict, Optional
from loguru import logger

from .base import LogisticsProvider
from ..utils import (
    generate_hmac_sha256,
    get_timestamp_ms,
    get_country_code,
    split_name,
    needs_ioss,
    sanitize_yunexpress_name,
)


class YunExpressProvider(LogisticsProvider):
    """云途物流提供商"""

    def __init__(self, config: dict):
        super().__init__(config)
        self.base_url = config.get("base_url", "https://openapi.yunexpress.cn")
        self.app_id = config["app_id"]
        self.app_secret = config["app_secret"]
        self.source_key = config["source_key"]
        self.access_token: Optional[str] = None
        self.channels = config.get("channels", {})

    def get_token(self) -> Optional[str]:
        """获取 OAuth2 访问令牌"""
        url = f"{self.base_url}/openapi/oauth2/token"

        payload = {
            "grantType": "client_credentials",
            "appId": self.app_id,
            "appSecret": self.app_secret,
            "sourceKey": self.source_key
        }

        try:
            response = requests.post(url, data=payload, timeout=30)

            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("accessToken")
                logger.info("成功获取云途 Token")
                return self.access_token
            else:
                logger.error(f"获取云途 Token 失败: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logger.error(f"获取云途 Token 异常: {e}")
            return None

    def _generate_sign(self, method: str, uri: str, date: str, body: str = "") -> str:
        """生成 API 签名"""
        params = {"date": date, "method": method, "uri": uri}

        if body:
            params["body"] = body

        # 按 key 排序拼接
        content = "&".join(f"{k}={params[k]}" for k in sorted(params.keys()))

        return generate_hmac_sha256(content, self.app_secret)

    def create_order(self, order_data: dict, product: dict) -> Dict:
        """创建物流订单"""
        if not self.access_token:
            if not self.get_token():
                return {"success": False, "error": "无法获取Token"}

        # 获取买家信息
        buyer = order_data.get("buyer", {})
        country_code = get_country_code(buyer.get("country", ""))

        if not country_code:
            return {"success": False, "error": f"无法识别国家: {buyer.get('country')}"}

        # 选择物流渠道
        if country_code == "US":
            product_code = self.channels.get("US", "USTHPHR")
        else:
            product_code = self.channels.get("OTHER", "THPHR")

        # 拆分姓名
        first_name, last_name = split_name(buyer.get("name", ""))
        first_name = sanitize_yunexpress_name(first_name)
        last_name = sanitize_yunexpress_name(last_name)

        # 获取产品信息
        declared_qty = product.get("declared_quantity", 1)

        # 构建请求体
        body = {
            "product_code": product_code,
            "customer_order_number": "",
            "order_numbers": {
                "waybill_number": "",
                "platform_order_number": order_data.get("order_id", ""),
                "tracking_number": "",
                "reference_numbers": []
            },
            "weight_unit": "KG",
            "size_unit": "CM",
            "dangerous_goods_type": "810",
            "packages": [
                {
                    "length": 1,
                    "width": 1,
                    "height": 1,
                    "weight": float(product.get("NETWEIGHT", 0.1))
                }
            ],
            "receiver": {
                "first_name": first_name,
                "last_name": last_name,
                "company": "",
                "country_code": country_code,
                "province": buyer.get("state", ""),
                "city": buyer.get("city", ""),
                "address_lines": [buyer.get("street", "")],
                "postal_code": buyer.get("zip", ""),
                "phone_number": "2369650373",
                "email": buyer.get("email", ""),
                "certificate_type": "",
                "certificate_code": ""
            },
            "declaration_info": [
                {
                    "sku_code": "",
                    "name_local": product.get("name_ZH", "手工草柳编工艺品"),
                    "name_en": product.get("name_EN", "Handmade straw craft"),
                    "quantity": declared_qty,
                    "unit_price": float(product.get("FOB", 2)),
                    "unit_weight": float(product.get("NETWEIGHT", 0.1)),
                    "hs_code": product.get("hs_code", "4602191000"),
                    "sales_url": "",
                    "currency": "USD",
                    "material": "",
                    "purpose": "",
                    "brand": "",
                    "spec": "",
                    "model": "",
                    "remark": ""
                }
            ],
            "sender": self._get_sender_info(),
            "customs_number": {
                "tax_number": "",
                "ioss_code": self._get_ioss_code(country_code),
                "vat_code": "",
                "eori_number": ""
            },
            "extra_services": [
                {
                    "extra_code": "V1",
                    "extra_value": "云途预缴"
                }
            ],
            "platform_account_code": "",
            "source_code": "YT",
            "sensitive_type": "D",
            "label_type": "PDF",
            "point_relais_num": ""
        }

        # 发送请求
        uri = "/v1/order/package/create"
        method = "POST"
        date = get_timestamp_ms()
        body_json = json.dumps(body)
        sign = self._generate_sign(method, uri, date, body_json)

        headers = {
            "token": self.access_token,
            "date": date,
            "sign": sign,
            "Content-Type": "application/json",
            "Accept-Language": "zh-CN"
        }

        try:
            url = f"{self.base_url}{uri}"
            response = requests.post(url, headers=headers, data=body_json, timeout=60)

            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    waybill = result.get("result", {}).get("waybill_number")
                    logger.info(f"云途订单创建成功: {waybill}")
                    return {
                        "success": True,
                        "waybill": waybill,
                        "tracking": "",
                        "label_url": ""
                    }
                else:
                    error_msg = result.get("message", "")
                    logger.error(f"云途订单创建失败: {error_msg}")
                    return {"success": False, "error": error_msg}
            elif response.status_code == 401:
                # Token过期，刷新并重试
                logger.warning("云途Token过期，正在刷新...")
                self.access_token = None
                if self.get_token():
                    return self.create_order(order_data, product)
                else:
                    return {"success": False, "error": "Token刷新失败"}
            else:
                error_msg = f"HTTP {response.status_code}"
                logger.error(f"云途 API 请求失败: {error_msg}")
                return {"success": False, "error": error_msg}

        except Exception as e:
            logger.error(f"云途订单创建异常: {e}")
            return {"success": False, "error": str(e)}

    def get_last_mile_tracking(self, waybill: str) -> Optional[str]:
        """获取末端跟踪号"""
        if not self.access_token:
            if not self.get_token():
                return None

        uri = "/v1/order/last-mile/get"
        method = "POST"
        date = get_timestamp_ms()

        body = {"waybill_numbers": [waybill]}
        body_json = json.dumps(body)
        sign = self._generate_sign(method, uri, date, body_json)

        headers = {
            "token": self.access_token,
            "date": date,
            "sign": sign,
            "Content-Type": "application/json",
            "Accept-Language": "zh-CN"
        }

        try:
            url = f"{self.base_url}{uri}"
            response = requests.post(url, headers=headers, data=body_json, timeout=30)

            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    carriers = result.get("result", {}).get("carriers", [])
                    if carriers:
                        tracking = carriers[0].get("tracking_number", "")
                        if tracking:
                            logger.info(f"获取末端号码成功: {waybill} -> {tracking}")
                            return tracking
                    logger.warning(f"末端号码暂无数据: {waybill}")
                    return None
                else:
                    logger.error(f"查询末端号码失败: {result.get('msg')}")
                    return None
            else:
                logger.error(f"末端号码请求失败: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"查询末端号码异常: {e}")
            return None

    def is_country_supported(self, country_code: str) -> bool:
        """检查是否支持该国家（云途支持全球）"""
        return True

    def _get_sender_info(self) -> dict:
        """获取发件人信息（从全局配置）"""
        # TODO: 从配置中读取
        return {
            "first_name": "Xiaokang",
            "last_name": "Tian",
            "company": "StrawCrafters",
            "country_code": "CN",
            "province": "Shandong",
            "city": "Zibo City",
            "address_lines": ["Building 11, Unit 2, Room 1403"],
            "postal_code": "255005",
            "phone_number": "15387963207",
            "email": "",
            "certificate_type": "",
            "certificate_code": ""
        }

    def _get_ioss_code(self, country_code: str) -> str:
        """获取IOSS代码（欧盟国家需要）"""
        # TODO: 从配置中读取
        ioss_countries = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
                          "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "NL",
                          "PL", "PT", "RO", "SE", "SI", "SK"]
        if country_code in ioss_countries:
            return "IM3720000224"
        return ""
