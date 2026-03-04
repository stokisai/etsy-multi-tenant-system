"""
物流工厂 - 根据配置创建物流客户端
"""
from typing import Dict, Optional
from loguru import logger
from .base import LogisticsProvider
from .yunexpress import YunExpressProvider
from .takesend import TakeSendProvider


class LogisticsFactory:
    """物流工厂"""

    def __init__(self, config: dict):
        self.config = config
        self.shop_code = config.get('shop_code', 'unknown')
        self._clients: Dict[str, LogisticsProvider] = {}
        self._init_clients()

    def _init_clients(self):
        """初始化物流客户端"""
        logistics_config = self.config.get("logistics", {})

        # 🎯 云途物流（标配，必须启用）
        yunexpress_config = logistics_config.get("yunexpress", {})
        if yunexpress_config.get("enabled", False):
            try:
                self._clients["yunexpress"] = YunExpressProvider(yunexpress_config)
                logger.info(f"[{self.shop_code}] 云途物流已启用")
            except Exception as e:
                logger.error(f"[{self.shop_code}] 云途物流初始化失败: {e}")
        else:
            logger.warning(f"[{self.shop_code}] 云途物流未启用（标配物流）")

        # 🎯 泰嘉物流（可选）
        takesend_config = logistics_config.get("takesend", {})
        if takesend_config.get("enabled", False):
            try:
                self._clients["takesend"] = TakeSendProvider(takesend_config)
                logger.info(f"[{self.shop_code}] 泰嘉物流已启用")
            except Exception as e:
                logger.error(f"[{self.shop_code}] 泰嘉物流初始化失败: {e}")
        else:
            logger.debug(f"[{self.shop_code}] 泰嘉物流未启用（可选物流）")

        # 检查是否至少有一个物流商可用
        if not self._clients:
            logger.error(f"[{self.shop_code}] 没有可用的物流商！")

    def get_client(self, provider_name: str) -> Optional[LogisticsProvider]:
        """获取物流客户端"""
        client = self._clients.get(provider_name)
        if not client:
            logger.warning(f"[{self.shop_code}] 物流商 {provider_name} 不可用")
        return client

    def get_client_for_sku(self, sku: str) -> Optional[LogisticsProvider]:
        """
        根据SKU规则选择物流客户端

        Args:
            sku: 产品SKU

        Returns:
            物流客户端，如果没有可用的返回None
        """
        sku_rules = self.config.get("sku_rules", {})
        prefix_mapping = sku_rules.get("prefix_mapping", {})

        # 🎯 第1步：检查SKU前缀映射
        for prefix, provider in prefix_mapping.items():
            if sku.upper().startswith(prefix.upper()):
                client = self.get_client(provider)
                if client:
                    logger.info(f"[{self.shop_code}] SKU {sku} 使用物流商: {provider}")
                    return client
                else:
                    logger.warning(f"[{self.shop_code}] SKU {sku} 映射到 {provider}，但该物流商未启用")

        # 🎯 第2步：使用默认物流商
        default_provider = self.config.get("logistics", {}).get("default_provider", "yunexpress")
        client = self.get_client(default_provider)

        if client:
            logger.info(f"[{self.shop_code}] SKU {sku} 使用默认物流商: {default_provider}")
            return client
        else:
            logger.error(f"[{self.shop_code}] SKU {sku} 没有可用的物流商！")
            return None

    def get_available_providers(self) -> list[str]:
        """获取所有可用的物流商"""
        return list(self._clients.keys())

    def is_provider_available(self, provider_name: str) -> bool:
        """检查物流商是否可用"""
        return provider_name in self._clients
