#!/usr/bin/env python3
"""
交互式店铺配置工具
自动生成完整的配置文件，立即可用

使用方式：
  python setup_shop.py
"""
import os
import sys
import yaml
from pathlib import Path
from typing import Dict, Optional


class ShopSetup:
    """店铺配置向导"""

    def __init__(self):
        self.project_root = Path(__file__).parent
        self.config_dir = self.project_root / "configs" / "shops"
        self.env_file = self.project_root / ".env"

        # 共享配置（从环境变量或用户输入获取）
        self.shared_config = {}

    def print_header(self, text: str):
        """打印标题"""
        print("\n" + "=" * 60)
        print(f"  {text}")
        print("=" * 60)

    def print_section(self, text: str):
        """打印章节"""
        print(f"\n📋 {text}")
        print("-" * 60)

    def get_input(self, prompt: str, default: str = "", required: bool = True) -> str:
        """获取用户输入"""
        if default:
            prompt = f"{prompt} [{default}]"
        prompt = f"  {prompt}: "

        while True:
            value = input(prompt).strip()
            if not value and default:
                return default
            if not value and required:
                print("  ❌ 此项为必填项，请输入")
                continue
            return value

    def get_yes_no(self, prompt: str, default: bool = True) -> bool:
        """获取是/否输入"""
        default_str = "Y/n" if default else "y/N"
        prompt = f"  {prompt} [{default_str}]: "

        while True:
            value = input(prompt).strip().lower()
            if not value:
                return default
            if value in ['y', 'yes', '是']:
                return True
            if value in ['n', 'no', '否']:
                return False
            print("  ❌ 请输入 y 或 n")

    def load_shared_config(self):
        """加载共享配置"""
        self.print_section("加载共享配置")

        # 尝试从环境变量加载
        env_vars = {
            'FEISHU_APP_ID': None,
            'FEISHU_APP_SECRET': None,
            'YUNEXPRESS_CUSTOMER_ID': None,
            'YUNEXPRESS_API_KEY': None,
            'YUNEXPRESS_API_SECRET': None,
            'TAKESEND_CLIENT_ID': None,
            'TAKESEND_AUTH_TOKEN': None,
            'OPENAI_API_KEY': None,
            'IOSS_CODE': 'IM3720000224',
        }

        for key, default in env_vars.items():
            value = os.getenv(key, default)
            if value:
                self.shared_config[key] = value
                print(f"  ✅ {key}: {value[:10]}...")
            else:
                print(f"  ⚠️  {key}: 未配置")

        # 检查是否需要配置共享信息
        if not self.shared_config.get('FEISHU_APP_ID'):
            print("\n  ⚠️  检测到共享配置未完成")
            if self.get_yes_no("是否现在配置共享信息？", True):
                self.configure_shared()

    def configure_shared(self):
        """配置共享信息"""
        self.print_section("配置共享信息（所有店铺共用）")

        print("\n  📊 飞书配置")
        self.shared_config['FEISHU_APP_ID'] = self.get_input(
            "飞书 App ID",
            self.shared_config.get('FEISHU_APP_ID', '')
        )
        self.shared_config['FEISHU_APP_SECRET'] = self.get_input(
            "飞书 App Secret",
            self.shared_config.get('FEISHU_APP_SECRET', '')
        )

        print("\n  🚚 云途物流配置")
        self.shared_config['YUNEXPRESS_CUSTOMER_ID'] = self.get_input(
            "云途 Customer ID",
            self.shared_config.get('YUNEXPRESS_CUSTOMER_ID', '')
        )
        self.shared_config['YUNEXPRESS_API_KEY'] = self.get_input(
            "云途 API Key",
            self.shared_config.get('YUNEXPRESS_API_KEY', '')
        )
        self.shared_config['YUNEXPRESS_API_SECRET'] = self.get_input(
            "云途 API Secret",
            self.shared_config.get('YUNEXPRESS_API_SECRET', '')
        )

        print("\n  🚚 泰嘉物流配置")
        if self.get_yes_no("是否使用泰嘉物流？", True):
            self.shared_config['TAKESEND_CLIENT_ID'] = self.get_input(
                "泰嘉 Client ID",
                self.shared_config.get('TAKESEND_CLIENT_ID', '')
            )
            self.shared_config['TAKESEND_AUTH_TOKEN'] = self.get_input(
                "泰嘉 Auth Token",
                self.shared_config.get('TAKESEND_AUTH_TOKEN', '')
            )

        print("\n  🤖 AI配置（可选）")
        if self.get_yes_no("是否使用AI订单解析？", True):
            self.shared_config['OPENAI_API_KEY'] = self.get_input(
                "OpenAI API Key",
                self.shared_config.get('OPENAI_API_KEY', ''),
                required=False
            )

        print("\n  📦 发件人信息")
        self.shared_config['SENDER_FIRST_NAME'] = self.get_input("姓（英文）", "Xiaokang")
        self.shared_config['SENDER_LAST_NAME'] = self.get_input("名（英文）", "Tian")
        self.shared_config['SENDER_COMPANY'] = self.get_input("公司名", "StrawCrafters")
        self.shared_config['SENDER_PROVINCE'] = self.get_input("省份", "Shandong")
        self.shared_config['SENDER_CITY'] = self.get_input("城市", "Zibo City")
        self.shared_config['SENDER_ADDRESS'] = self.get_input("详细地址", "Building 11, Unit 2, Room 1403")
        self.shared_config['SENDER_POSTAL_CODE'] = self.get_input("邮编", "255005")
        self.shared_config['SENDER_PHONE'] = self.get_input("电话", "15387963207")

        print("\n  ✅ 共享配置完成")

    def collect_shop_info(self) -> Dict:
        """收集店铺信息"""
        self.print_section("店铺基本信息")

        shop_info = {}

        shop_info['shop_code'] = self.get_input("店铺代码（英文，如：ocean_breeze）")
        shop_info['shop_name'] = self.get_input("店铺名称（中文，如：海洋微风店铺）")
        shop_info['etsy_shop_id'] = self.get_input("Etsy Shop ID")

        self.print_section("飞书配置")
        shop_info['feishu_table_id'] = self.get_input("飞书 Table ID（如：tblXXXXXX）")

        self.print_section("邮箱配置（用于IMAP抓取订单）")
        shop_info['email_address'] = self.get_input("邮箱地址")
        shop_info['email_password'] = self.get_input("邮箱密码（应用专用密码）")

        email_type = self.get_input("邮箱类型", "yahoo")
        shop_info['email_provider'] = email_type.lower()

        # IMAP配置
        imap_configs = {
            'yahoo': ('imap.mail.yahoo.com', 993),
            'gmail': ('imap.gmail.com', 993),
            'outlook': ('outlook.office365.com', 993),
        }
        shop_info['imap_server'], shop_info['imap_port'] = imap_configs.get(
            shop_info['email_provider'],
            ('imap.mail.yahoo.com', 993)
        )

        return shop_info

    def generate_config_file(self, shop_info: Dict) -> str:
        """生成配置文件"""
        shop_code = shop_info['shop_code']

        config = {
            'shop_code': shop_code,
            'shop_name': shop_info['shop_name'],
            'enabled': True,

            'etsy': {
                'shop_id': shop_info['etsy_shop_id'],
                'api_key': f"${{ETSY_API_KEY_{shop_code.upper()}}}",
                'api_secret': f"${{ETSY_API_SECRET_{shop_code.upper()}}}",
            },

            'feishu': {
                'app_id': '${FEISHU_APP_ID}',
                'app_secret': '${FEISHU_APP_SECRET}',
                'table_id': shop_info['feishu_table_id'],
                'field_mapping': {
                    'order_id': '订单号',
                    'buyer_name': '买家姓名',
                    'buyer_email': '买家邮箱',
                    'buyer_address': '收货地址',
                    'buyer_city': '城市',
                    'buyer_state': '州/省',
                    'buyer_zip': '邮编',
                    'buyer_country': '国家',
                    'product_sku': 'SKU',
                    'product_name': '产品名称',
                    'quantity': '数量',
                    'tracking_number': '跟踪号',
                    'waybill_number': '运单号',
                    'logistics_provider': '物流商',
                    'status': '状态',
                    'order_date': '下单时间',
                    'ship_date': '发货时间',
                    'notes': '备注',
                }
            },

            'email': {
                'provider': shop_info['email_provider'],
                'address': shop_info['email_address'],
                'password': f"${{EMAIL_PASSWORD_{shop_code.upper()}}}",
                'imap_server': shop_info['imap_server'],
                'imap_port': shop_info['imap_port'],
                'check_interval': 300,
                'mark_as_read': True,
            },

            'logistics': {
                'default_provider': 'yunexpress',
                'yunexpress': {
                    'enabled': True,
                    'customer_id': '${YUNEXPRESS_CUSTOMER_ID}',
                    'api_key': '${YUNEXPRESS_API_KEY}',
                    'api_secret': '${YUNEXPRESS_API_SECRET}',
                    'base_url': 'https://api.yunexpress.com',
                    'service_code': 'CNPOST-FYB',
                    'label_mvp_url': '',
                },
                'takesend': {
                    'enabled': bool(self.shared_config.get('TAKESEND_CLIENT_ID')),
                    'client_id': '${TAKESEND_CLIENT_ID}',
                    'auth_token': '${TAKESEND_AUTH_TOKEN}',
                    'base_url': 'http://k5.takesend.com:8180/WebCOrder',
                    'label_mvp_url': '',
                    'channels': {
                        'US': 'TKGZ-US',
                        'CA': 'TKGZ-CA',
                        'GB': 'TKGZ-GB',
                        'AU': 'TKGZ-AU',
                    }
                }
            },

            'sku_rules': {
                'prefix_mapping': {
                    'US-': 'takesend',
                    'EU-': 'yunexpress',
                    'CN-': 'yunexpress',
                },
                'country_mapping': {
                    'US': 'takesend',
                    'CA': 'takesend',
                    'GB': 'yunexpress',
                    'DE': 'yunexpress',
                    'FR': 'yunexpress',
                }
            },

            'sender': {
                'first_name': self.shared_config.get('SENDER_FIRST_NAME', 'Xiaokang'),
                'last_name': self.shared_config.get('SENDER_LAST_NAME', 'Tian'),
                'company': self.shared_config.get('SENDER_COMPANY', 'StrawCrafters'),
                'country_code': 'CN',
                'province': self.shared_config.get('SENDER_PROVINCE', 'Shandong'),
                'city': self.shared_config.get('SENDER_CITY', 'Zibo City'),
                'address': self.shared_config.get('SENDER_ADDRESS', 'Building 11, Unit 2, Room 1403'),
                'postal_code': self.shared_config.get('SENDER_POSTAL_CODE', '255005'),
                'phone': self.shared_config.get('SENDER_PHONE', '15387963207'),
                'email': '',
            },

            'features': {
                'auto_review': True,
                'auto_tracking': True,
                'email_monitoring': True,
                'order_processing': True,
                'fulfillment': True,
                'label_generation': True,
            },

            'ioss': {
                'enabled': True,
                'code': self.shared_config.get('IOSS_CODE', 'IM3720000224'),
            },

            'ai': {
                'provider': 'openai',
                'model': 'gpt-4',
                'api_key': '${OPENAI_API_KEY}',
                'temperature': 0.1,
                'max_tokens': 2000,
            },

            'browser': {
                'headless': True,
                'timeout': 30000,
                'user_data_dir': '',
            },

            'logging': {
                'level': 'INFO',
                'file': f'logs/{shop_code}.log',
                'rotation': '1 day',
                'retention': '30 days',
            },
        }

        # 保存配置文件
        config_file = self.config_dir / f"{shop_code}.yaml"
        with open(config_file, 'w', encoding='utf-8') as f:
            yaml.dump(config, f, allow_unicode=True, default_flow_style=False, sort_keys=False)

        return str(config_file)

    def update_env_file(self, shop_info: Dict):
        """更新环境变量文件"""
        shop_code = shop_info['shop_code'].upper()

        # 读取现有的.env文件
        env_lines = []
        if self.env_file.exists():
            with open(self.env_file, 'r', encoding='utf-8') as f:
                env_lines = f.readlines()

        # 准备要添加的环境变量
        new_vars = {
            f'EMAIL_PASSWORD_{shop_code}': shop_info['email_password'],
        }

        # 如果是第一次配置，添加共享配置
        if not any('FEISHU_APP_ID' in line for line in env_lines):
            new_vars.update({
                'FEISHU_APP_ID': self.shared_config.get('FEISHU_APP_ID', ''),
                'FEISHU_APP_SECRET': self.shared_config.get('FEISHU_APP_SECRET', ''),
                'YUNEXPRESS_CUSTOMER_ID': self.shared_config.get('YUNEXPRESS_CUSTOMER_ID', ''),
                'YUNEXPRESS_API_KEY': self.shared_config.get('YUNEXPRESS_API_KEY', ''),
                'YUNEXPRESS_API_SECRET': self.shared_config.get('YUNEXPRESS_API_SECRET', ''),
            })

            if self.shared_config.get('TAKESEND_CLIENT_ID'):
                new_vars.update({
                    'TAKESEND_CLIENT_ID': self.shared_config.get('TAKESEND_CLIENT_ID', ''),
                    'TAKESEND_AUTH_TOKEN': self.shared_config.get('TAKESEND_AUTH_TOKEN', ''),
                })

            if self.shared_config.get('OPENAI_API_KEY'):
                new_vars['OPENAI_API_KEY'] = self.shared_config.get('OPENAI_API_KEY', '')

        # 添加新的环境变量
        with open(self.env_file, 'a', encoding='utf-8') as f:
            f.write(f'\n# {shop_info["shop_name"]} 店铺配置\n')
            for key, value in new_vars.items():
                if value:
                    f.write(f'{key}={value}\n')

    def run(self):
        """运行配置向导"""
        self.print_header("🚀 Etsy店铺配置向导")

        print("\n欢迎使用Etsy多租户系统配置向导！")
        print("我会引导你完成店铺配置，只需回答几个问题即可。\n")

        # 加载共享配置
        self.load_shared_config()

        # 收集店铺信息
        shop_info = self.collect_shop_info()

        # 生成配置文件
        self.print_section("生成配置文件")
        config_file = self.generate_config_file(shop_info)
        print(f"  ✅ 配置文件已生成：{config_file}")

        # 更新环境变量
        self.print_section("更新环境变量")
        self.update_env_file(shop_info)
        print(f"  ✅ 环境变量已更新：{self.env_file}")

        # 完成
        self.print_header("🎉 配置完成！")

        shop_code = shop_info['shop_code']

        print(f"\n店铺 '{shop_info['shop_name']}' 配置完成！")
        print("\n下一步：")
        print(f"  1. 验证配置：python validate_config.py --shop {shop_code}")
        print(f"  2. 测试运行：python main.py --shop {shop_code} --task process_orders --dry-run")
        print(f"  3. 正式运行：python main.py --shop {shop_code} --task process_orders")
        print("\n🚀 开始使用吧！")


def main():
    try:
        setup = ShopSetup()
        setup.run()
    except KeyboardInterrupt:
        print("\n\n❌ 配置已取消")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 错误：{e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
