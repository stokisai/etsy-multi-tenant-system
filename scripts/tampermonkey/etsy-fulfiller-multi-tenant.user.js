// ==UserScript==
// @name         Etsy Order Fulfiller (多租户版)
// @namespace    https://github.com/stokisai/etsy-multi-tenant-system
// @version      3.0.0
// @description  从飞书多维表格读取待处理订单，自动在 Etsy 完成发货填充（支持多店铺配置）
// @author       stokist
// @match        https://www.etsy.com/your/orders/sold*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      open.feishu.cn
// @connect      api.17track.net
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ========== 字段配置 ==========
  const FIELD_ORDER_ID = "Etsy订单号";
  const FIELD_TRACKING = "运单号";
  const FIELD_LAST_MILE_TRACKING = "运单末端号码";
  const FIELD_STATUS = "收货状态";
  const FIELD_CUSTOMER_NAME = "顾客姓名";
  const STATUS_RECEIVED = "已收货";
  const STATUS_SHIPPED = "已发货";

  // ========== 配置管理 ==========

  // 获取飞书凭据（所有店铺共享）
  function getAppCredentials() {
    return {
      app_id: GM_getValue("feishu_app_id", ""),
      app_secret: GM_getValue("feishu_app_secret", ""),
    };
  }

  // 保存飞书凭据
  function saveAppCredentials(app_id, app_secret) {
    GM_setValue("feishu_app_id", app_id);
    GM_setValue("feishu_app_secret", app_secret);
  }

  // 获取当前店铺的飞书表格配置
  function getCurrentTableConfig() {
    return {
      app_token: GM_getValue("current_app_token", ""),
      table_id: GM_getValue("current_table_id", ""),
      shop_name: GM_getValue("current_shop_name", "未命名店铺"),
    };
  }

  // 保存当前店铺的飞书表格配置
  function saveCurrentTableConfig(app_token, table_id, shop_name) {
    GM_setValue("current_app_token", app_token);
    GM_setValue("current_table_id", table_id);
    GM_setValue("current_shop_name", shop_name || "未命名店铺");
  }

  // 获取延迟时间
  function getDelaySeconds() {
    return GM_getValue("delay_seconds", 3);
  }

  // 设置延迟时间
  function setDelaySeconds(seconds) {
    GM_setValue("delay_seconds", seconds);
  }

  // ========== 配置界面 ==========

  // 配置飞书凭据
  function promptConfigureCredentials() {
    const current = getAppCredentials();
    const app_id = prompt("请输入飞书 App ID（所有店铺共享）:", current.app_id);
    if (app_id === null) return;

    const app_secret = prompt("请输入飞书 App Secret（所有店铺共享）:", current.app_secret);
    if (app_secret === null) return;

    saveAppCredentials(app_id, app_secret);
    alert("✅ 飞书凭据已保存！");
  }

  // 配置当前店铺的飞书表格
  function promptConfigureTable() {
    const current = getCurrentTableConfig();

    const shop_name = prompt("请输入店铺名称（用于识别）:", current.shop_name);
    if (shop_name === null) return;

    const app_token = prompt("请输入飞书 App Token（当前店铺）:", current.app_token);
    if (app_token === null) return;

    const table_id = prompt("请输入飞书 Table ID（当前店铺）:", current.table_id);
    if (table_id === null) return;

    saveCurrentTableConfig(app_token, table_id, shop_name);
    alert(`✅ 店铺「${shop_name}」的飞书表格配置已保存！\n\nApp Token: ${app_token}\nTable ID: ${table_id}`);
  }

  // 配置延迟时间
  function promptConfigureDelay() {
    const current = getDelaySeconds();
    const seconds = prompt("请输入每个订单之间的延迟时间（秒）:", current);
    if (seconds === null) return;

    const num = parseInt(seconds);
    if (isNaN(num) || num < 1) {
      alert("❌ 请输入有效的数字（至少1秒）");
      return;
    }

    setDelaySeconds(num);
    alert(`✅ 延迟时间已设置为 ${num} 秒`);
  }

  // 显示当前配置
  function showCurrentConfig() {
    const creds = getAppCredentials();
    const table = getCurrentTableConfig();
    const delay = getDelaySeconds();

    const message = `
📋 当前配置

【飞书凭据】（所有店铺共享）
App ID: ${creds.app_id || "❌ 未配置"}
App Secret: ${creds.app_secret ? "✅ 已配置" : "❌ 未配置"}

【当前店铺】
店铺名称: ${table.shop_name}
App Token: ${table.app_token || "❌ 未配置"}
Table ID: ${table.table_id || "❌ 未配置"}

【其他设置】
延迟时间: ${delay} 秒
    `.trim();

    alert(message);
  }

  // ========== 飞书 API ==========
  let feishuToken = "";
  let feishuTokenExpires = 0;

  async function getFeishuToken() {
    if (feishuToken && Date.now() < feishuTokenExpires) {
      return feishuToken;
    }

    const { app_id, app_secret } = getAppCredentials();
    if (!app_id || !app_secret) {
      throw new Error("请先配置飞书凭据（App ID 和 App Secret）");
    }

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ app_id, app_secret }),
        onload: (resp) => {
          const data = JSON.parse(resp.responseText);
          if (data.code !== 0) {
            reject(new Error(`获取飞书 token 失败: ${data.msg}`));
            return;
          }
          feishuToken = data.tenant_access_token;
          feishuTokenExpires = Date.now() + (data.expire - 300) * 1000;
          resolve(feishuToken);
        },
        onerror: (err) => reject(err),
      });
    });
  }

  async function fetchPendingOrders() {
    const token = await getFeishuToken();
    const table = getCurrentTableConfig();

    if (!table.app_token || !table.table_id) {
      throw new Error("请先配置当前店铺的飞书表格（App Token 和 Table ID）");
    }

    log(`正在从「${table.shop_name}」拉取订单数据...`);
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${table.app_token}/tables/${table.table_id}/records`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`拉取订单超时(30秒)`));
      }, 30000);

      GM_xmlhttpRequest({
        method: "GET",
        url: url + "?page_size=500",
        headers: { Authorization: `Bearer ${token}` },
        onload: (resp) => {
          clearTimeout(timeout);
          try {
            const data = JSON.parse(resp.responseText);
            if (data.code !== 0) {
              reject(new Error(`飞书 API 错误: ${data.msg}`));
              return;
            }

            const orders = [];
            const items = data.data?.items || [];
            log(`返回 ${items.length} 条记录，开始筛选...`);

            for (const item of items) {
              const fields = item.fields || {};
              const status = String(fields[FIELD_STATUS] || "").trim();
              const tracking = String(fields[FIELD_TRACKING] || "").trim();
              const lastMileTracking = String(fields[FIELD_LAST_MILE_TRACKING] || "").trim();
              const orderId = String(fields[FIELD_ORDER_ID] || "").trim();
              const customerName = String(fields[FIELD_CUSTOMER_NAME] || "").trim();

              // 筛选条件：收货状态="已收货"或"已发货" + 至少有一个运单号 + 有Etsy订单号
              const statusMatch = (status === STATUS_RECEIVED || status === STATUS_SHIPPED);
              const hasTracking = (tracking || lastMileTracking);
              const hasOrderId = !!orderId;

              if (statusMatch && hasTracking && hasOrderId) {
                orders.push({
                  orderId,
                  tracking: lastMileTracking || tracking,  // 优先使用末端号码
                  customerName,
                  status,
                  recordId: item.record_id,
                });
              }
            }

            log(`✅ 筛选出 ${orders.length} 个待处理订单`);
            resolve(orders);
          } catch (err) {
            reject(err);
          }
        },
        onerror: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      });
    });
  }

  // ========== 日志 ==========
  function log(msg) {
    console.log(`[Etsy Fulfiller] ${msg}`);
  }

  // ========== 注册菜单 ==========
  GM_registerMenuCommand("📋 查看当前配置", showCurrentConfig);
  GM_registerMenuCommand("🔑 配置飞书凭据（App ID/Secret）", promptConfigureCredentials);
  GM_registerMenuCommand("📊 配置当前店铺表格（App Token/Table ID）", promptConfigureTable);
  GM_registerMenuCommand("⏱️ 设置延迟时间", promptConfigureDelay);

  // ========== 主界面 ==========
  function createUI() {
    const table = getCurrentTableConfig();

    const container = document.createElement("div");
    container.id = "etsy-fulfiller-container";
    container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 350px;
      background: white;
      border: 2px solid #f1641e;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;

    container.innerHTML = `
      <div style="margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; color: #f1641e; font-size: 16px;">
          🚀 Etsy Order Fulfiller
        </h3>
        <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
          当前店铺：<strong>${table.shop_name}</strong>
        </div>
        <div style="font-size: 11px; color: #999;">
          ${table.app_token ? "✅ 已配置飞书表格" : "❌ 未配置飞书表格"}
        </div>
      </div>
      <div id="etsy-fulfiller-status" style="margin-bottom: 10px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 12px;">
        准备就绪
      </div>
      <div style="display: flex; gap: 8px; flex-direction: column;">
        <button id="etsy-fetch-orders" style="padding: 10px; background: #f1641e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
          📥 拉取待处理订单
        </button>
        <button id="etsy-start-fill" style="padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;" disabled>
          ▶️ 开始自动填充
        </button>
        <button id="etsy-stop-fill" style="padding: 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;" disabled>
          ⏹️ 停止
        </button>
      </div>
      <div id="etsy-orders-list" style="margin-top: 15px; max-height: 300px; overflow-y: auto;"></div>
    `;

    document.body.appendChild(container);

    // 绑定事件
    document.getElementById("etsy-fetch-orders").addEventListener("click", handleFetchOrders);
    document.getElementById("etsy-start-fill").addEventListener("click", handleStartFill);
    document.getElementById("etsy-stop-fill").addEventListener("click", handleStopFill);
  }

  let pendingOrders = [];
  let isRunning = false;

  async function handleFetchOrders() {
    const statusEl = document.getElementById("etsy-fulfiller-status");
    const listEl = document.getElementById("etsy-orders-list");

    try {
      statusEl.textContent = "正在拉取订单...";
      statusEl.style.background = "#fff3cd";

      pendingOrders = await fetchPendingOrders();

      if (pendingOrders.length === 0) {
        statusEl.textContent = "没有待处理订单";
        statusEl.style.background = "#d1ecf1";
        listEl.innerHTML = "<div style='padding: 10px; text-align: center; color: #666;'>暂无订单</div>";
        return;
      }

      statusEl.textContent = `找到 ${pendingOrders.length} 个待处理订单`;
      statusEl.style.background = "#d4edda";

      // 显示订单列表
      listEl.innerHTML = pendingOrders.map((order, index) => `
        <div style="padding: 8px; margin: 5px 0; background: #f9f9f9; border-radius: 4px; font-size: 12px;">
          <div><strong>${index + 1}. ${order.orderId}</strong></div>
          <div style="color: #666;">跟踪号: ${order.tracking}</div>
          <div style="color: #666;">顾客: ${order.customerName || "N/A"}</div>
        </div>
      `).join("");

      // 启用开始按钮
      document.getElementById("etsy-start-fill").disabled = false;

    } catch (err) {
      statusEl.textContent = `❌ 错误: ${err.message}`;
      statusEl.style.background = "#f8d7da";
      log(`拉取订单失败: ${err.message}`);
    }
  }

  async function handleStartFill() {
    if (pendingOrders.length === 0) {
      alert("请先拉取订单");
      return;
    }

    isRunning = true;
    document.getElementById("etsy-start-fill").disabled = true;
    document.getElementById("etsy-stop-fill").disabled = false;
    document.getElementById("etsy-fetch-orders").disabled = true;

    const statusEl = document.getElementById("etsy-fulfiller-status");
    statusEl.textContent = "正在自动填充...";
    statusEl.style.background = "#fff3cd";

    // TODO: 实现自动填充逻辑
    alert("自动填充功能开发中...\n\n当前版本只支持拉取订单。\n完整的自动填充功能将在后续版本中实现。");

    isRunning = false;
    document.getElementById("etsy-start-fill").disabled = false;
    document.getElementById("etsy-stop-fill").disabled = true;
    document.getElementById("etsy-fetch-orders").disabled = false;
  }

  function handleStopFill() {
    isRunning = false;
    document.getElementById("etsy-start-fill").disabled = false;
    document.getElementById("etsy-stop-fill").disabled = true;
    document.getElementById("etsy-fetch-orders").disabled = false;

    const statusEl = document.getElementById("etsy-fulfiller-status");
    statusEl.textContent = "已停止";
    statusEl.style.background = "#f8d7da";
  }

  // ========== 初始化 ==========
  window.addEventListener("load", () => {
    log("Etsy Order Fulfiller 已加载");
    createUI();
  });

})();
