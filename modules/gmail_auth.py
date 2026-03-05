"""
Gmail API 认证模块
"""
import os
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from loguru import logger

# Gmail API 权限范围
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']


class GmailAuthenticator:
    """Gmail API 认证器"""

    def __init__(self, client_id: str, client_secret: str, token_file: str = 'token.pickle'):
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_file = token_file
        self.log = logger.bind(module="gmail_auth")

    def get_credentials(self) -> Credentials:
        """获取或刷新凭据"""
        creds = None

        # 检查是否已有保存的令牌
        if os.path.exists(self.token_file):
            with open(self.token_file, 'rb') as token:
                creds = pickle.load(token)
                self.log.info("加载已保存的令牌")

        # 如果没有有效凭据，需要重新授权
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                self.log.info("刷新过期的令牌")
                creds.refresh(Request())
            else:
                self.log.info("需要重新授权")
                # 创建客户端配置
                client_config = {
                    "installed": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": ["http://localhost"]
                    }
                }

                flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
                creds = flow.run_local_server(port=0)

            # 保存凭据供下次使用
            with open(self.token_file, 'wb') as token:
                pickle.dump(creds, token)
                self.log.info("保存新令牌")

        return creds

    def get_gmail_service(self):
        """获取 Gmail API 服务对象"""
        creds = self.get_credentials()
        service = build('gmail', 'v1', credentials=creds)
        return service
