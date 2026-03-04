"""
工具函数模块
从 caoliubian-etsy-xiadan/utils.py 迁移
"""
import hmac
import hashlib
import time
import re
from typing import Tuple, Optional


def generate_hmac_sha256(content: str, secret: str) -> str:
    """生成 HMAC-SHA256 签名"""
    return hmac.new(
        secret.encode('utf-8'),
        content.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


def get_timestamp_ms() -> str:
    """获取当前时间戳（毫秒）"""
    return str(int(time.time() * 1000))


def escape_xml(text: str) -> str:
    """转义 XML 特殊字符"""
    if not text:
        return ""
    return (text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&apos;"))


def split_name(full_name: str) -> Tuple[str, str]:
    """
    拆分姓名为名和姓

    Args:
        full_name: 完整姓名

    Returns:
        (first_name, last_name)
    """
    if not full_name:
        return "Unknown", ""

    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0], ""
    elif len(parts) == 2:
        return parts[0], parts[1]
    else:
        # 多个部分，第一个作为名，其余作为姓
        return parts[0], " ".join(parts[1:])


def get_country_code(country_name: str) -> Optional[str]:
    """
    将国家名称转换为国家代码

    Args:
        country_name: 国家名称

    Returns:
        国家代码（如 US, GB）
    """
    country_mapping = {
        "United States": "US",
        "USA": "US",
        "US": "US",
        "United Kingdom": "GB",
        "UK": "GB",
        "GB": "GB",
        "Germany": "DE",
        "DE": "DE",
        "France": "FR",
        "FR": "FR",
        "Canada": "CA",
        "CA": "CA",
        "Australia": "AU",
        "AU": "AU",
        "Italy": "IT",
        "IT": "IT",
        "Spain": "ES",
        "ES": "ES",
        "Netherlands": "NL",
        "NL": "NL",
        "Belgium": "BE",
        "BE": "BE",
        "Sweden": "SE",
        "SE": "SE",
        "Poland": "PL",
        "PL": "PL",
        "Austria": "AT",
        "AT": "AT",
        "Denmark": "DK",
        "DK": "DK",
        "Finland": "FI",
        "FI": "FI",
        "Ireland": "IE",
        "IE": "IE",
        "Portugal": "PT",
        "PT": "PT",
        "Greece": "GR",
        "GR": "GR",
        "Czech Republic": "CZ",
        "CZ": "CZ",
        "Romania": "RO",
        "RO": "RO",
        "Hungary": "HU",
        "HU": "HU",
        "Bulgaria": "BG",
        "BG": "BG",
        "Slovakia": "SK",
        "SK": "SK",
        "Croatia": "HR",
        "HR": "HR",
        "Slovenia": "SI",
        "SI": "SI",
        "Lithuania": "LT",
        "LT": "LT",
        "Latvia": "LV",
        "LV": "LV",
        "Estonia": "EE",
        "EE": "EE",
        "Cyprus": "CY",
        "CY": "CY",
        "Luxembourg": "LU",
        "LU": "LU",
        "Malta": "MT",
        "MT": "MT",
    }

    return country_mapping.get(country_name.strip())


def needs_ioss(country_code: str) -> bool:
    """
    判断是否需要 IOSS 代码（欧盟国家）

    Args:
        country_code: 国家代码

    Returns:
        是否需要 IOSS
    """
    ioss_countries = [
        "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
        "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "NL",
        "PL", "PT", "RO", "SE", "SI", "SK"
    ]
    return country_code in ioss_countries


def sanitize_yunexpress_name(name: str) -> str:
    """
    清理云途姓名字段（移除特殊字符）

    Args:
        name: 原始姓名

    Returns:
        清理后的姓名
    """
    if not name:
        return ""

    # 移除特殊字符，只保留字母、数字、空格、连字符
    cleaned = re.sub(r'[^a-zA-Z0-9\s\-]', '', name)
    return cleaned.strip()
