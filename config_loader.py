"""
配置加载器 - 支持多店铺配置管理
"""
import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from string import Template


class ConfigLoader:
    """配置加载器"""

    def __init__(self, config_dir: str = "configs"):
        self.config_dir = Path(config_dir)
        self.shops_dir = self.config_dir / "shops"
        self.global_config = self._load_global_config()
        self._shop_configs = {}

    def _load_global_config(self) -> Dict[str, Any]:
        """加载全局配置"""
        global_file = self.config_dir / "global.yaml"
        if global_file.exists():
            with open(global_file, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f) or {}
        return {}

    def _resolve_env_vars(self, config: Any) -> Any:
        """递归解析配置中的环境变量"""
        if isinstance(config, dict):
            return {k: self._resolve_env_vars(v) for k, v in config.items()}
        elif isinstance(config, list):
            return [self._resolve_env_vars(item) for item in config]
        elif isinstance(config, str):
            # 支持 ${VAR_NAME} 和 $VAR_NAME 格式
            if '$' in config:
                template = Template(config)
                try:
                    return template.substitute(os.environ)
                except KeyError:
                    # 如果环境变量不存在，保持原样
                    return config
        return config

    def load_shop_config(self, shop_code: str) -> Dict[str, Any]:
        """
        加载店铺配置

        Args:
            shop_code: 店铺代码

        Returns:
            店铺配置字典
        """
        if shop_code in self._shop_configs:
            return self._shop_configs[shop_code]

        shop_file = self.shops_dir / f"{shop_code}.yaml"
        if not shop_file.exists():
            raise FileNotFoundError(f"店铺配置文件不存在: {shop_file}")

        with open(shop_file, 'r', encoding='utf-8') as f:
            shop_config = yaml.safe_load(f)

        # 合并全局配置
        config = self._merge_configs(self.global_config, shop_config)

        # 解析环境变量
        config = self._resolve_env_vars(config)

        # 缓存配置
        self._shop_configs[shop_code] = config

        return config

    def _merge_configs(self, base: Dict, override: Dict) -> Dict:
        """深度合并配置"""
        result = base.copy()
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_configs(result[key], value)
            else:
                result[key] = value
        return result

    def list_shops(self) -> list[str]:
        """列出所有可用的店铺"""
        if not self.shops_dir.exists():
            return []

        shops = []
        for file in self.shops_dir.glob("*.yaml"):
            if file.stem != "template":
                shops.append(file.stem)
        return sorted(shops)

    def get_enabled_shops(self) -> list[str]:
        """获取所有启用的店铺"""
        enabled = []
        for shop_code in self.list_shops():
            config = self.load_shop_config(shop_code)
            if config.get("enabled", True):
                enabled.append(shop_code)
        return enabled

    def reload_shop_config(self, shop_code: str) -> Dict[str, Any]:
        """重新加载店铺配置（清除缓存）"""
        if shop_code in self._shop_configs:
            del self._shop_configs[shop_code]
        return self.load_shop_config(shop_code)


# 全局配置加载器实例
_config_loader: Optional[ConfigLoader] = None


def get_config_loader() -> ConfigLoader:
    """获取全局配置加载器实例"""
    global _config_loader
    if _config_loader is None:
        _config_loader = ConfigLoader()
    return _config_loader
