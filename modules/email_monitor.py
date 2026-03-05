"""
邮件监控模块 - 监控 Etsy 订单邮件（支持 IMAP 和 Gmail API）
"""
import imaplib
import email
import base64
from email.header import decode_header
from loguru import logger
from datetime import datetime, timedelta
from modules.gmail_auth import GmailAuthenticator


class EmailMonitor:
    """邮件监控器"""

    def __init__(self, config: dict):
        self.config = config
        self.email_config = config.get('email', {})
        self.log = logger.bind(module="email_monitor")

    def fetch_new_orders(self) -> list:
        """获取新订单邮件"""
        if not self.email_config.get('enabled', False):
            self.log.info("邮件监控未启用")
            return []

        provider = self.email_config.get('provider', 'yahoo')

        # 根据提供商选择不同的方法
        if provider == 'gmail_api':
            return self._fetch_via_gmail_api()
        else:
            return self._fetch_via_imap()

    def _fetch_via_gmail_api(self) -> list:
        """通过 Gmail API 获取邮件"""
        try:
            client_id = self.email_config.get('client_id')
            client_secret = self.email_config.get('client_secret')
            email_address = self.email_config.get('address')

            if not all([client_id, client_secret, email_address]):
                self.log.error("Gmail API 配置不完整")
                return []

            self.log.info(f"使用 Gmail API 获取邮件: {email_address}")

            # 初始化认证器
            auth = GmailAuthenticator(client_id, client_secret)
            service = auth.get_gmail_service()

            # 搜索 Etsy 订单邮件（最近7天，未读）
            query = 'from:transaction@etsy.com is:unread newer_than:7d'
            results = service.users().messages().list(userId='me', q=query).execute()
            messages = results.get('messages', [])

            self.log.info(f"找到 {len(messages)} 封未读 Etsy 邮件")

            emails = []
            for msg in messages:
                try:
                    email_data = self._fetch_gmail_message(service, msg['id'])
                    if email_data:
                        emails.append(email_data)
                except Exception as e:
                    self.log.error(f"处理邮件 {msg['id']} 失败: {e}")

            return emails

        except Exception as e:
            self.log.error(f"Gmail API 获取邮件失败: {e}")
            return []

    def _fetch_gmail_message(self, service, msg_id: str) -> dict:
        """获取单封 Gmail 邮件"""
        try:
            msg = service.users().messages().get(userId='me', id=msg_id, format='full').execute()

            # 提取邮件头信息
            headers = msg['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
            from_addr = next((h['value'] for h in headers if h['name'] == 'From'), '')
            date_str = next((h['value'] for h in headers if h['name'] == 'Date'), '')

            # 提取邮件正文
            body = self._get_gmail_body(msg['payload'])

            email_data = {
                'id': msg_id,
                'subject': subject,
                'from': from_addr,
                'date': date_str,
                'body': body,
                'raw_message': msg
            }

            self.log.debug(f"获取邮件: {subject}")
            return email_data

        except Exception as e:
            self.log.error(f"解析 Gmail 邮件失败: {e}")
            return None

    def _get_gmail_body(self, payload) -> str:
        """从 Gmail payload 中提取邮件正文"""
        body = ''

        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    if 'data' in part['body']:
                        body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
                        break
                elif part['mimeType'] == 'text/html' and not body:
                    if 'data' in part['body']:
                        body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
        else:
            if 'body' in payload and 'data' in payload['body']:
                body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')

        return body

    def _fetch_via_imap(self) -> list:
        """通过 IMAP 获取邮件（原有方法）"""
        email_address = self.email_config.get('address')
        password = self.email_config.get('password')
        imap_server = self.email_config.get('imap_server')
        imap_port = self.email_config.get('imap_port', 993)

        if not all([email_address, password, imap_server]):
            self.log.error("邮件配置不完整")
            return []

        try:
            self.log.info(f"连接到邮件服务器: {imap_server}:{imap_port}")

            # 连接到 IMAP 服务器
            mail = imaplib.IMAP4_SSL(imap_server, imap_port)
            mail.login(email_address, password)
            mail.select('INBOX')

            # 搜索 Etsy 订单邮件（最近7天）
            date_since = (datetime.now() - timedelta(days=7)).strftime("%d-%b-%Y")
            search_criteria = f'(FROM "transaction@etsy.com" SINCE {date_since} UNSEEN)'

            status, messages = mail.search(None, search_criteria)

            if status != 'OK':
                self.log.error("搜索邮件失败")
                return []

            email_ids = messages[0].split()
            self.log.info(f"找到 {len(email_ids)} 封未读 Etsy 邮件")

            emails = []
            for email_id in email_ids:
                try:
                    email_data = self._fetch_email(mail, email_id)
                    if email_data:
                        emails.append(email_data)
                except Exception as e:
                    self.log.error(f"处理邮件 {email_id} 失败: {e}")

            mail.close()
            mail.logout()

            return emails

        except Exception as e:
            self.log.error(f"获取邮件失败: {e}")
            return []

    def _fetch_email(self, mail, email_id) -> dict:
        """获取单封邮件内容（IMAP）"""
        try:
            status, msg_data = mail.fetch(email_id, '(RFC822)')

            if status != 'OK':
                return None

            # 解析邮件
            msg = email.message_from_bytes(msg_data[0][1])

            # 获取主题
            subject = self._decode_header(msg.get('Subject', ''))

            # 获取发件人
            from_addr = msg.get('From', '')

            # 获取日期
            date_str = msg.get('Date', '')

            # 获取邮件正文
            body = self._get_email_body(msg)

            email_data = {
                'id': email_id.decode(),
                'subject': subject,
                'from': from_addr,
                'date': date_str,
                'body': body,
                'raw_message': msg
            }

            self.log.debug(f"获取邮件: {subject}")
            return email_data

        except Exception as e:
            self.log.error(f"解析邮件失败: {e}")
            return None

    def _decode_header(self, header_value: str) -> str:
        """解码邮件头"""
        if not header_value:
            return ''

        decoded_parts = decode_header(header_value)
        header_str = ''

        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                header_str += part.decode(encoding or 'utf-8', errors='ignore')
            else:
                header_str += part

        return header_str

    def _get_email_body(self, msg) -> str:
        """获取邮件正文（IMAP）"""
        body = ''

        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get('Content-Disposition', ''))

                # 获取文本内容
                if content_type == 'text/plain' and 'attachment' not in content_disposition:
                    try:
                        body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                        break
                    except:
                        pass
                elif content_type == 'text/html' and not body and 'attachment' not in content_disposition:
                    try:
                        body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    except:
                        pass
        else:
            try:
                body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
            except:
                body = str(msg.get_payload())

        return body
