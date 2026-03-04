"""
物流工厂 - 根据配置创建物流客户端
"""
from typing import Dict, Optional
from .base import LogisticsProvider
from .yunexpress import YunExpressProvider
from .takesend import TakeSendProvider


class LogisticsFactory:
    """物流工厂"""

    def __init__(self, config: dict):
        self.config = config
        self._clients: Dict[str, LogisticsProvider] = {}
        self._init_clients()

    def _init_clients(self):
        """初始化物流客户端"""
        logistics_config = self.config.get("logistics", {})

        # 云途物流
        if logistics_config.get("yunexpress", {}).get("enabled", False):
            self._clients["yunexpress"] = YunExpressProvider(
                logistics_config["yunexpress"]
            )

        # 泰嘉物流
        if logistics_config.get("takesend", {}).get("enabled", False):
            self._clients["takesend"] = TakeSendProvider(
                logistics_config["takesend"]
            )

    def get_client(self, provider_name: str) -> Optional[LogisticsProvider]:
        """获取物流客户端"""
        return self._clients.get(provider_name)

    def get_client_for_sku(self, sku: str) -> LogisticsProvider:
        """
        根据SKU规则选择物流客户端

        Args:
            sku: 产品SKU

        Returns:
            物流客户端
        """
        sku_rules = self.config.get("sku_rules", {})
        prefix_mapping = sku_rules.get("prefix_mapping", {})

        # 检查SKU前缀
        for prefix, provider in prefix_mapping.items():
            if sku.upper().startswith(prefix.upper()):
                client = self.get_client(provider)
                if client:
                    return client

        # 返回默认物流商
        default_provider = self.config.get("logistics", {}).get("default_provider", "yunexpress")
        return self.get_client(default_provider)

    def get_available_providers(self) -> list[str]:
        """获取所有可用的物流商"""
        return list(self._clients.keys())
