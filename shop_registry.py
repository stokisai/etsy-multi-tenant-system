"""
店铺注册表 - 管理多个店铺实例
"""
from typing import Dict, Optional
from dataclasses import dataclass
from config_loader import get_config_loader


@dataclass
class ShopInfo:
    """店铺信息"""
    shop_code: str
    shop_name: str
    enabled: bool
    config: Dict


class ShopRegistry:
    """店铺注册表"""

    def __init__(self):
        self.config_loader = get_config_loader()
        self._shops: Dict[str, ShopInfo] = {}
        self._load_shops()

    def _load_shops(self):
        """加载所有店铺"""
        for shop_code in self.config_loader.list_shops():
            try:
                config = self.config_loader.load_shop_config(shop_code)
                shop_info = ShopInfo(
                    shop_code=shop_code,
                    shop_name=config.get("shop_name", shop_code),
                    enabled=config.get("enabled", True),
                    config=config
                )
                self._shops[shop_code] = shop_info
            except Exception as e:
                print(f"加载店铺 {shop_code} 失败: {e}")

    def get_shop(self, shop_code: str) -> Optional[ShopInfo]:
        """获取店铺信息"""
        return self._shops.get(shop_code)

    def get_all_shops(self) -> list[ShopInfo]:
        """获取所有店铺"""
        return list(self._shops.values())

    def get_enabled_shops(self) -> list[ShopInfo]:
        """获取所有启用的店铺"""
        return [shop for shop in self._shops.values() if shop.enabled]

    def reload_shop(self, shop_code: str):
        """重新加载店铺配置"""
        config = self.config_loader.reload_shop_config(shop_code)
        shop_info = ShopInfo(
            shop_code=shop_code,
            shop_name=config.get("shop_name", shop_code),
            enabled=config.get("enabled", True),
            config=config
        )
        self._shops[shop_code] = shop_info

    def reload_all(self):
        """重新加载所有店铺"""
        self._shops.clear()
        self._load_shops()


# 全局店铺注册表实例
_shop_registry: Optional[ShopRegistry] = None


def get_shop_registry() -> ShopRegistry:
    """获取全局店铺注册表实例"""
    global _shop_registry
    if _shop_registry is None:
        _shop_registry = ShopRegistry()
    return _shop_registry
