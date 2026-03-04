"""
物流基类 - 定义统一接口
"""
from abc import ABC, abstractmethod
from typing import Dict, Optional


class LogisticsProvider(ABC):
    """物流提供商基类"""

    def __init__(self, config: dict):
        self.config = config

    @abstractmethod
    def create_order(self, order_data: dict, product: dict) -> Dict:
        """
        创建物流订单

        Args:
            order_data: 订单数据
            product: 产品数据

        Returns:
            {
                "success": bool,
                "waybill": str,  # 运单号
                "tracking": str,  # 末端跟踪号（可选）
                "label_url": str,  # 面单URL（可选）
                "error": str  # 错误信息（失败时）
            }
        """
        pass

    @abstractmethod
    def get_last_mile_tracking(self, waybill: str) -> Optional[str]:
        """
        获取末端跟踪号

        Args:
            waybill: 运单号

        Returns:
            末端跟踪号，如果未查询到返回None
        """
        pass

    @abstractmethod
    def is_country_supported(self, country_code: str) -> bool:
        """
        检查是否支持该国家

        Args:
            country_code: 国家代码（如: US, GB）

        Returns:
            是否支持
        """
        pass

    def get_channel_for_country(self, country_code: str) -> str:
        """
        获取国家对应的物流渠道

        Args:
            country_code: 国家代码

        Returns:
            物流渠道代码
        """
        channels = self.config.get("channels", {})
        return channels.get(country_code, channels.get("OTHER", ""))
