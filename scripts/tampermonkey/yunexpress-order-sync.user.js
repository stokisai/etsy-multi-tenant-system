// ==UserScript==
// @name         云途后台订单同步 - Etsy多租户系统
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  自动从云途后台拉取运单号、跟踪号、收货状态，并同步到飞书多维表格
// @author       Your Name
// @match        https://www.yunexpress.com/*
// @match        https://console.yunexpress.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @connect      open.feishu.cn
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置区域 ====================

    // 飞书配置（从 Tampermonkey 存储中读取，避免硬编码）
    const FEISHU_APP_ID = GM_getValue('FEISHU_APP_ID', '');
    const FEISHU_APP_SECRET = GM_getValue('FEISHU_APP_SECRET', '');

    // 店铺配置映射
    const SHOP_CONFIGS = {
        'nature': {
            name: '大自然草柳编',
            feishu_app_token: GM_getValue('NATURE_FEISHU_APP_TOKEN', ''),
            feishu_table_id: GM_getValue('NATURE_FEISHU_TABLE_ID', '')
        },
        'mishang': {
            name: '迷尚',
            feishu_app_token: GM_getValue('MISHANG_FEISHU_APP_TOKEN', ''),
            feishu_table_id: GM_getValue('MISHANG_FEISHU_TABLE_ID', '')
        },
        'jinyalong': {
            name: '金亚龙',
            feishu_app_token: GM_getValue('JINYALONG_FEISHU_APP_TOKEN', ''),
            feishu_table_id: GM_getValue('JINYALONG_FEISHU_TABLE_ID', '')
        }
    };

    // ==================== 工具函数 ====================

    /**
     * 检测当前店铺代码
     */
    function detectShopCode() {
        // 方法1：从页面中提取店铺名称
        const shopNameElement = document.querySelector('.shop-name, .account-name, .user-info');
        if (shopNameElement) {
            const shopName = shopNameElement.textContent.trim();
            console.log('[YunExpress] 检测到店铺名称:', shopName);

            if (shopName.includes('大自然') || shopName.includes('nature')) return 'nature';
            if (shopName.includes('迷尚') || shopName.includes('mishang')) return 'mishang';
            if (shopName.includes('金亚龙') || shopName.includes('jinyalong')) return 'jinyalong';
        }

        // 方法2：从 URL 参数中获取
        const urlParams = new URLSearchParams(window.location.search);
        const shopCode = urlParams.get('shop_code');
        if (shopCode && SHOP_CONFIGS[shopCode]) {
            return shopCode;
        }

        // 方法3：从本地存储中获取上次选择
        const lastShopCode = GM_getValue('LAST_SHOP_CODE', 'nature');
        return lastShopCode;
    }

    /**
     * 获取飞书 Access Token
     */
    async function getFeishuAccessToken() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    app_id: FEISHU_APP_ID,
                    app_secret: FEISHU_APP_SECRET
                }),
                onload: function(response) {
                    const data = JSON.parse(response.responseText);
                    if (data.code === 0) {
                        resolve(data.tenant_access_token);
                    } else {
                        reject(new Error('获取飞书 Token 失败: ' + data.msg));
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * 从云途后台提取订单数据
     */
    function extractOrderData() {
        const orders = [];

        // 根据云途后台的实际 HTML 结构提取数据
        const orderRows = document.querySelectorAll('.order-list tr, .data-table tbody tr');

        orderRows.forEach(row => {
            const orderNumber = row.querySelector('.order-number, [data-field="orderNumber"]')?.textContent.trim();
            const trackingNumber = row.querySelector('.tracking-number, [data-field="trackingNumber"]')?.textContent.trim();
            const status = row.querySelector('.status, [data-field="status"]')?.textContent.trim();

            if (orderNumber) {
                orders.push({
                    order_number: orderNumber,
                    tracking_number: trackingNumber || '',
                    delivery_status: status || '',
                    sync_time: new Date().toISOString()
                });
            }
        });

        console.log('[YunExpress] 提取到订单数据:', orders.length, '条');
        return orders;
    }

    /**
     * 同步订单到飞书
     */
    async function syncOrdersToFeishu(orders, shopCode) {
        const shopConfig = SHOP_CONFIGS[shopCode];
        if (!shopConfig) {
            throw new Error('未找到店铺配置: ' + shopCode);
        }

        const accessToken = await getFeishuAccessToken();

        console.log('[YunExpress] 开始同步', orders.length, '条订单到飞书');

        let successCount = 0;
        let failCount = 0;

        for (const order of orders) {
            try {
                await updateFeishuRecord(accessToken, shopConfig, order);
                successCount++;
            } catch (error) {
                console.error('[YunExpress] 同步订单失败:', order.order_number, error);
                failCount++;
            }
        }

        return { successCount, failCount };
    }

    /**
     * 更新飞书记录
     */
    function updateFeishuRecord(accessToken, shopConfig, order) {
        return new Promise((resolve, reject) => {
            // 先查询记录是否存在
            GM_xmlhttpRequest({
                method: 'POST',
                url: `https://open.feishu.cn/open-apis/bitable/v1/apps/${shopConfig.feishu_app_token}/tables/${shopConfig.feishu_table_id}/records/search`,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    filter: {
                        conjunction: 'and',
                        conditions: [{
                            field_name: '运单号',
                            operator: 'is',
                            value: [order.order_number]
                        }]
                    }
                }),
                onload: function(response) {
                    const data = JSON.parse(response.responseText);

                    if (data.code === 0 && data.data.items.length > 0) {
                        // 记录存在，更新
                        const recordId = data.data.items[0].record_id;
                        updateRecord(accessToken, shopConfig, recordId, order, resolve, reject);
                    } else {
                        // 记录不存在，创建
                        createRecord(accessToken, shopConfig, order, resolve, reject);
                    }
                },
                onerror: reject
            });
        });
    }

    /**
     * 创建飞书记录
     */
    function createRecord(accessToken, shopConfig, order, resolve, reject) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: `https://open.feishu.cn/open-apis/bitable/v1/apps/${shopConfig.feishu_app_token}/tables/${shopConfig.feishu_table_id}/records`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                fields: {
                    '运单号': order.order_number,
                    '跟踪号': order.tracking_number,
                    '收货状态': order.delivery_status,
                    '同步时间': order.sync_time
                }
            }),
            onload: function(response) {
                const data = JSON.parse(response.responseText);
                if (data.code === 0) {
                    resolve(data);
                } else {
                    reject(new Error('创建记录失败: ' + data.msg));
                }
            },
            onerror: reject
        });
    }

    /**
     * 更新飞书记录
     */
    function updateRecord(accessToken, shopConfig, recordId, order, resolve, reject) {
        GM_xmlhttpRequest({
            method: 'PUT',
            url: `https://open.feishu.cn/open-apis/bitable/v1/apps/${shopConfig.feishu_app_token}/tables/${shopConfig.feishu_table_id}/records/${recordId}`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                fields: {
                    '跟踪号': order.tracking_number,
                    '收货状态': order.delivery_status,
                    '同步时间': order.sync_time
                }
            }),
            onload: function(response) {
                const data = JSON.parse(response.responseText);
                if (data.code === 0) {
                    resolve(data);
                } else {
                    reject(new Error('更新记录失败: ' + data.msg));
                }
            },
            onerror: reject
        });
    }

    // ==================== UI 界面 ====================

    /**
     * 创建控制面板
     */
    function createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'yunexpress-sync-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3>云途订单同步</h3>
                <button id="close-panel">×</button>
            </div>
            <div class="panel-body">
                <div class="shop-selector">
                    <label>当前店铺：</label>
                    <select id="shop-code-select">
                        <option value="nature">大自然草柳编</option>
                        <option value="mishang">迷尚</option>
                        <option value="jinyalong">金亚龙</option>
                    </select>
                </div>
                <div class="sync-status">
                    <p id="status-text">就绪</p>
                    <p id="sync-result"></p>
                </div>
                <div class="panel-actions">
                    <button id="sync-now-btn" class="btn-primary">立即同步</button>
                    <button id="config-btn" class="btn-secondary">配置</button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // 添加样式
        GM_addStyle(`
            #yunexpress-sync-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 320px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            #yunexpress-sync-panel .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
                border-radius: 8px 8px 0 0;
            }
            #yunexpress-sync-panel h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            #yunexpress-sync-panel #close-panel {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 24px;
                height: 24px;
                line-height: 20px;
            }
            #yunexpress-sync-panel .panel-body {
                padding: 16px;
            }
            #yunexpress-sync-panel .shop-selector {
                margin-bottom: 16px;
            }
            #yunexpress-sync-panel label {
                display: block;
                margin-bottom: 8px;
                font-size: 14px;
                font-weight: 500;
            }
            #yunexpress-sync-panel select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }
            #yunexpress-sync-panel .sync-status {
                margin-bottom: 16px;
                padding: 12px;
                background: #f8f9fa;
                border-radius: 4px;
                min-height: 60px;
            }
            #yunexpress-sync-panel .sync-status p {
                margin: 4px 0;
                font-size: 13px;
            }
            #yunexpress-sync-panel .panel-actions {
                display: flex;
                gap: 8px;
            }
            #yunexpress-sync-panel button {
                flex: 1;
                padding: 10px;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                font-weight: 500;
            }
            #yunexpress-sync-panel .btn-primary {
                background: #1890ff;
                color: white;
            }
            #yunexpress-sync-panel .btn-primary:hover {
                background: #40a9ff;
            }
            #yunexpress-sync-panel .btn-secondary {
                background: #f0f0f0;
                color: #333;
            }
            #yunexpress-sync-panel .btn-secondary:hover {
                background: #e0e0e0;
            }
        `);

        // 绑定事件
        document.getElementById('close-panel').addEventListener('click', () => {
            panel.style.display = 'none';
        });

        document.getElementById('sync-now-btn').addEventListener('click', handleSyncClick);
        document.getElementById('config-btn').addEventListener('click', showConfigDialog);

        // 设置当前店铺
        const currentShopCode = detectShopCode();
        document.getElementById('shop-code-select').value = currentShopCode;

        // 监听店铺切换
        document.getElementById('shop-code-select').addEventListener('change', (e) => {
            GM_setValue('LAST_SHOP_CODE', e.target.value);
        });
    }

    /**
     * 处理同步按钮点击
     */
    async function handleSyncClick() {
        const statusText = document.getElementById('status-text');
        const syncResult = document.getElementById('sync-result');
        const syncBtn = document.getElementById('sync-now-btn');

        try {
            syncBtn.disabled = true;
            statusText.textContent = '正在提取订单数据...';
            syncResult.textContent = '';

            const orders = extractOrderData();

            if (orders.length === 0) {
                statusText.textContent = '未找到订单数据';
                return;
            }

            statusText.textContent = `正在同步 ${orders.length} 条订单...`;

            const shopCode = document.getElementById('shop-code-select').value;
            const result = await syncOrdersToFeishu(orders, shopCode);

            statusText.textContent = '同步完成';
            syncResult.textContent = `成功: ${result.successCount} 条，失败: ${result.failCount} 条`;
            syncResult.style.color = result.failCount > 0 ? '#ff4d4f' : '#52c41a';

        } catch (error) {
            statusText.textContent = '同步失败';
            syncResult.textContent = error.message;
            syncResult.style.color = '#ff4d4f';
            console.error('[YunExpress] 同步错误:', error);
        } finally {
            syncBtn.disabled = false;
        }
    }

    /**
     * 显示配置对话框
     */
    function showConfigDialog() {
        const config = prompt('请输入配置（JSON格式）：\n\n示例：\n{\n  "FEISHU_APP_ID": "your_app_id",\n  "FEISHU_APP_SECRET": "your_secret"\n}');

        if (config) {
            try {
                const configObj = JSON.parse(config);
                Object.keys(configObj).forEach(key => {
                    GM_setValue(key, configObj[key]);
                });
                alert('配置已保存');
            } catch (error) {
                alert('配置格式错误: ' + error.message);
            }
        }
    }

    // ==================== 初始化 ====================

    function init() {
        console.log('[YunExpress] 脚本已加载');

        // 检查是否在云途后台页面
        if (window.location.hostname.includes('yunexpress.com')) {
            // 等待页面加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', createControlPanel);
            } else {
                createControlPanel();
            }

            // 自动同步（可选）
            // setTimeout(() => {
            //     handleSyncClick();
            // }, 3000);
        }
    }

    // 启动脚本
    init();

    // 暴露全局函数供手动调用
    window.syncYunExpressOrders = handleSyncClick;

})();
