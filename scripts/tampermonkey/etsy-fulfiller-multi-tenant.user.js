// ==UserScript==
// @name         Etsy Order Fulfiller (多租户版)
// @namespace    https://github.com/stokisai/etsy-multi-tenant-system
// @version      3.1.0
// @description  从飞书多维表格读取待处理订单，自动在 Etsy 完成发货填充（支持多表格配置）
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

  // 获取所有飞书表格配置（支持多个表格）
  function getAllTables() {
    const tablesJson = GM_getValue("feishu_tables", "[]");
    try {
      return JSON.parse(tablesJson);
    } catch (e) {
      return [];
    }
  }

  // 保存所有飞书表格配置
  function saveAllTables(tables) {
    GM_setValue("feishu_tables", JSON.stringify(tables));
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

  // 配置多个飞书表格
  function promptConfigureTables() {
    const currentTables = getAllTables();

    let configText = "请输入飞书表格配置（每行一个表格，格式：店铺名称 --- App Token --- Table ID）\n\n";
    configText += "示例：\n";
    configText += "大自然草柳编 --- Cu82bgVDGaNTNsspOs4c6dAJnIc --- tblWlIrPD6KZCy8U\n";
    configText += "迷尚首饰订单 --- MStWbahj8at2ZvsnheqcJtm2nYb --- tblalRxohrGovqXK\n\n";
    configText += "当前配置：\n";

    if (currentTables.length === 0) {
      configText += "（暂无配置）";
    } else {
      currentTables.forEach(t => {
        configText += `${t.name} --- ${t.app_token} --- ${t.table_id}\n`;
      });
    }

    const input = prompt(configText, currentTables.map(t => `${t.name} --- ${t.app_token} --- ${t.table_id}`).join("\n"));
    if (input === null) return;

    // 解析输入
    const lines = input.trim().split("\n").filter(line => line.trim());
    const tables = [];

    for (const line of lines) {
      const parts = line.split("---").map(p => p.trim());
      if (parts.length !== 3) {
        alert(`❌ 格式错误：${line}\n\n正确格式：店铺名称 --- App Token --- Table ID`);
        return;
      }

      const [name, app_token, table_id] = parts;
      if (!name || !app_token || !table_id) {
        alert(`❌ 配置不完整：${line}`);
        return;
      }

      tables.push({ name, app_token, table_id });
    }

    if (tables.length === 0) {
      alert("❌ 至少需要配置一个表格");
      return;
    }

    saveAllTables(tables);
    alert(`✅ 已保存 ${tables.length} 个飞书表格配置！\n\n${tables.map(t => `• ${t.name}`).join("\n")}`);
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
    const tables = getAllTables();
    const delay = getDelaySeconds();

    let message = `📋 当前配置\n\n`;
    message += `【飞书凭据】（所有店铺共享）\n`;
    message += `App ID: ${creds.app_id || "❌ 未配置"}\n`;
    message += `App Secret: ${creds.app_secret ? "✅ 已配置" : "❌ 未配置"}\n\n`;
    message += `【飞书表格】（共 ${tables.length} 个）\n`;
    
    if (tables.length === 0) {
      message += "❌ 未配置任何表格\n";
    } else {
      tables.forEach((t, i) => {
        message += `${i + 1}. ${t.name}\n`;
        message += `   App Token: ${t.app_token}\n`;
        message += `   Table ID: ${t.table_id}\n`;
      });
    }
    
    message += `\n【其他设置】\n`;
    message += `延迟时间: ${delay} 秒`;

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

  // 从单个表格拉取订单
  async function fetchOrdersFromTable(token, table) {
    log(`正在从「${table.name}」拉取订单数据...`);
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${table.app_token}/tables/${table.table_id}/records`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`拉取订单超时(30秒): ${table.name}`));
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
              reject(new Error(`飞书 API 错误 (${table.name}): ${data.msg}`));
              return;
            }

            const orders = [];
            const items = data.data?.items || [];
            log(`「${table.name}」返回 ${items.length} 条记录，开始筛选...`);

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
                  tableName: table.name,  // 记录来源表格
                });
              }
            }

            log(`✅ 「${table.name}」筛选出 ${orders.length} 个待处理订单`);
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

  // 从所有表格拉取订单
  async function fetchPendingOrders() {
    const token = await getFeishuToken();
    const tables = getAllTables();

    if (tables.length === 0) {
      throw new Error("请先配置飞书表格");
    }

    log(`开始从 ${tables.length} 个表格拉取订单...`);
    
    // 并行拉取所有表格的订单
    const results = await Promise.allSettled(
      tables.map(table => fetchOrdersFromTable(token, table))
    );

    // 合并所有成功的结果
    const allOrders = [];
    const errors = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        allOrders.push(...result.value);
      } else {
        errors.push(`${tables[index].name}: ${result.reason.message}`);
      }
    });

    if (errors.length > 0) {
      log(`⚠️ 部分表格拉取失败:\n${errors.join("\n")}`);
    }

    log(`✅ 总共筛选出 ${allOrders.length} 个待处理订单`);
    return allOrders;
  }

  // ========== 日志 ==========
  function log(msg) {
    console.log(`[Etsy Fulfiller] ${msg}`);
  }

  // ========== 注册菜单 ==========
  GM_registerMenuCommand("📋 查看当前配置", showCurrentConfig);
  GM_registerMenuCommand("🔑 配置飞书凭据（App ID/Secret）", promptConfigureCredentials);
  GM_registerMenuCommand("📊 配置飞书表格（支持多个）", promptConfigureTables);
  GM_registerMenuCommand("⏱️ 设置延迟时间", promptConfigureDelay);

  // ========== 主界面 ==========
  function createUI() {
    const tables = getAllTables();

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
          已配置 <strong>${tables.length}</strong> 个飞书表格
        </div>
        <div style="font-size: 11px; color: #999;">
          ${tables.length > 0 ? `✅ ${tables.map(t => t.name).join(", ")}` : "❌ 未配置飞书表格"}
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
          <div style="color: #999; font-size: 10px;">来源: ${order.tableName}</div>
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
