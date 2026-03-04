"""
泰嘉物流提供商实现
从 caoliubian-etsy-xiadan/logistics/takesend.py 迁移
"""
import requests
import re
import time
from typing import Dict, Optional
from loguru import logger

from .base import LogisticsProvider
from ..utils import escape_xml, split_name, get_country_code, needs_ioss


class TakeSendProvider(LogisticsProvider):
    """泰嘉物流提供商"""

    def __init__(self, config: dict):
        super().__init__(config)
        self.base_url = config.get("base_url", "http://k5.takesend.com:8180/WebCOrder")
        self.client_id = config["client_id"]
        self.auth_token = config["auth_token"]
        self.label_mvp_url = config.get("label_mvp_url", "")
        self.channels = config.get("channels", {})
        self.supported_countries = list(self.channels.keys())

    def is_country_supported(self, country_code: str) -> bool:
        """检查是否支持该国家"""
        return country_code in self.supported_countries

    def get_channel_for_country(self, country_code: str) -> Optional[str]:
        """根据国家获取对应的渠道代码"""
        return self.channels.get(country_code)

    def _build_order_xml(self, order_data: dict, product: dict, channel: str = None) -> tuple:
        """构建订单 XML"""
        buyer = order_data.get("buyer", {})

        # 生成客户订单号
        timestamp = str(int(time.time() * 1000))[-6:]
        buyer_name = buyer.get('name', 'Unknown')
        refernumb = f"{buyer_name}_{timestamp}"

        # 处理地址
        full_address = buyer.get("street", "")
        address_lines = full_address.split('\n') if full_address else [""]
        recaddr1 = address_lines[0].strip() if address_lines else ""
        recaddr2 = ", ".join(address_lines[1:]).strip() if len(address_lines) > 1 else ""

        # 获取申报信息
        name_zh = product.get("name_ZH", "手工草编工艺品")
        name_en = product.get("name_EN", "Straw Handicraft")
        declared_qty = product.get("declared_quantity", 1)
        unit_price = float(product.get("FOB", 10))
        total_value = declared_qty * unit_price
        weight = product.get("NETWEIGHT", 0.5)

        # 获取国家代码
        country = buyer.get("country", "US")
        country_code = get_country_code(country)

        # 判断是否需要IOSS
        ioss_code = self._get_ioss_code(country_code)

        # 获取发件人信息
        sender = self._get_sender_info()

        xml = f"""<?xml version="1.0" encoding="utf-8"?>
<CreateAndPreAlertOrderService>
  <authtoken>{self.auth_token}</authtoken>
  <clientid>{self.client_id}</clientid>
  <CreateAndPreAlertOrderRequestArray>
    <CreateAndPreAlertOrderRequest>
      <refernumb>{escape_xml(refernumb)}</refernumb>
      <channelid>{channel or self.get_channel_for_country(country_code)}</channelid>

      <recname>{escape_xml(buyer.get('name', ''))}</recname>
      <recaddr1>{escape_xml(recaddr1)}</recaddr1>
      <recaddr2>{escape_xml(recaddr2)}</recaddr2>
      <reccity>{escape_xml(buyer.get('city', ''))}</reccity>
      <recprovince>{escape_xml(buyer.get('state', ''))}</recprovince>
      <recpost>{escape_xml(buyer.get('zip', ''))}</recpost>
      <country>{country_code}</country>
      <rectel>2369650373</rectel>
      <recemail></recemail>
      <ioss>{ioss_code}</ioss>

      <sendername>{sender['first_name']} {sender['last_name']}</sendername>
      <sendercorp>{sender['company']}</sendercorp>
      <senderaddr>{sender['address']}</senderaddr>
      <sendercity>{sender['city']}</sendercity>
      <senderprovince>{sender['province']}</senderprovince>
      <senderpost>{sender['postal_code']}</senderpost>
      <sendercountry>CN</sendercountry>
      <sendertel>{sender['phone']}</sendertel>
      <senderemail></senderemail>

      <weight>{weight}</weight>
      <goodsnum>1</goodsnum>

      <DeclareInvoiceArray>
        <DeclareInvoice>
          <itemcont>{escape_xml(name_zh)}</itemcont>
          <itemcustoms>{escape_xml(name_en)}</itemcustoms>
          <itemnum>{declared_qty}</itemnum>
          <itemsbprice>{unit_price:.2f}</itemsbprice>
          <itemvalue>{total_value:.2f}</itemvalue>
          <itemunit>USD</itemunit>
          <itemsku>{escape_xml(product.get('SKU', ''))}</itemsku>
          <itemweight>{weight}</itemweight>
          <itemprodno>{escape_xml(product.get('hs_code', '4602191000'))}</itemprodno>
        </DeclareInvoice>
      </DeclareInvoiceArray>
    </CreateAndPreAlertOrderRequest>
  </CreateAndPreAlertOrderRequestArray>
</CreateAndPreAlertOrderService>"""

        return xml, refernumb

    def _parse_response(self, response_text: str) -> Dict:
        """解析泰嘉 API XML 响应"""
        def extract_tag(text: str, tag: str) -> str:
            match = re.search(f'<{tag}>(.*?)</{tag}>', text, re.IGNORECASE)
            return match.group(1) if match else ""

        ack = extract_tag(response_text, "Ack")
        success = "成功" in ack or ack.lower() == "true"

        return {
            "success": success,
            "billid": extract_tag(response_text, "billid"),
            "corpbillid": extract_tag(response_text, "corpbillid"),
            "error": extract_tag(response_text, "Error") if not success else "",
            "message": extract_tag(response_text, "DefineMessage"),
            "raw": response_text
        }

    def create_order(self, order_data: dict, product: dict) -> Dict:
        """创建物流订单"""
        xml, refernumb = self._build_order_xml(order_data, product)

        try:
            url = f"{self.base_url}?action=addYBCorder"

            response = requests.post(
                url,
                data={"xml": xml},
                timeout=30
            )

            if response.status_code == 200:
                result = self._parse_response(response.text)
                result["refernumb"] = refernumb

                if result["success"]:
                    logger.info(f"泰嘉订单创建成功: {result['billid']}")

                    # 获取面单
                    label_result = self.get_label(result['corpbillid'])

                    return {
                        "success": True,
                        "waybill": result['billid'],
                        "tracking": label_result.get('billid', '') if label_result else '',
                        "label_url": label_result.get('labelUrl', '') if label_result else '',
                        "corpbillid": result['corpbillid']
                    }
                else:
                    logger.error(f"泰嘉订单创建失败: {result['error'] or result['message']}")
                    return {"success": False, "error": result['error'] or result['message']}
            else:
                logger.error(f"泰嘉 API 请求失败: {response.status_code}")
                return {"success": False, "error": f"HTTP {response.status_code}"}

        except Exception as e:
            logger.error(f"泰嘉订单创建异常: {e}")
            return {"success": False, "error": str(e)}

    def get_label(self, corpbillid: str, max_retries: int = 4, retry_delay: int = 20) -> Optional[Dict]:
        """获取面单（通过 LabelMVP 服务）"""
        if not self.label_mvp_url:
            logger.warning("Label MVP URL 未配置")
            return None

        for attempt in range(max_retries + 1):
            if attempt > 0:
                wait = retry_delay * attempt
                logger.info(f"等待 {wait} 秒后重试获取面单（第 {attempt + 1}/{max_retries + 1} 次）...")
                time.sleep(wait)

            try:
                response = requests.post(
                    self.label_mvp_url,
                    json={"corpbillid": corpbillid},
                    timeout=60
                )

                if response.status_code == 200:
                    result = response.json()

                    if result.get("success"):
                        billid = result.get("billid", "")

                        if billid and not billid.startswith("TS"):
                            logger.info(f"获取泰嘉面单成功: corpbillid={corpbillid}, 追踪号={billid}")
                            return {
                                "success": True,
                                "billid": billid,
                                "corpbillid": result.get("corpbillid"),
                                "labelUrl": result.get("labelUrl"),
                                "takesendUrl": result.get("takesendUrl")
                            }
                        else:
                            logger.warning(f"获取到无效的追踪号: {billid}")
                    else:
                        logger.warning(f"获取泰嘉面单失败: {result.get('error')}")

            except Exception as e:
                logger.warning(f"获取泰嘉面单异常: {e}")

        logger.error(f"获取泰嘉面单最终失败: corpbillid={corpbillid}")
        return None

    def get_last_mile_tracking(self, waybill: str) -> Optional[str]:
        """获取末端跟踪号（泰嘉的billid就是末端跟踪号）"""
        return waybill

    def _get_sender_info(self) -> dict:
        """获取发件人信息"""
        # TODO: 从配置中读取
        return {
            "first_name": "Xiaokang",
            "last_name": "Tian",
            "company": "StrawCrafters",
            "country_code": "CN",
            "province": "Shandong",
            "city": "Zibo City",
            "address": "Building 11, Unit 2, Room 1403",
            "postal_code": "255005",
            "phone": "15387963207",
            "email": ""
        }

    def _get_ioss_code(self, country_code: str) -> str:
        """获取IOSS代码"""
        if needs_ioss(country_code):
            return "IM3720000224"  # TODO: 从配置中读取
        return ""
