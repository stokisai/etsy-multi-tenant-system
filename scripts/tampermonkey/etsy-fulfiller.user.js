// ==UserScript==
// @name         Etsy Order Fulfiller (备选方案)
// @namespace    https://github.com/stokisai/etsy-fulfiller
// @version      2.7.3
// @description  从飞书多维表格读取待处理订单，自动在 Etsy 完成发货填充（支持多表）
// @author       etsytian
// @match        https://www.etsy.com/your/orders/sold*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      open.feishu.cn
// @connect      api.17track.net
// @updateURL    https://raw.githubusercontent.com/stokisai/etsy-fulfiller/main/etsy-fulfiller.user.js
// @downloadURL  https://raw.githubusercontent.com/stokisai/etsy-fulfiller/main/etsy-fulfiller.user.js
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ========== 多表格配置 ==========
  const FEISHU_TABLES = [
    { app_token: 'XsiMbfp5NaWUVgsVUUccHUtMn0d', table_id: 'tblao72mWjoXKR6h', name: '金亚龙订单田小康（上门取件）' },
    { app_token: 'MStWbahj8at2ZvsnheqcJtm2nYb', table_id: 'tblalRxohrGovqXK', name: '迷尚首饰订单' },
    { app_token: 'ACZYbcb3saKLuPsRQ2pc4jsEn3D', table_id: 'tblCCz6WAM1SGQO0', name: '张家港帽子' },
    { app_token: 'Cu82bgVDGaNTNsspOs4c6dAJnIc', table_id: 'tblWlIrPD6KZCy8U', name: '大自然草柳编' },
  ];

  const FIELD_ORDER_ID = "Etsy订单号";
  const FIELD_TRACKING = "运单号";
  const FIELD_LAST_MILE_TRACKING = "运单末端号码";  // 运单末端号码
  const FIELD_STATUS = "收货状态";
  const FIELD_CUSTOMER_NAME = "顾客姓名";  // 顾客姓名字段
  const STATUS_RECEIVED = "已收货";
  const STATUS_SHIPPED = "已发货";

  // ========== 配置管理 ==========
  function getAppCredentials() {
    return {
      app_id: GM_getValue("feishu_app_id", ""),
      app_secret: GM_getValue("feishu_app_secret", ""),
    };
  }

  function saveAppCredentials(app_id, app_secret) {
    GM_setValue("feishu_app_id", app_id);
    GM_setValue("feishu_app_secret", app_secret);
  }

  function getDelaySeconds() {
    return GM_getValue("delay_seconds", 3);
  }

  function setDelaySeconds(seconds) {
    GM_setValue("delay_seconds", seconds);
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
      throw new Error("请先配置飞书凭据");
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

  async function fetchPendingOrdersFromTable(table) {
    const token = await getFeishuToken();
    const tableName = table.name;  // 直接使用配置的表格名称

    log(`正在从 ${tableName} 拉取订单数据...`);
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${table.app_token}/tables/${table.table_id}/records`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${tableName} 拉取订单超时(30秒)`));
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
              reject(new Error(`${tableName} API 错误: ${data.msg}`));
              return;
            }

            const orders = [];
            const items = data.data?.items || [];
            log(`${tableName} 返回 ${items.length} 条记录，开始筛选...`);

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

              // 调试：记录不符合条件的记录
              if (!statusMatch || !hasTracking || !hasOrderId) {
                console.log(`[Etsy Fulfiller] ${tableName} 不符合条件的记录:`, {
                  status, statusMatch,
                  tracking, lastMileTracking, hasTracking,
                  orderId, hasOrderId,
                  customerName,
                  '原因': !statusMatch ? '状态不符' : !hasTracking ? '无运单号' : '无Etsy订单号',
                  '所有字段': fields
                });
              }

              if (statusMatch && hasTracking && hasOrderId) {
                orders.push({
                  orderId,
                  tracking,
                  lastMileTracking,
                  customerName,
                  recordId: item.record_id,
                  tableName: tableName,  // 使用配置的表格名称
                  appToken: table.app_token,
                  tableId: table.table_id,
                  originalStatus: status,  // 保存原始状态
                  status: "pending",
                });
              }
            }
            log(`${tableName} 筛选出 ${orders.length} 个待处理订单`);
            resolve(orders);
          } catch (err) {
            clearTimeout(timeout);
            reject(new Error(`${tableName} 解析响应失败: ${err.message}`));
          }
        },
        onerror: (err) => {
          clearTimeout(timeout);
          reject(new Error(`${tableName} 请求失败: ${err.statusText || '网络错误'}`));
        },
      });
    });
  }

  async function fetchAllPendingOrders() {
    const allOrders = [];
    for (const table of FEISHU_TABLES) {
      try {
        log(`正在从 ${table.name} 拉取订单...`);
        const orders = await fetchPendingOrdersFromTable(table);
        allOrders.push(...orders);
        log(`${table.name}: 找到 ${orders.length} 个待处理订单`);
      } catch (err) {
        log(`${table.name} 拉取失败: ${err.message}`, "error");
      }
    }
    return allOrders;
  }

  async function updateOrderStatus(order, statusText) {
    const token = await getFeishuToken();
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${order.appToken}/tables/${order.tableId}/records/${order.recordId}`;

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "PUT",
        url,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          fields: { [FIELD_STATUS]: statusText },
        }),
        onload: (resp) => {
          const data = JSON.parse(resp.responseText);
          if (data.code !== 0) {
            reject(new Error(`回写状态失败: ${data.msg}`));
          } else {
            resolve();
          }
        },
        onerror: (err) => reject(err),
      });
    });
  }

  // ========== DOM 操作模块 ==========
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function searchOrder(customerName) {
    const input = document.querySelector("input[placeholder*='Search']");
    if (!input) throw new Error("搜索框未找到");

    log(`准备搜索: ${customerName}`);
    log(`当前页面URL: ${window.location.href}`);

    // 清空并填入顾客姓名
    input.value = "";
    input.focus();
    await sleep(200);

    input.value = customerName;

    // 触发input事件
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    await sleep(300);

    // 查找放大镜搜索按钮（SVG图标）
    let searchBtn = null;

    // 方法1: 查找包含特定SVG路径的按钮（放大镜图标）
    const buttons = document.querySelectorAll("button");
    for (const btn of buttons) {
      const svg = btn.querySelector("svg");
      if (svg) {
        const path = svg.querySelector("path[d*='M10.5 19']"); // 匹配你提供的SVG路径
        if (path) {
          searchBtn = btn;
          log("找到放大镜搜索按钮（通过SVG路径）");
          break;
        }
      }
    }

    // 方法2: 如果方法1失败，尝试查找搜索框旁边的按钮
    if (!searchBtn) {
      const form = input.closest("form");
      if (form) {
        searchBtn = form.querySelector("button[type='submit']");
        if (searchBtn) {
          log("找到搜索表单的提交按钮");
        }
      }
    }

    // 方法3: 查找aria-label包含Search的按钮
    if (!searchBtn) {
      searchBtn = document.querySelector("button[aria-label*='Search'], button[aria-label*='search']");
      if (searchBtn) {
        log("找到搜索按钮（通过aria-label）");
      }
    }

    // 点击搜索按钮
    if (searchBtn) {
      searchBtn.click();
      log("已点击搜索按钮");
    } else {
      log("未找到搜索按钮，尝试按Enter键");
      // 模拟Enter键
      const keydownEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      input.dispatchEvent(keydownEvent);
    }

    // 等待页面跳转
    await sleep(2000);
    log(`搜索后页面URL: ${window.location.href}`);

    // 再等待1秒让搜索结果加载
    await sleep(1000);
    log(`已搜索顾客: ${customerName}`);
  }

  function getDestinationCountry() {
    const body = document.body.innerText;
    const match = body.match(/Deliver to[\s\S]*?\n([A-Za-z ]+)$/m);
    if (match) {
      const country = match[1].trim();
      log(`从"Deliver to"识别国家: ${country}`);
      return country;
    }

    const spans = document.querySelectorAll("span, div, p");
    for (const el of spans) {
      const text = el.textContent.trim();
      if (text.match(/^(United States|France|Canada|United Kingdom|Germany|Australia|Japan|Italy|Spain)$/)) {
        log(`从页面元素识别国家: ${text}`);
        return text;
      }
    }

    log("未能识别目的地国家");
    return "";
  }

  function pickTracking(order, country) {
    const lastMile = order.lastMileTracking.trim();  // 运单末端号码

    // 优先级1: 英国 + H开头的运单末端号码，用Evri
    if ((country === "United Kingdom" || country === "UK" || country === "GB") && lastMile && lastMile.toUpperCase().startsWith("H")) {
      log(`英国订单，使用H开头运单末端号码: ${lastMile}，物流商: Evri`);
      return { tracking: lastMile, company: "Evri" };
    }

    // 优先级2: 如果有92开头的运单末端号码，使用USPS
    if (lastMile && lastMile.startsWith("92")) {
      log(`使用92开头运单末端号码: ${lastMile}，物流商: USPS`);
      return { tracking: lastMile, company: "USPS" };
    }

    // 优先级3: 其他情况用云途单号
    const tracking = order.tracking;
    log(`${country || "未知国家"}，使用云途单号: ${tracking}，物流商: yunexpress`);
    return { tracking, company: "yunexpress" };
  }

  async function checkFirstOrder() {
    const cb = document.querySelector("input[id^='order-checkbox-']");
    if (!cb) throw new Error("未找到订单 checkbox");
    if (!cb.checked) cb.click();
    await sleep(500);
    log("已勾选订单");
  }

  async function clickCompleteOrderBar() {
    // 方法1: 通过文本内容查找
    let btns = document.querySelectorAll("button[type='submit']");
    for (const b of btns) {
      if (b.textContent.includes("Complete order") && !b.disabled) {
        b.click();
        await sleep(2000);
        log("已点击 Complete order（通过文本）");
        return;
      }
    }

    // 方法2: 通过SVG图标查找（勾选图标）
    const allButtons = document.querySelectorAll("button");
    for (const btn of allButtons) {
      const svg = btn.querySelector("svg");
      if (svg) {
        const path = svg.querySelector("path[d*='m15.292 9.281']"); // 勾选图标
        if (path && !btn.disabled) {
          log("找到 Complete order 按钮（通过勾选图标）");
          btn.click();
          await sleep(2000);
          log("已点击 Complete order，表单已展开");
          return;
        }
      }
    }

    // 方法3: 查找包含"Complete"文本的任何按钮
    for (const btn of allButtons) {
      if (btn.textContent.toLowerCase().includes("complete") && !btn.disabled) {
        log("找到 Complete order 按钮（通过Complete文本）");
        btn.click();
        await sleep(2000);
        log("已点击 Complete order，表单已展开");
        return;
      }
    }

    throw new Error("Complete order 按钮未找到");
  }

  async function selectCarrier(companyName) {
    const sel = document.querySelector("select[id='shipping-carrier-select']");
    if (!sel) throw new Error("物流商下拉框未找到");

    const opts = Array.from(sel.options);
    const match = opts.find((o) => o.text.toLowerCase().includes(companyName.toLowerCase()));

    if (match) {
      sel.value = match.value;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await sleep(1000);
      log(`下拉菜单中找到: ${match.text}`);
    } else {
      sel.value = "-1";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await sleep(1000);
      const carrierInput = document.querySelector("input[name^='carrierName-']");
      if (!carrierInput) throw new Error("Delivery company 输入框未找到");
      carrierInput.value = companyName;
      carrierInput.dispatchEvent(new Event("input", { bubbles: true }));
      log(`下拉菜单未找到，选 Other 填入 ${companyName}`);
    }
  }

  async function fillTracking(trackingNumber) {
    const input = document.querySelector("input[name^='trackingCode-']");
    if (!input) throw new Error("运单号输入框未找到");
    input.value = trackingNumber;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(500);
    log(`已填写运单号: ${trackingNumber}`);
  }

  async function submitComplete() {
    const btns = Array.from(document.querySelectorAll("button"));
    const btn = btns.reverse().find((b) => b.textContent.includes("Complete order") && !b.disabled);
    if (!btn) throw new Error("提交按钮未找到");
    btn.click();
    await sleep(3000);
    log("已提交 Complete order");
  }

  // ========== 核心填充流程 ==========
  async function fulfillOrder(order) {
    try {
      // 优先使用顾客姓名，如果为空则使用订单号
      const searchTerm = order.customerName && order.customerName !== "未知"
        ? order.customerName
        : order.orderId;

      await searchOrder(searchTerm);

      const country = getDestinationCountry();
      const { tracking, company } = pickTracking(order, country);
      log(`${order.customerName || order.orderId}，使用${company === 'yunexpress' ? '云途' : company}单号: ${tracking}，物流商: ${company}`);

      await checkFirstOrder();
      await clickCompleteOrderBar();
      await selectCarrier(company);
      await fillTracking(tracking);
      await submitComplete();

      // 回传成功后，更新状态为"回传+原状态"
      const newStatus = `回传+${order.originalStatus}`;
      log(`✅ 订单 ${order.orderId} (${order.customerName || '无姓名'}) 填充完成`);
      await updateOrderStatus(order, newStatus);
      return true;
    } catch (err) {
      const errorMsg = err.message || String(err);
      const stackTrace = err.stack || "";
      log(`❌ 订单 ${order.orderId} (${order.customerName || '无姓名'}) 失败: ${errorMsg}`, "error");
      console.error(`[Etsy Fulfiller] 订单 ${order.orderId} 详细错误:`, err);
      console.error(`[Etsy Fulfiller] 堆栈跟踪:`, stackTrace);
      // 失败时不回写状态到飞书，保持原状态不变，以便下次重试
      // await updateOrderStatus(order, `失败: ${errorMsg}`);
      return false;
    }
  }

  // ========== UI 控制面板 ==========
  let panel, logArea, orderList, statusText;
  let orders = [];
  let isRunning = false;
  let logHistory = [];  // 保存所有日志用于导出

  function log(msg, level = "info") {
    const time = new Date().toLocaleTimeString();
    const timestamp = new Date().toISOString();
    const color = level === "error" ? "red" : level === "success" ? "green" : "black";

    // 保存到历史记录
    logHistory.push({ timestamp, level, msg });

    // 显示在UI
    logArea.innerHTML += `<div style="color: ${color}">[${time}] ${msg}</div>`;
    logArea.scrollTop = logArea.scrollHeight;

    // 输出到浏览器控制台
    const consoleMsg = `[Etsy Fulfiller] [${time}] ${msg}`;
    if (level === "error") {
      console.error(consoleMsg);
    } else if (level === "success") {
      console.log(`%c${consoleMsg}`, "color: green; font-weight: bold");
    } else {
      console.log(consoleMsg);
    }
  }

  function exportLogs() {
    const logText = logHistory.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.msg}`).join("\n");
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `etsy-fulfiller-log-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    log("日志已导出", "success");
  }

  function clearLogs() {
    logHistory = [];
    logArea.innerHTML = "";
    log("日志已清空");
  }

  function createPanel() {
    panel = document.createElement("div");
    panel.id = "etsy-fulfiller-panel";
    panel.innerHTML = `
      <style>
        #etsy-fulfiller-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 450px;
          max-height: 600px;
          background: white;
          border: 2px solid #333;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 999999;
          font-family: monospace;
          font-size: 12px;
          display: flex;
          flex-direction: column;
        }
        #etsy-fulfiller-panel .header {
          background: #333;
          color: white;
          padding: 10px;
          font-weight: bold;
          border-radius: 6px 6px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        #etsy-fulfiller-panel .body {
          padding: 10px;
          overflow-y: auto;
          flex: 1;
        }
        #etsy-fulfiller-panel button {
          margin: 5px 2px;
          padding: 8px 12px;
          cursor: pointer;
          border: 1px solid #333;
          background: #f0f0f0;
          border-radius: 4px;
        }
        #etsy-fulfiller-panel button:hover {
          background: #e0e0e0;
        }
        #etsy-fulfiller-panel button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        #etsy-fulfiller-panel .log {
          background: #f9f9f9;
          border: 1px solid #ddd;
          padding: 8px;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 10px;
          font-size: 11px;
        }
        #etsy-fulfiller-panel .order-item {
          padding: 5px;
          margin: 5px 0;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #fafafa;
        }
        #etsy-fulfiller-panel .order-item.success {
          background: #d4edda;
          border-color: #c3e6cb;
        }
        #etsy-fulfiller-panel .order-item.error {
          background: #f8d7da;
          border-color: #f5c6cb;
        }
      </style>
      <div class="header">
        <span>🚀 Etsy 订单填充器 (多表版)</span>
        <button id="close-panel" style="padding: 2px 8px;">✕</button>
      </div>
      <div class="body">
        <button id="config-btn">⚙ 配置</button>
        <button id="fetch-btn">拉取订单</button>
        <button id="start-btn" disabled>开始填充</button>
        <button id="stop-btn" disabled>暂停</button>
        <button id="export-log-btn" style="background: #fff3cd; border-color: #ffc107;">📥 导出日志</button>
        <button id="clear-log-btn" style="background: #f8d7da; border-color: #f5c6cb;">🗑 清空日志</button>
        <div id="status-text" style="margin: 10px 0; font-weight: bold;"></div>
        <div id="order-list"></div>
        <div class="log" id="log-area"></div>
      </div>
    `;
    document.body.appendChild(panel);

    logArea = panel.querySelector("#log-area");
    orderList = panel.querySelector("#order-list");
    statusText = panel.querySelector("#status-text");

    panel.querySelector("#close-panel").onclick = () => (panel.style.display = "none");
    panel.querySelector("#config-btn").onclick = showConfigDialog;
    panel.querySelector("#fetch-btn").onclick = fetchOrders;
    panel.querySelector("#start-btn").onclick = startFulfillment;
    panel.querySelector("#stop-btn").onclick = stopFulfillment;
    panel.querySelector("#export-log-btn").onclick = exportLogs;
    panel.querySelector("#clear-log-btn").onclick = clearLogs;
  }

  function log(msg, level = "info") {
    const time = new Date().toLocaleTimeString();
    const timestamp = new Date().toISOString();
    const color = level === "error" ? "red" : level === "success" ? "green" : "black";

    // 保存到历史记录
    logHistory.push({ timestamp, level, msg });

    // 显示在UI
    logArea.innerHTML += `<div style="color: ${color}">[${time}] ${msg}</div>`;
    logArea.scrollTop = logArea.scrollHeight;

    // 输出到浏览器控制台
    const consoleMsg = `[Etsy Fulfiller] [${time}] ${msg}`;
    if (level === "error") {
      console.error(consoleMsg);
    } else if (level === "success") {
      console.log(`%c${consoleMsg}`, "color: green; font-weight: bold");
    } else {
      console.log(consoleMsg);
    }
  }

  function exportLogs() {
    const logText = logHistory.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.msg}`).join("\n");
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `etsy-fulfiller-log-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    log("日志已导出", "success");
  }

  function clearLogs() {
    logHistory = [];
    logArea.innerHTML = "";
    log("日志已清空");
  }

  function showConfigDialog() {
    const cred = getAppCredentials();
    const delay = getDelaySeconds();
    const html = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid #333; border-radius: 8px; z-index: 9999999; width: 500px;">
        <h3>飞书配置</h3>
        <p style="color: #666; font-size: 12px;">配置后将从 ${FEISHU_TABLES.length} 张表格中拉取订单</p>
        <label>App ID: <input id="cfg-app-id" value="${cred.app_id}" style="width: 100%; margin: 5px 0;"></label><br>
        <label>App Secret: <input id="cfg-app-secret" value="${cred.app_secret}" style="width: 100%; margin: 5px 0;"></label><br>
        <label>订单间延迟(秒): <input id="cfg-delay" type="number" value="${delay}" style="width: 100%; margin: 5px 0;"></label><br>
        <button id="save-cfg" style="margin-top: 10px; padding: 10px 20px;">保存</button>
        <button id="cancel-cfg" style="margin-top: 10px; padding: 10px 20px;">取消</button>
      </div>
    `;
    const dialog = document.createElement("div");
    dialog.innerHTML = html;
    document.body.appendChild(dialog);

    dialog.querySelector("#save-cfg").onclick = () => {
      const app_id = dialog.querySelector("#cfg-app-id").value;
      const app_secret = dialog.querySelector("#cfg-app-secret").value;
      const delay = parseInt(dialog.querySelector("#cfg-delay").value);
      saveAppCredentials(app_id, app_secret);
      setDelaySeconds(delay);
      alert("配置已保存");
      dialog.remove();
    };

    dialog.querySelector("#cancel-cfg").onclick = () => dialog.remove();
  }

  async function fetchOrders() {
    const cred = getAppCredentials();
    if (!cred.app_id || !cred.app_secret) {
      alert("请先配置飞书凭据");
      return;
    }

    log("正在从多张表格拉取订单...");
    try {
      orders = await fetchAllPendingOrders();
      statusText.textContent = `拉取到 ${orders.length} 个待处理订单（来自 ${FEISHU_TABLES.length} 张表）`;
      renderOrderList();
      panel.querySelector("#start-btn").disabled = orders.length === 0;
      log(`✅ 拉取成功，共 ${orders.length} 个订单`, "success");
    } catch (err) {
      const errorMsg = err.message || String(err);
      log(`❌ 拉取失败: ${errorMsg}`, "error");
      console.error("[Etsy Fulfiller] 拉取订单详细错误:", err);
      alert(`拉取订单失败: ${errorMsg}\n\n请按 F12 打开控制台查看详细错误信息`);
    }
  }

  function renderOrderList() {
    orderList.innerHTML = "";
    orders.forEach((order, idx) => {
      const div = document.createElement("div");
      div.className = "order-item";
      div.id = `order-${idx}`;
      div.innerHTML = `
        <strong>${order.orderId}</strong><br>
        <span style="color: #666; font-size: 10px;">表格: ${order.tableName}</span><br>
        <span style="color: #666; font-size: 10px;">顾客: ${order.customerName || "未知"}</span><br>
        <span style="color: #666; font-size: 10px;">飞书状态: ${order.originalStatus}</span><br>
        运单号: ${order.tracking || "无"}<br>
        运单末端号码: ${order.lastMileTracking || "无"}<br>
        状态: <span id="order-status-${idx}">⏳ 等待</span>
      `;
      orderList.appendChild(div);
    });
  }

  async function startFulfillment() {
    const delay = getDelaySeconds();
    isRunning = true;
    panel.querySelector("#start-btn").disabled = true;
    panel.querySelector("#stop-btn").disabled = false;
    panel.querySelector("#fetch-btn").disabled = true;

    for (let i = 0; i < orders.length; i++) {
      if (!isRunning) {
        log("⏸ 用户暂停");
        break;
      }

      const order = orders[i];
      const statusSpan = document.getElementById(`order-status-${i}`);
      const orderDiv = document.getElementById(`order-${i}`);

      statusSpan.textContent = "🔄 处理中...";
      const success = await fulfillOrder(order);

      if (success) {
        statusSpan.textContent = "✅ 完成";
        orderDiv.classList.add("success");
      } else {
        statusSpan.textContent = "❌ 失败";
        orderDiv.classList.add("error");
      }

      if (i < orders.length - 1) {
        await sleep(delay * 1000);
      }
    }

    isRunning = false;
    panel.querySelector("#start-btn").disabled = false;
    panel.querySelector("#stop-btn").disabled = true;
    panel.querySelector("#fetch-btn").disabled = false;
    log("🎉 所有订单处理完成", "success");
  }

  function stopFulfillment() {
    isRunning = false;
    log("⏸ 正在暂停...");
  }

  // ========== 初始化 ==========
  if (window.location.href.includes("/your/orders/sold")) {
    createPanel();
    log("油猴脚本已加载（多表版），点击「拉取订单」开始");
    log(`将从 ${FEISHU_TABLES.length} 张表格中拉取订单`);
  }
})();
