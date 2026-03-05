// ==UserScript==
// @name         云途订单 → 飞书同步
// @namespace    https://github.com/stokist/etsy-fulfiller
// @version      3.2.0
// @description  扫描云途后台订单，自动同步「已发货」和「已收货」状态到飞书多维表格（支持多表）+ 同步跟踪号（蓝色按钮一键全同步）
// @author       stokist
// @match        *://oms2.yunexpress.cn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      open.feishu.cn
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const FEISHU_BASE = 'https://open.feishu.cn/open-apis';
  const FIELD_TRACKING = '运单号';
  const FIELD_STATUS = '收货状态';
  const FIELD_LOCAL_TRACKING = '运单末端号码';
  const STATUS_SHIPPED = '已发货';
  const STATUS_RECEIVED = '已收货';

  // 云途订单状态关键词（精确匹配）
  const SHIPPED_KEYWORDS = ['已发货'];
  const RECEIVED_KEYWORDS = ['已收货'];

  const FEISHU_TABLES = [
    { app_token: 'XsiMbfp5NaWUVgsVUUccHUtMn0d', table_id: 'tblao72mWjoXKR6h', name: '表1-上门取件' },
    { app_token: 'MStWbahj8at2ZvsnheqcJtm2nYb', table_id: 'tblalRxohrGovqXK', name: '表2-上门取件' },
    { app_token: 'ACZYbcb3saKLuPsRQ2pc4jsEn3D', table_id: 'tblCCz6WAM1SGQO0', name: '表3-上门取件' },
    { app_token: 'Cu82bgVDGaNTNsspOs4c6dAJnIc', table_id: 'tblWlIrPD6KZCy8U', name: '表4-上门取件' },
  ];

  const SYNC_DELAY = 300;

  let stopRequested = false;

  let _token = '';
  let _tokenExpires = 0;

  function getAppCredentials() {
    return {
      app_id: GM_getValue('feishu_app_id', ''),
      app_secret: GM_getValue('feishu_app_secret', ''),
    };
  }

  function credentialsValid() {
    const c = getAppCredentials();
    return c.app_id && c.app_secret;
  }

  function gmFetch(method, url, data) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method,
        url,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ..._token ? { Authorization: `Bearer ${_token}` } : {},
        },
        data: data ? JSON.stringify(data) : undefined,
        onload(res) {
          try { resolve(JSON.parse(res.responseText)); }
          catch { reject(new Error(`JSON 解析失败: ${res.responseText.slice(0, 200)}`)); }
        },
        onerror(err) { reject(new Error(`请求失败: ${err.statusText || '网络错误'}`)); },
      });
    });
  }

  async function ensureToken() {
    if (_token && Date.now() < _tokenExpires) return;
    const { app_id, app_secret } = getAppCredentials();
    const data = await gmFetch('POST', `${FEISHU_BASE}/auth/v3/tenant_access_token/internal`, { app_id, app_secret });
    if (data.code !== 0) throw new Error(`获取 token 失败: ${data.msg}`);
    _token = data.tenant_access_token;
    _tokenExpires = Date.now() + (data.expire || 7200) * 1000 - 300_000;
  }

  /** 在所有表中搜索运单号，找到就返回（已是目标状态则跳过） */
  async function searchRecordAllTables(trackingNo, targetStatus) {
    await ensureToken();
    for (const tbl of FEISHU_TABLES) {
      const url = `${FEISHU_BASE}/bitable/v1/apps/${tbl.app_token}/tables/${tbl.table_id}/records/search`;
      const body = {
        page_size: 1,
        filter: { conjunction: 'and', conditions: [
          { field_name: FIELD_TRACKING, operator: 'is', value: [trackingNo] },
        ]},
      };
      const data = await gmFetch('POST', url, body);
      if (data.code !== 0) { console.warn(`[订单同步] ${tbl.name} 搜索出错: ${data.msg}`); continue; }
      const items = data.data?.items || [];
      if (items.length === 0) continue;

      const record = items[0];
      let currentStatus = record.fields?.[FIELD_STATUS] || '';

      // 如果状态是对象（选项类型），提取文本值
      if (typeof currentStatus === 'object' && currentStatus !== null) {
        currentStatus = currentStatus.text || currentStatus.name || '';
      }

      console.log(`[订单同步] ${trackingNo}: 在 ${tbl.name} 找到, 收货状态="${currentStatus}"`);

      // 如果状态包含「回传」，不修改
      if (currentStatus.includes('回传')) {
        console.log(`[订单同步] ${trackingNo}: 跳过（状态包含「回传」）`);
        return null;
      }

      if (currentStatus === targetStatus) return null; // 已是目标状态，跳过
      return { record, app_token: tbl.app_token, table_id: tbl.table_id, tableName: tbl.name, currentStatus };
    }
    console.log(`[订单同步] ${trackingNo}: 所有表均未找到`);
    return null;
  }

  async function updateRecord(app_token, table_id, recordId, targetStatus) {
    await ensureToken();
    const url = `${FEISHU_BASE}/bitable/v1/apps/${app_token}/tables/${table_id}/records/${recordId}`;
    const data = await gmFetch('PUT', url, { fields: { [FIELD_STATUS]: targetStatus } });
    if (data.code !== 0) throw new Error(`更新失败: ${data.msg}`);
  }

  async function updateLocalTracking(app_token, table_id, recordId, localTracking) {
    await ensureToken();
    const url = `${FEISHU_BASE}/bitable/v1/apps/${app_token}/tables/${table_id}/records/${recordId}`;
    const data = await gmFetch('PUT', url, { fields: { [FIELD_LOCAL_TRACKING]: localTracking } });
    if (data.code !== 0) throw new Error(`更新跟踪号失败: ${data.msg}`);
  }

  // DOM 扫描

  function isShipped(text) {
    const t = (text || '').trim();
    return SHIPPED_KEYWORDS.includes(t); // 精确匹配
  }

  function isReceived(text) {
    const t = (text || '').trim();
    return RECEIVED_KEYWORDS.includes(t); // 精确匹配
  }

  function findColumnClass(title) {
    const headers = document.querySelectorAll('.el-table__header-wrapper th');
    for (const th of headers) {
      const titleDiv = th.querySelector(`div[title="${title}"]`);
      if (titleDiv) {
        const match = th.className.match(/el-table_\d+_column_\d+/);
        return match ? match[0] : null;
      }
    }
    return null;
  }

  /** 边滚边收集：滚动表格，每一屏抓取可见行数据存入 Map（去重） */
  async function scrollAndCollect() {
    const wrapper = document.querySelector('.el-table__body-wrapper');
    if (!wrapper) return [];
    const trackingCol = findColumnClass('运单号');
    const statusCol = findColumnClass('订单状态');
    if (!trackingCol || !statusCol) {
      console.warn('[订单同步] 未找到运单号或订单状态列');
      return [];
    }

    const collected = new Map(); // trackingNo → statusText
    const step = 200;
    let stableRounds = 0;
    let lastTop = -1;

    // 先回到顶部
    wrapper.scrollTop = 0;
    await sleep(300);

    // 收集当前可见行
    const grab = () => {
      const rows = wrapper.querySelectorAll('.el-table__row');
      rows.forEach(row => {
        const trackingCell = row.querySelector(`td.${trackingCol}`);
        const trackingNo = (trackingCell?.querySelector('.copy .high-line')?.textContent || '').trim();
        if (!trackingNo) return;
        const statusCell = row.querySelector(`td.${statusCol}`);
        const statusText = (statusCell?.querySelector('.high-line')?.textContent || '').trim();
        if (!collected.has(trackingNo)) {
          collected.set(trackingNo, statusText);
        }
      });
    };

    grab(); // 抓第一屏

    while (stableRounds < 5) {
      wrapper.scrollTop += step;
      await sleep(150);
      if (wrapper.scrollTop === lastTop) {
        stableRounds++;
      } else {
        stableRounds = 0;
        lastTop = wrapper.scrollTop;
      }
      grab();
    }

    // 滚回顶部
    wrapper.scrollTop = 0;
    await sleep(200);

    console.log(`[订单同步] 滚动收集完成，共 ${collected.size} 条唯一运单`);
    return collected;
  }

  /** 收集跟踪号：滚动表格，收集 YT运单号 → 跟踪号 的映射 */
  async function scrollAndCollectTracking() {
    const wrapper = document.querySelector('.el-table__body-wrapper');
    if (!wrapper) return new Map();
    const trackingCol = findColumnClass('运单号');
    const localTrackingCol = findColumnClass('跟踪号');
    const statusCol = findColumnClass('订单状态');
    if (!trackingCol || !localTrackingCol || !statusCol) {
      console.warn('[跟踪号同步] 未找到运单号、跟踪号或订单状态列');
      return new Map();
    }

    const collected = new Map(); // trackingNo → { localTracking, status }
    const step = 200;
    let stableRounds = 0;
    let lastTop = -1;

    wrapper.scrollTop = 0;
    await sleep(300);

    const grab = () => {
      const rows = wrapper.querySelectorAll('.el-table__row');
      rows.forEach(row => {
        const trackingCell = row.querySelector(`td.${trackingCol}`);
        const trackingNo = (trackingCell?.querySelector('.copy .high-line')?.textContent || '').trim();
        if (!trackingNo || !/^YT\w+/i.test(trackingNo)) return;

        const localTrackingCell = row.querySelector(`td.${localTrackingCol}`);
        const localTracking = (localTrackingCell?.querySelector('.high-line')?.textContent || localTrackingCell?.textContent || '').trim();

        const statusCell = row.querySelector(`td.${statusCol}`);
        const statusText = (statusCell?.querySelector('.high-line')?.textContent || '').trim();

        // 只收集有效的跟踪号（排除"-"和空值）
        if (!collected.has(trackingNo) && localTracking && localTracking !== '-') {
          collected.set(trackingNo, { localTracking, status: statusText });
        }
      });
    };

    grab();

    while (stableRounds < 5) {
      wrapper.scrollTop += step;
      await sleep(150);
      if (wrapper.scrollTop === lastTop) {
        stableRounds++;
      } else {
        stableRounds = 0;
        lastTop = wrapper.scrollTop;
      }
      grab();
    }

    wrapper.scrollTop = 0;
    await sleep(200);

    console.log(`[跟踪号同步] 滚动收集完成，共 ${collected.size} 条有跟踪号的运单`);
    return collected;
  }

  // 同步引擎

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /** 获取当前页码和总页数 */
  function getPageInfo() {
    const pager = document.querySelector('.el-pagination');
    if (!pager) return { current: 1, total: 1 };
    const pages = pager.querySelectorAll('.el-pager .number');
    const active = pager.querySelector('.el-pager .number.active');
    const current = active ? parseInt(active.textContent) : 1;
    const last = pages.length > 0 ? parseInt(pages[pages.length - 1].textContent) : 1;
    return { current, total: last };
  }

  /** 点击下一页并等待表格刷新 */
  async function goNextPage() {
    const nextBtn = document.querySelector('.el-pagination .btn-next');
    if (!nextBtn || nextBtn.disabled) return false;
    const oldFirst = document.querySelector('.el-table__body-wrapper .el-table__row');
    nextBtn.click();
    // 等待表格内容变化（最多 5 秒）
    for (let i = 0; i < 50; i++) {
      await sleep(100);
      const newFirst = document.querySelector('.el-table__body-wrapper .el-table__row');
      if (newFirst !== oldFirst) return true;
    }
    return true;
  }

  async function runSync() {
    if (!credentialsValid()) { showSettings(); return; }

    stopRequested = false;
    showProgressPanel();
    const { total: totalPages } = getPageInfo();
    let shippedSynced = 0, receivedSynced = 0, skipped = 0, failed = 0;

    // 阶段1：同步订单状态
    let pageNum = 1;
    while (true) {
      if (stopRequested) {
        updateProgress(`已停止 | 发货 ${shippedSynced} | 收货 ${receivedSynced} | 跳过 ${skipped} | 失败 ${failed}`, pageNum, totalPages);
        return;
      }

      updateProgress(`[状态同步] 第 ${pageNum}/${totalPages} 页: 正在滚动收集...`, pageNum, totalPages);
      const collected = await scrollAndCollect();

      // 分类订单
      const shippedItems = [];
      const receivedItems = [];
      const statusCounts = {};
      for (const [trackingNo, statusText] of collected) {
        statusCounts[statusText] = (statusCounts[statusText] || 0) + 1;
        if (/^YT\w+/i.test(trackingNo)) {
          if (isShipped(statusText)) {
            shippedItems.push(trackingNo);
          } else if (isReceived(statusText)) {
            receivedItems.push(trackingNo);
          }
        }
      }
      console.log(`[订单同步] 第 ${pageNum} 页状态统计:`, JSON.stringify(statusCounts));
      updateProgress(
        `[状态同步] 第 ${pageNum}/${totalPages} 页: 已发货 ${shippedItems.length} | 已收货 ${receivedItems.length} | 累计: 发货 ${shippedSynced} 收货 ${receivedSynced}`,
        pageNum, totalPages
      );

      // 处理已发货订单
      for (let i = 0; i < shippedItems.length; i++) {
        if (stopRequested) {
          updateProgress(`已停止 | 发货 ${shippedSynced} | 收货 ${receivedSynced} | 跳过 ${skipped} | 失败 ${failed}`, pageNum, totalPages);
          return;
        }

        const trackingNo = shippedItems[i];
        try {
          const result = await searchRecordAllTables(trackingNo, STATUS_SHIPPED);
          if (!result) {
            skipped++;
          } else {
            await updateRecord(result.app_token, result.table_id, result.record.record_id, STATUS_SHIPPED);
            shippedSynced++;
            console.log(`[订单同步] ${trackingNo}: 已更新 ${result.tableName} → 已发货`);
          }
        } catch (err) {
          console.error(`[订单同步] ${trackingNo} 失败:`, err);
          failed++;
        }
        updateProgress(
          `[状态同步] 第 ${pageNum}/${totalPages} 页 | 发货 ${shippedSynced} | 收货 ${receivedSynced} | 跳过 ${skipped} | 失败 ${failed}`,
          pageNum, totalPages,
        );
        if (i < shippedItems.length - 1 || receivedItems.length > 0) await sleep(SYNC_DELAY);
      }

      // 处理已收货订单
      for (let i = 0; i < receivedItems.length; i++) {
        if (stopRequested) {
          updateProgress(`已停止 | 发货 ${shippedSynced} | 收货 ${receivedSynced} | 跳过 ${skipped} | 失败 ${failed}`, pageNum, totalPages);
          return;
        }

        const trackingNo = receivedItems[i];
        try {
          const result = await searchRecordAllTables(trackingNo, STATUS_RECEIVED);
          if (!result) {
            skipped++;
          } else {
            await updateRecord(result.app_token, result.table_id, result.record.record_id, STATUS_RECEIVED);
            receivedSynced++;
            console.log(`[订单同步] ${trackingNo}: 已更新 ${result.tableName} → 已收货`);
          }
        } catch (err) {
          console.error(`[订单同步] ${trackingNo} 失败:`, err);
          failed++;
        }
        updateProgress(
          `[状态同步] 第 ${pageNum}/${totalPages} 页 | 发货 ${shippedSynced} | 收货 ${receivedSynced} | 跳过 ${skipped} | 失败 ${failed}`,
          pageNum, totalPages,
        );
        if (i < receivedItems.length - 1) await sleep(SYNC_DELAY);
      }

      // 尝试翻到下一页
      const { current } = getPageInfo();
      if (current >= totalPages) break;
      const moved = await goNextPage();
      if (!moved) break;
      pageNum++;
      await sleep(500);
    }

    updateProgress(
      `[状态同步完成] 共 ${totalPages} 页 | 发货 ${shippedSynced} | 收货 ${receivedSynced} | 跳过 ${skipped} | 失败 ${failed}`,
      totalPages, totalPages,
    );

    // 阶段2：同步跟踪号
    if (stopRequested) return;

    console.log('[订单同步] 状态同步完成，开始同步跟踪号...');
    await sleep(1000);

    // 回到第一页
    const firstPageBtn = document.querySelector('.el-pagination .number');
    if (firstPageBtn) {
      firstPageBtn.click();
      await sleep(1000);
    }

    await runTrackingSyncInternal();
  }

  /** 跟踪号同步内部逻辑（供 runSync 和 runTrackingSync 调用） */
  async function runTrackingSyncInternal() {
    const { total: totalPages } = getPageInfo();
    let synced = 0, skipped = 0, failed = 0;

    let pageNum = 1;
    while (true) {
      if (stopRequested) {
        updateProgress(`[跟踪号同步] 已停止 | 成功 ${synced} | 跳过 ${skipped} | 失败 ${failed}`, pageNum, totalPages);
        return;
      }

      updateProgress(`[跟踪号同步] 第 ${pageNum}/${totalPages} 页: 正在收集跟踪号...`, pageNum, totalPages);
      const collected = await scrollAndCollectTracking();

      console.log(`[跟踪号同步] 第 ${pageNum} 页: 找到 ${collected.size} 条有跟踪号的运单`);
      updateProgress(`[跟踪号同步] 第 ${pageNum}/${totalPages} 页: 找到 ${collected.size} 条 | 累计成功 ${synced}`, pageNum, totalPages);

      let idx = 0;
      for (const [trackingNo, info] of collected) {
        if (stopRequested) {
          updateProgress(`[跟踪号同步] 已停止 | 成功 ${synced} | 跳过 ${skipped} | 失败 ${failed}`, pageNum, totalPages);
          return;
        }

        idx++;
        try {
          // 在飞书中查找该运单号
          await ensureToken();
          let found = false;
          for (const tbl of FEISHU_TABLES) {
            const url = `${FEISHU_BASE}/bitable/v1/apps/${tbl.app_token}/tables/${tbl.table_id}/records/search`;
            const body = {
              page_size: 1,
              filter: { conjunction: 'and', conditions: [
                { field_name: FIELD_TRACKING, operator: 'is', value: [trackingNo] },
              ]},
            };
            const data = await gmFetch('POST', url, body);
            if (data.code !== 0) continue;
            const items = data.data?.items || [];
            if (items.length === 0) continue;

            const record = items[0];
            let currentStatus = record.fields?.[FIELD_STATUS] || '';
            const currentLocalTracking = record.fields?.[FIELD_LOCAL_TRACKING] || '';

            // 如果状态是对象（选项类型），提取文本值
            if (typeof currentStatus === 'object' && currentStatus !== null) {
              currentStatus = currentStatus.text || currentStatus.name || '';
            }

            // 如果状态包含「回传」，不修改
            if (currentStatus.includes('回传')) {
              console.log(`[跟踪号同步] ${trackingNo}: 跳过（状态包含「回传」）`);
              skipped++;
              found = true;
              break;
            }

            // 检查状态：只处理空白、已预报、已发货、已收货
            const allowedStatuses = ['', '已预报', STATUS_SHIPPED, STATUS_RECEIVED];
            if (!allowedStatuses.includes(currentStatus)) {
              console.log(`[跟踪号同步] ${trackingNo}: 跳过（状态=${currentStatus}）`);
              skipped++;
              found = true;
              break;
            }

            // 如果云途的跟踪号无效（空或"-"），跳过
            if (!info.localTracking || info.localTracking === '-') {
              console.log(`[跟踪号同步] ${trackingNo}: 跳过（无有效跟踪号）`);
              skipped++;
              found = true;
              break;
            }

            // 如果已有跟踪号且相同，跳过
            if (currentLocalTracking === info.localTracking) {
              console.log(`[跟踪号同步] ${trackingNo}: 跳过（跟踪号已存在）`);
              skipped++;
              found = true;
              break;
            }

            // 更新跟踪号
            await updateLocalTracking(tbl.app_token, tbl.table_id, record.record_id, info.localTracking);
            synced++;
            console.log(`[跟踪号同步] ${trackingNo}: 已更新 ${tbl.name} → ${info.localTracking}`);
            found = true;
            break;
          }

          if (!found) {
            console.log(`[跟踪号同步] ${trackingNo}: 所有表均未找到`);
            skipped++;
          }
        } catch (err) {
          console.error(`[跟踪号同步] ${trackingNo} 失败:`, err);
          failed++;
        }

        updateProgress(
          `[跟踪号同步] 第 ${pageNum}/${totalPages} 页 ${idx}/${collected.size} | 成功 ${synced} | 跳过 ${skipped} | 失败 ${failed}`,
          pageNum, totalPages,
        );
        if (idx < collected.size) await sleep(SYNC_DELAY);
      }

      // 尝试翻到下一页
      const { current } = getPageInfo();
      if (current >= totalPages) break;
      const moved = await goNextPage();
      if (!moved) break;
      pageNum++;
      await sleep(500);
    }

    updateProgress(
      `[跟踪号同步完成] 共 ${totalPages} 页 | 成功 ${synced} | 跳过 ${skipped} | 失败 ${failed}`,
      totalPages, totalPages,
    );
  }

  /** 独立的跟踪号同步入口（供绿色按钮调用） */
  async function runTrackingSync() {
    if (!credentialsValid()) { showSettings(); return; }

    stopRequested = false;
    showProgressPanel();
    await runTrackingSyncInternal();
  }

  // UI

  let progressPanel = null, progressBar = null, progressText = null;

  function showProgressPanel() {
    if (progressPanel) { progressPanel.style.display = 'block'; return; }
    progressPanel = document.createElement('div');
    progressPanel.innerHTML = `
      <div style="font-weight:bold;margin-bottom:6px;">订单同步进度</div>
      <div id="ye-ship-text" style="font-size:13px;margin-bottom:4px;">准备中...</div>
      <div style="background:#e9ecef;border-radius:4px;overflow:hidden;height:8px;">
        <div id="ye-ship-bar" style="height:100%;width:0%;background:#1677ff;transition:width .3s;"></div>
      </div>
    `;
    Object.assign(progressPanel.style, {
      position: 'fixed', top: '16px', right: '16px', zIndex: '99999',
      background: '#fff', border: '1px solid #ccc', borderRadius: '8px',
      padding: '12px 16px', width: '280px', boxShadow: '0 2px 12px rgba(0,0,0,.15)',
      fontFamily: 'system-ui, sans-serif',
    });
    document.body.appendChild(progressPanel);
    progressBar = progressPanel.querySelector('#ye-ship-bar');
    progressText = progressPanel.querySelector('#ye-ship-text');
  }

  function updateProgress(msg, current, total) {
    showProgressPanel();
    progressText.textContent = msg;
    progressBar.style.width = total > 0 ? `${(current / total * 100).toFixed(1)}%` : '0%';
  }

  function createShipButton() {
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'fixed', bottom: '24px', right: '24px', zIndex: '99998',
      display: 'flex', gap: '8px', fontFamily: 'system-ui, sans-serif',
    });

    const btn = document.createElement('button');
    btn.textContent = '同步订单';
    Object.assign(btn.style, {
      padding: '10px 20px', background: '#1677ff', color: '#fff', border: 'none',
      borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(22,119,255,.4)',
    });
    btn.addEventListener('mouseenter', () => { btn.style.background = '#4096ff'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#1677ff'; });
    btn.addEventListener('click', () => {
      btn.disabled = true; btn.textContent = '同步中...';
      stopBtn.disabled = false;
      trackingBtn.disabled = true;
      runSync().finally(() => {
        btn.disabled = false;
        btn.textContent = '同步订单';
        stopBtn.disabled = true;
        trackingBtn.disabled = false;
      });
    });

    const stopBtn = document.createElement('button');
    stopBtn.textContent = '停止';
    stopBtn.disabled = true;
    Object.assign(stopBtn.style, {
      padding: '10px 20px', background: '#f44336', color: '#fff', border: 'none',
      borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(244,67,54,.4)',
    });
    stopBtn.addEventListener('mouseenter', () => { if (!stopBtn.disabled) stopBtn.style.background = '#e53935'; });
    stopBtn.addEventListener('mouseleave', () => { if (!stopBtn.disabled) stopBtn.style.background = '#f44336'; });
    stopBtn.addEventListener('click', () => {
      stopRequested = true;
      stopBtn.disabled = true;
      stopBtn.textContent = '已停止';
    });

    const trackingBtn = document.createElement('button');
    trackingBtn.textContent = '同步跟踪号';
    Object.assign(trackingBtn.style, {
      padding: '10px 20px', background: '#52c41a', color: '#fff', border: 'none',
      borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(82,196,26,.4)',
    });
    trackingBtn.addEventListener('mouseenter', () => { trackingBtn.style.background = '#73d13d'; });
    trackingBtn.addEventListener('mouseleave', () => { trackingBtn.style.background = '#52c41a'; });
    trackingBtn.addEventListener('click', () => {
      trackingBtn.disabled = true; trackingBtn.textContent = '同步中...';
      btn.disabled = true;
      stopBtn.disabled = false;
      runTrackingSync().finally(() => {
        trackingBtn.disabled = false;
        trackingBtn.textContent = '同步跟踪号';
        btn.disabled = false;
        stopBtn.disabled = true;
      });
    });

    container.appendChild(btn);
    container.appendChild(stopBtn);
    container.appendChild(trackingBtn);
    document.body.appendChild(container);
  }

  function showSettings() {
    const existing = document.getElementById('ye-ship-settings');
    if (existing) { existing.style.display = 'block'; return; }
    const fields = [
      { key: 'feishu_app_id', label: 'App ID' },
      { key: 'feishu_app_secret', label: 'App Secret' },
    ];
    const panel = document.createElement('div');
    panel.id = 'ye-ship-settings';
    panel.innerHTML = `
      <div style="font-weight:bold;margin-bottom:10px;">飞书凭据设置</div>
      ${fields.map(f => `
        <label style="display:block;font-size:12px;margin-bottom:2px;">${f.label}</label>
        <input data-key="${f.key}" value="${GM_getValue(f.key, '')}"
          style="width:100%;padding:4px 6px;margin-bottom:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;font-size:13px;" />
      `).join('')}
      <div style="text-align:right;margin-top:4px;">
        <button id="ye-ship-save" style="padding:4px 14px;background:#ff9800;color:#fff;border:none;border-radius:4px;cursor:pointer;">保存</button>
        <button id="ye-ship-close" style="padding:4px 14px;margin-left:6px;border:1px solid #ccc;border-radius:4px;cursor:pointer;background:#fff;">关闭</button>
      </div>
    `;
    Object.assign(panel.style, {
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      zIndex: '100000', background: '#fff', border: '1px solid #ccc', borderRadius: '8px',
      padding: '16px 20px', width: '340px', boxShadow: '0 4px 20px rgba(0,0,0,.2)',
      fontFamily: 'system-ui, sans-serif',
    });
    document.body.appendChild(panel);
    panel.querySelector('#ye-ship-save').addEventListener('click', () => {
      panel.querySelectorAll('input[data-key]').forEach(input => {
        GM_setValue(input.dataset.key, input.value.trim());
      });
      panel.style.display = 'none';
      _token = ''; _tokenExpires = 0;
    });
    panel.querySelector('#ye-ship-close').addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }

  createShipButton();

})();
