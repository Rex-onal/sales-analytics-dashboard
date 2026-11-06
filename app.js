/**
 * SalesPulse Analytics Dashboard
 * Vanilla JavaScript implementation
 * Features:
 * - LocalStorage persistence for transactions and monthly targets
 * - Interactive Retina HTML5 Canvas charts (Line/Area, Donut, Horizontal Bar)
 * - Quota Tracker & Real-Time Intelligence Strip
 * - Live Cross-Filtering (Chart Legend, Channels, Search, Status, Custom Date Range)
 * - Full CRUD: Add, Edit, and Delete transactions
 * - Client-side CSV Export and CSV Import
 * - Multi-column sorting and client pagination
 * - Zero external dependencies, pure vanilla JS
 */

(function () {
  'use strict';

  // --- Storage Keys & Settings ---
  const STORAGE_KEY = 'salespulse_v1_transactions';
  const TARGET_STORAGE_KEY = 'salespulse_v1_target';
  const ITEMS_PER_PAGE = 8;

  const CATEGORY_COLORS = {
    'Software & SaaS': '#4f46e5',
    'Cloud Services': '#06b6d4',
    'Hardware': '#10b981',
    'Consulting': '#f59e0b',
    'Support & Maintenance': '#8b5cf6'
  };

  const CHANNEL_COLORS = {
    'Website Direct': '#3b82f6',
    'Enterprise Sales': '#6366f1',
    'Partner Referrals': '#10b981',
    'Inbound Marketing': '#ec4899'
  };

  // --- Application State ---
  let state = {
    transactions: [],
    monthlyTarget: 60000,
    timeframe: '30d', // '7d', '30d', '90d', 'all', 'custom'
    customStart: '',
    customEnd: '',
    chartMetric: 'revenue', // 'revenue' or 'count'
    searchQuery: '',
    categoryFilter: 'all',
    channelFilter: 'all',
    statusFilter: 'all',
    sortColumn: 'date',
    sortDirection: 'desc', // 'asc' or 'desc'
    currentPage: 1
  };

  // --- Helper Date Utilities ---
  function getTodayString(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  }

  // --- Sample Dataset Seeding ---
  function generateDefaultSampleData() {
    return [
      { id: 'ORD-7291', customer: 'Acme Global Corp', product: 'Enterprise Cloud Suite', category: 'Cloud Services', channel: 'Enterprise Sales', date: getTodayString(0), status: 'Completed', amount: 4850.00 },
      { id: 'ORD-7290', customer: 'Nexus Dynamics', product: 'DevOps Platform Annual', category: 'Software & SaaS', channel: 'Website Direct', date: getTodayString(1), status: 'Completed', amount: 2400.00 },
      { id: 'ORD-7289', customer: 'Vanguard Logistics', product: 'Edge Server Node X8', category: 'Hardware', channel: 'Partner Referrals', date: getTodayString(1), status: 'Completed', amount: 6200.00 },
      { id: 'ORD-7288', customer: 'Starlight Media', product: 'Cloud Migration Consulting', category: 'Consulting', channel: 'Enterprise Sales', date: getTodayString(2), status: 'Completed', amount: 3500.00 },
      { id: 'ORD-7287', customer: 'BioHealth Labs', product: '24/7 Dedicated Support', category: 'Support & Maintenance', channel: 'Website Direct', date: getTodayString(3), status: 'Pending', amount: 1250.00 },
      { id: 'ORD-7286', customer: 'Fintech Spark', product: 'Enterprise Cloud Suite', category: 'Cloud Services', channel: 'Enterprise Sales', date: getTodayString(4), status: 'Completed', amount: 4850.00 },
      { id: 'ORD-7285', customer: 'Urban Retailers', product: 'Omnichannel POS Terminal', category: 'Hardware', channel: 'Partner Referrals', date: getTodayString(5), status: 'Completed', amount: 1890.00 },
      { id: 'ORD-7284', customer: 'Atlas Robotics', product: 'DevOps Platform Annual', category: 'Software & SaaS', channel: 'Website Direct', date: getTodayString(6), status: 'Completed', amount: 2400.00 },
      { id: 'ORD-7283', customer: 'Nova Interactive', product: 'Security Audit & Compliance', category: 'Consulting', channel: 'Inbound Marketing', date: getTodayString(7), status: 'Refunded', amount: 2800.00 },
      { id: 'ORD-7282', customer: 'Helix Therapeutics', product: 'Managed Kubernetes Cluster', category: 'Cloud Services', channel: 'Enterprise Sales', date: getTodayString(8), status: 'Completed', amount: 5600.00 },
      { id: 'ORD-7281', customer: 'Apex Data Works', product: 'DevOps Platform Annual', category: 'Software & SaaS', channel: 'Website Direct', date: getTodayString(9), status: 'Completed', amount: 2400.00 },
      { id: 'ORD-7280', customer: 'Summit Financial', product: 'Edge Server Node X8', category: 'Hardware', channel: 'Partner Referrals', date: getTodayString(11), status: 'Completed', amount: 6200.00 },
      { id: 'ORD-7279', customer: 'Hyperion Energy', product: 'Enterprise Cloud Suite', category: 'Cloud Services', channel: 'Enterprise Sales', date: getTodayString(12), status: 'Completed', amount: 4850.00 },
      { id: 'ORD-7278', customer: 'Krypton Labs', product: 'System Optimization Sprint', category: 'Consulting', channel: 'Inbound Marketing', date: getTodayString(14), status: 'Completed', amount: 3100.00 },
      { id: 'ORD-7277', customer: 'Quantum Wave', product: '24/7 Dedicated Support', category: 'Support & Maintenance', channel: 'Website Direct', date: getTodayString(15), status: 'Completed', amount: 1250.00 },
      { id: 'ORD-7276', customer: 'Beacon Architecture', product: 'Enterprise Cloud Suite', category: 'Cloud Services', channel: 'Partner Referrals', date: getTodayString(17), status: 'Completed', amount: 4850.00 },
      { id: 'ORD-7275', customer: 'Pinnacle Capital', product: 'Edge Server Node X8', category: 'Hardware', channel: 'Enterprise Sales', date: getTodayString(18), status: 'Pending', amount: 6200.00 },
      { id: 'ORD-7274', customer: 'Terra Green Corp', product: 'DevOps Platform Annual', category: 'Software & SaaS', channel: 'Inbound Marketing', date: getTodayString(20), status: 'Completed', amount: 2400.00 },
      { id: 'ORD-7273', customer: 'Synergy Holdings', product: 'Cloud Migration Consulting', category: 'Consulting', channel: 'Enterprise Sales', date: getTodayString(22), status: 'Completed', amount: 4200.00 },
      { id: 'ORD-7272', customer: 'Mirage Software', product: 'DevOps Platform Annual', category: 'Software & SaaS', channel: 'Website Direct', date: getTodayString(24), status: 'Completed', amount: 2400.00 },
      { id: 'ORD-7271', customer: 'Vortex Automation', product: 'Omnichannel POS Terminal', category: 'Hardware', channel: 'Partner Referrals', date: getTodayString(25), status: 'Refunded', amount: 1890.00 },
      { id: 'ORD-7270', customer: 'Zenith Health Systems', product: 'Managed Kubernetes Cluster', category: 'Cloud Services', channel: 'Enterprise Sales', date: getTodayString(27), status: 'Completed', amount: 5600.00 },
      { id: 'ORD-7269', customer: 'Solomon Capital', product: 'Enterprise Cloud Suite', category: 'Cloud Services', channel: 'Website Direct', date: getTodayString(29), status: 'Completed', amount: 4850.00 },
      { id: 'ORD-7268', customer: 'Delta Logix', product: '24/7 Dedicated Support', category: 'Support & Maintenance', channel: 'Website Direct', date: getTodayString(33), status: 'Completed', amount: 1250.00 },
      { id: 'ORD-7267', customer: 'Cobalt Industries', product: 'Edge Server Node X8', category: 'Hardware', channel: 'Partner Referrals', date: getTodayString(42), status: 'Completed', amount: 6200.00 },
      { id: 'ORD-7266', customer: 'BlueShift AI', product: 'DevOps Platform Annual', category: 'Software & SaaS', channel: 'Inbound Marketing', date: getTodayString(55), status: 'Completed', amount: 2400.00 },
      { id: 'ORD-7265', customer: 'Evergreen Media', product: 'Cloud Migration Consulting', category: 'Consulting', channel: 'Enterprise Sales', date: getTodayString(70), status: 'Completed', amount: 3900.00 },
      { id: 'ORD-7264', customer: 'AeroTech Dynamics', product: 'Enterprise Cloud Suite', category: 'Cloud Services', channel: 'Enterprise Sales', date: getTodayString(85), status: 'Completed', amount: 4850.00 }
    ];
  }

  // --- Storage Management ---
  function loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        state.transactions = JSON.parse(stored);
      } else {
        state.transactions = generateDefaultSampleData();
        saveData();
      }

      const storedTarget = localStorage.getItem(TARGET_STORAGE_KEY);
      if (storedTarget) {
        state.monthlyTarget = Number(storedTarget) || 60000;
      }
    } catch (e) {
      console.warn('LocalStorage access failed, using in-memory state.', e);
      state.transactions = generateDefaultSampleData();
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
    } catch (e) {
      console.error('Error saving data to LocalStorage:', e);
      showToast('Storage error: unable to persist changes', 'danger');
    }
  }

  function saveTarget() {
    try {
      localStorage.setItem(TARGET_STORAGE_KEY, state.monthlyTarget.toString());
    } catch (e) {
      console.error('Error saving target to LocalStorage:', e);
    }
  }

  // --- Timeframe Filter Helper ---
  function getFilteredByTimeframe(list) {
    if (state.timeframe === 'all') return list;

    if (state.timeframe === 'custom') {
      return list.filter(item => {
        let match = true;
        if (state.customStart && item.date < state.customStart) match = false;
        if (state.customEnd && item.date > state.customEnd) match = false;
        return match;
      });
    }

    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const maxDays = daysMap[state.timeframe] || 30;
    const cutoffStr = getTodayString(maxDays);

    return list.filter(item => item.date >= cutoffStr);
  }

  // --- KPI Calculation and UI Updates ---
  function updateKPIs() {
    const timeframeData = getFilteredByTimeframe(state.transactions);
    
    // Total Revenue (only Completed transactions count towards collected gross revenue)
    const completedItems = timeframeData.filter(item => item.status === 'Completed');
    const totalRevenue = completedItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const completedCount = completedItems.length;
    const aov = completedCount > 0 ? totalRevenue / completedCount : 0;

    // Refunds and Collection status
    const refundedItems = timeframeData.filter(item => item.status === 'Refunded');
    const refundTotal = refundedItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalTransactions = timeframeData.length;
    const collectionRate = totalTransactions > 0 
      ? ((completedCount / totalTransactions) * 100).toFixed(1) 
      : '100.0';

    // Mock realistic conversion estimation based on visitor volume scaling
    const estimatedVisitors = completedCount * 28 + 140;
    const conversionRate = estimatedVisitors > 0 
      ? ((completedCount / estimatedVisitors) * 100).toFixed(2) 
      : '0.00';

    // DOM Updates
    const revEl = document.getElementById('kpi-revenue');
    const ordersEl = document.getElementById('kpi-orders');
    const aovEl = document.getElementById('kpi-aov');
    const convEl = document.getElementById('kpi-conversion');
    const collEl = document.getElementById('kpi-collection');
    const refundAmountEl = document.getElementById('kpi-refund-amount');
    const refundBadgeEl = document.getElementById('kpi-refund-badge');

    if (revEl) revEl.textContent = formatCurrency(totalRevenue);
    if (ordersEl) ordersEl.textContent = completedCount.toLocaleString();
    if (aovEl) aovEl.textContent = formatCurrency(aov);
    if (convEl) convEl.textContent = `${conversionRate}%`;
    if (collEl) collEl.textContent = `${collectionRate}%`;
    if (refundAmountEl) refundAmountEl.textContent = `${formatCurrency(refundTotal)} refunded`;

    if (refundBadgeEl) {
      if (refundedItems.length === 0) {
        refundBadgeEl.className = 'badge badge-positive';
        refundBadgeEl.textContent = 'Zero Refunds';
      } else if (refundedItems.length <= 2) {
        refundBadgeEl.className = 'badge badge-positive';
        refundBadgeEl.textContent = 'Low Refunds';
      } else {
        refundBadgeEl.className = 'badge badge-negative';
        refundBadgeEl.textContent = `${refundedItems.length} Refunds`;
      }
    }

    updateTargetAndInsights(timeframeData);
  }

  // --- Quota Tracker & Quick Intelligence Updates ---
  function updateTargetAndInsights(timeframeData) {
    // Current month revenue
    const currentYearMonth = getTodayString(0).substring(0, 7);
    const currentMonthRevenue = state.transactions
      .filter(t => t.status === 'Completed' && (t.date && t.date.startsWith(currentYearMonth)))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const target = state.monthlyTarget || 60000;
    const quotaPct = Math.min(Math.round((currentMonthRevenue / target) * 100), 100);

    const quotaTargetText = document.getElementById('quota-target-text');
    const quotaBarFill = document.getElementById('quota-bar-fill');
    const quotaStatusText = document.getElementById('quota-status-text');
    const quotaPctText = document.getElementById('quota-pct-text');

    if (quotaTargetText) quotaTargetText.textContent = `Goal: ${formatCurrency(target)}`;
    if (quotaBarFill) quotaBarFill.style.width = `${quotaPct}%`;
    if (quotaPctText) quotaPctText.textContent = `${quotaPct}%`;
    if (quotaStatusText) {
      if (currentMonthRevenue >= target) {
        quotaStatusText.textContent = `🎉 Goal reached! (${formatCurrency(currentMonthRevenue)})`;
        quotaStatusText.style.color = '#34d399';
      } else {
        const remaining = target - currentMonthRevenue;
        quotaStatusText.textContent = `${formatCurrency(currentMonthRevenue)} collected (${formatCurrency(remaining)} to go)`;
        quotaStatusText.style.color = '#9ca3af';
      }
    }

    // Quick Intelligence: Top Account
    const customerSpend = {};
    timeframeData.forEach(t => {
      if (t.status === 'Completed') {
        customerSpend[t.customer] = (customerSpend[t.customer] || 0) + Number(t.amount || 0);
      }
    });

    let topCustomer = '—';
    let maxSpend = 0;
    Object.entries(customerSpend).forEach(([cust, spend]) => {
      if (spend > maxSpend) {
        maxSpend = spend;
        topCustomer = cust;
      }
    });

    const intelCust = document.getElementById('intel-top-customer');
    const intelCustAmt = document.getElementById('intel-top-customer-amount');
    if (intelCust) intelCust.textContent = topCustomer;
    if (intelCustAmt) intelCustAmt.textContent = maxSpend > 0 ? `${formatCurrency(maxSpend)} total spend` : 'No transactions';

    // Quick Intelligence: Peak Sales Day
    const dayTotals = {};
    timeframeData.forEach(t => {
      if (t.status === 'Completed') {
        dayTotals[t.date] = (dayTotals[t.date] || 0) + Number(t.amount || 0);
      }
    });

    let peakDay = '—';
    let peakAmt = 0;
    Object.entries(dayTotals).forEach(([day, amt]) => {
      if (amt > peakAmt) {
        peakAmt = amt;
        peakDay = day;
      }
    });

    const intelPeak = document.getElementById('intel-peak-day');
    const intelPeakAmt = document.getElementById('intel-peak-amount');
    if (intelPeak) intelPeak.textContent = peakDay !== '—' ? formatDateDisplay(peakDay) : '—';
    if (intelPeakAmt) intelPeakAmt.textContent = peakAmt > 0 ? `${formatCurrency(peakAmt)} collected` : 'No volume';

    // Quick Intelligence: Leading Channel
    const channelTotals = {};
    let totalChannelRev = 0;
    timeframeData.forEach(t => {
      if (t.status === 'Completed') {
        const ch = t.channel || 'Website Direct';
        channelTotals[ch] = (channelTotals[ch] || 0) + Number(t.amount || 0);
        totalChannelRev += Number(t.amount || 0);
      }
    });

    let leadingChannel = '—';
    let leadingAmt = 0;
    Object.entries(channelTotals).forEach(([ch, amt]) => {
      if (amt > leadingAmt) {
        leadingAmt = amt;
        leadingChannel = ch;
      }
    });

    const leadingShare = totalChannelRev > 0 ? Math.round((leadingAmt / totalChannelRev) * 100) : 0;
    const intelChannel = document.getElementById('intel-top-channel');
    const intelChannelShare = document.getElementById('intel-top-channel-share');
    if (intelChannel) intelChannel.textContent = leadingChannel;
    if (intelChannelShare) intelChannelShare.textContent = totalChannelRev > 0 ? `${leadingShare}% of total volume` : '0% volume';
  }

  // --- Canvas Retina Resolution Setup ---
  function setupCanvas(canvas) {
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = Math.max(rect.width * dpr, 100);
    canvas.height = Math.max(rect.height * dpr, 100);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  }

  // --- Chart 1: Revenue Line / Area Chart ---
  let activeHoverPoint = null;

  function renderRevenueLineChart() {
    const canvas = document.getElementById('revenueLineChart');
    if (!canvas) return;
    const res = setupCanvas(canvas);
    if (!res) return;
    const { ctx, width, height } = res;

    ctx.clearRect(0, 0, width, height);

    const timeframeData = getFilteredByTimeframe(state.transactions);
    const dateMap = {};

    let daysToInclude = 30;
    if (state.timeframe === '7d') daysToInclude = 7;
    else if (state.timeframe === '90d') daysToInclude = 90;
    else if (state.timeframe === 'all') daysToInclude = 120;
    else if (state.timeframe === 'custom' && state.customStart && state.customEnd) {
      const d1 = new Date(state.customStart);
      const d2 = new Date(state.customEnd);
      daysToInclude = Math.max(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1, 3);
    }

    for (let i = daysToInclude - 1; i >= 0; i--) {
      const dStr = getTodayString(i);
      dateMap[dStr] = { revenue: 0, count: 0 };
    }

    timeframeData.forEach(t => {
      if (t.status === 'Completed' && dateMap[t.date]) {
        dateMap[t.date].revenue += Number(t.amount || 0);
        dateMap[t.date].count += 1;
      }
    });

    const entries = Object.keys(dateMap).sort().map(d => ({
      date: d,
      revenue: dateMap[d].revenue,
      count: dateMap[d].count
    }));

    if (entries.length < 2) return;

    const values = entries.map(e => state.chartMetric === 'revenue' ? e.revenue : e.count);
    const maxValue = Math.max(...values, 10);

    const padLeft = 60;
    const padRight = 24;
    const padTop = 20;
    const padBottom = 34;

    const graphWidth = width - padLeft - padRight;
    const graphHeight = height - padTop - padBottom;

    // Grid lines & labels
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';

    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const yVal = (maxValue / ySteps) * (ySteps - i);
      const yPos = padTop + (graphHeight / ySteps) * i;

      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(width - padRight, yPos);
      ctx.stroke();

      const label = state.chartMetric === 'revenue' 
        ? (yVal >= 1000 ? `$${(yVal / 1000).toFixed(1)}k` : `$${Math.round(yVal)}`)
        : Math.round(yVal).toString();
      ctx.fillText(label, padLeft - 10, yPos + 4);
    }

    const points = entries.map((entry, idx) => {
      const x = padLeft + (idx / (entries.length - 1)) * graphWidth;
      const val = state.chartMetric === 'revenue' ? entry.revenue : entry.count;
      const y = padTop + graphHeight - (val / maxValue) * graphHeight;
      return { x, y, data: entry };
    });

    canvas._chartPoints = points;

    // Gradient fill under path
    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + graphHeight);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.40)');
    gradient.addColorStop(0.7, 'rgba(79, 70, 229, 0.08)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.00)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cx, prev.y, cx, curr.y, curr.x, curr.y);
    }
    ctx.lineTo(points[points.length - 1].x, padTop + graphHeight);
    ctx.lineTo(points[0].x, padTop + graphHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main line stroke
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cx, prev.y, cx, curr.y, curr.x, curr.y);
    }
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // X-axis date markings
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    const xStepInterval = Math.ceil(entries.length / 6);

    for (let i = 0; i < entries.length; i += xStepInterval) {
      const pt = points[i];
      const parts = pt.data.date.split('-');
      const dateText = `${parts[1]}/${parts[2]}`;
      ctx.fillText(dateText, pt.x, height - 10);
    }

    // Points and hover indicator
    points.forEach(pt => {
      const isHovered = activeHoverPoint && activeHoverPoint.data.date === pt.data.date;
      if (isHovered || points.length <= 14) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isHovered ? 6 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#38bdf8' : '#818cf8';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0b0f19';
        ctx.stroke();
      }
    });

    if (activeHoverPoint) {
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 1.5;
      ctx.moveTo(activeHoverPoint.x, padTop);
      ctx.lineTo(activeHoverPoint.x, padTop + graphHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // --- Chart 2: Category Donut Chart ---
  function renderCategoryDonutChart() {
    const canvas = document.getElementById('categoryDonutChart');
    if (!canvas) return;
    const res = setupCanvas(canvas);
    if (!res) return;
    const { ctx, width, height } = res;

    ctx.clearRect(0, 0, width, height);

    const timeframeData = getFilteredByTimeframe(state.transactions);
    const categoryTotals = {};
    let grandTotal = 0;

    Object.keys(CATEGORY_COLORS).forEach(cat => { categoryTotals[cat] = 0; });

    timeframeData.forEach(t => {
      if (t.status === 'Completed') {
        const cat = t.category || 'Software & SaaS';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount || 0);
        grandTotal += Number(t.amount || 0);
      }
    });

    const totalCountEl = document.getElementById('donut-total-count');
    if (totalCountEl) {
      totalCountEl.textContent = formatCurrency(grandTotal);
    }

    // Render interactive legend
    const legendEl = document.getElementById('category-legend');
    if (legendEl) {
      legendEl.innerHTML = '';
      Object.entries(categoryTotals).forEach(([cat, amt]) => {
        const pct = grandTotal > 0 ? ((amt / grandTotal) * 100).toFixed(1) : '0.0';
        const isSelected = state.categoryFilter === cat;

        const item = document.createElement('div');
        item.className = `legend-item interactive ${isSelected ? 'active-filter' : ''}`;
        item.title = `Click to filter by ${cat}`;
        item.innerHTML = `
          <div class="legend-left">
            <span class="legend-color-dot" style="background-color: ${CATEGORY_COLORS[cat] || '#818cf8'}"></span>
            <span class="legend-name">${cat}</span>
          </div>
          <div class="legend-right">
            <span class="legend-amount">${formatCurrency(amt)}</span>
            <span class="legend-pct">${pct}%</span>
          </div>
        `;

        item.addEventListener('click', () => {
          if (state.categoryFilter === cat) {
            state.categoryFilter = 'all';
          } else {
            state.categoryFilter = cat;
          }
          const catSelect = document.getElementById('filter-category');
          if (catSelect) catSelect.value = state.categoryFilter;
          state.currentPage = 1;
          renderCategoryDonutChart();
          renderTable();
          updateActiveFiltersBar();
        });

        legendEl.appendChild(item);
      });
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 8;
    const innerRadius = radius * 0.68;

    if (grandTotal === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      return;
    }

    let startAngle = -Math.PI / 2;

    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt <= 0) return;
      const sliceAngle = (amt / grandTotal) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = CATEGORY_COLORS[cat] || '#6366f1';
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#111827';
      ctx.stroke();

      startAngle = endAngle;
    });
  }

  // --- Chart 3: Channel Distribution Bar Chart ---
  function renderChannelBarChart() {
    const canvas = document.getElementById('channelBarChart');
    if (!canvas) return;
    const res = setupCanvas(canvas);
    if (!res) return;
    const { ctx, width, height } = res;

    ctx.clearRect(0, 0, width, height);

    const timeframeData = getFilteredByTimeframe(state.transactions);
    const channelMap = {};
    Object.keys(CHANNEL_COLORS).forEach(ch => { channelMap[ch] = 0; });

    let channelTotal = 0;
    timeframeData.forEach(t => {
      if (t.status === 'Completed') {
        const ch = t.channel || 'Website Direct';
        channelMap[ch] = (channelMap[ch] || 0) + Number(t.amount || 0);
        channelTotal += Number(t.amount || 0);
      }
    });

    const channels = Object.keys(channelMap);
    const maxVal = Math.max(...Object.values(channelMap), 1000);

    const padLeft = 110;
    const padRight = 50;
    const padTop = 15;
    const padBottom = 20;

    const availableHeight = height - padTop - padBottom;
    const barSpacing = availableHeight / channels.length;
    const barHeight = Math.min(barSpacing * 0.55, 20);

    channels.forEach((ch, idx) => {
      const val = channelMap[ch];
      const y = padTop + idx * barSpacing + (barSpacing - barHeight) / 2;
      const pct = channelTotal > 0 ? (val / channelTotal) * 100 : 0;
      const maxBarWidth = width - padLeft - padRight;
      const barWidth = Math.max((val / maxVal) * maxBarWidth, 4);

      // Label on the left
      ctx.fillStyle = state.channelFilter === ch ? '#ffffff' : '#9ca3af';
      ctx.font = `${state.channelFilter === ch ? '700' : '500'} 12px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, padLeft - 12, y + barHeight / 2);

      // Background track
      ctx.fillStyle = '#1e293b';
      drawRoundedRect(ctx, padLeft, y, maxBarWidth, barHeight, 4);
      ctx.fill();

      // Foreground bar
      ctx.fillStyle = CHANNEL_COLORS[ch] || '#6366f1';
      drawRoundedRect(ctx, padLeft, y, barWidth, barHeight, 4);
      ctx.fill();

      // Value label on the right
      ctx.fillStyle = '#f3f4f6';
      ctx.textAlign = 'left';
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${formatCurrency(val)} (${pct.toFixed(0)}%)`, padLeft + barWidth + 8, y + barHeight / 2);
    });
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // --- Top Products Leaderboard ---
  function updateTopProducts() {
    const container = document.getElementById('top-products-list');
    if (!container) return;

    const timeframeData = getFilteredByTimeframe(state.transactions);
    const productStats = {};

    timeframeData.forEach(t => {
      if (t.status === 'Completed') {
        const prod = t.product || 'Standard Package';
        if (!productStats[prod]) {
          productStats[prod] = { name: prod, category: t.category, revenue: 0, units: 0 };
        }
        productStats[prod].revenue += Number(t.amount || 0);
        productStats[prod].units += 1;
      }
    });

    const sortedProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);

    if (sortedProducts.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: #6b7280; padding: 24px;">
          No completed product sales recorded in this timeframe
        </div>
      `;
      return;
    }

    const maxRev = sortedProducts[0].revenue || 1;

    container.innerHTML = sortedProducts.map((p, index) => {
      const fillPct = Math.min((p.revenue / maxRev) * 100, 100);
      const rankClass = index === 0 ? 'rank-1' : (index === 1 ? 'rank-2' : (index === 2 ? 'rank-3' : ''));
      return `
        <div class="product-row" data-product="${escapeHTML(p.name)}" title="Click to filter by ${escapeHTML(p.name)}" style="cursor: pointer;">
          <div class="product-rank ${rankClass}">#${index + 1}</div>
          <div class="product-info">
            <div class="product-title" title="${p.name}">${p.name}</div>
            <div class="product-category-tag">${p.category}</div>
          </div>
          <div class="product-bar-container">
            <div class="product-bar-bg">
              <div class="product-bar-fill" style="width: ${fillPct}%"></div>
            </div>
            <span class="product-units">${p.units} sale${p.units > 1 ? 's' : ''}</span>
          </div>
          <div class="product-revenue">${formatCurrency(p.revenue)}</div>
        </div>
      `;
    }).join('');

    // Cross-filtering by product click
    container.querySelectorAll('.product-row').forEach(row => {
      row.addEventListener('click', function () {
        const prod = this.getAttribute('data-product');
        const searchInput = document.getElementById('filter-search');
        if (state.searchQuery === prod) {
          state.searchQuery = '';
          if (searchInput) searchInput.value = '';
        } else {
          state.searchQuery = prod;
          if (searchInput) searchInput.value = prod;
        }
        state.currentPage = 1;
        renderTable();
        updateActiveFiltersBar();
      });
    });
  }

  // --- Transactions Table: Filtering, Sorting, Pagination ---
  function getProcessedTransactions() {
    let list = getFilteredByTimeframe(state.transactions);

    // Search query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter(t => 
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.customer && t.customer.toLowerCase().includes(q)) ||
        (t.product && t.product.toLowerCase().includes(q)) ||
        (t.channel && t.channel.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (state.categoryFilter !== 'all') {
      list = list.filter(t => t.category === state.categoryFilter);
    }

    // Channel filter
    if (state.channelFilter !== 'all') {
      list = list.filter(t => t.channel === state.channelFilter);
    }

    // Status filter
    if (state.statusFilter !== 'all') {
      list = list.filter(t => t.status === state.statusFilter);
    }

    // Sorting
    list.sort((a, b) => {
      let valA = a[state.sortColumn];
      let valB = b[state.sortColumn];

      if (state.sortColumn === 'amount') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return state.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }

  function renderTable() {
    const tbody = document.getElementById('sales-table-body');
    const emptyState = document.getElementById('table-empty-state');
    const rowCountEl = document.getElementById('table-row-count');
    const paginationInfo = document.getElementById('pagination-info');
    const pageNumbersEl = document.getElementById('page-numbers');
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');

    if (!tbody) return;

    const filtered = getProcessedTransactions();
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;

    if (rowCountEl) {
      rowCountEl.textContent = `Showing ${totalItems} transaction${totalItems === 1 ? '' : 's'}`;
    }

    if (totalItems === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      if (paginationInfo) paginationInfo.textContent = 'Page 0 of 0';
      if (pageNumbersEl) pageNumbersEl.innerHTML = '';
      if (btnPrev) btnPrev.disabled = true;
      if (btnNext) btnNext.disabled = true;
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    tbody.innerHTML = paginatedItems.map(item => {
      const statusClass = item.status === 'Completed' 
        ? 'status-completed' 
        : (item.status === 'Pending' ? 'status-pending' : 'status-refunded');

      return `
        <tr data-id="${item.id}">
          <td class="order-id-cell">${item.id}</td>
          <td><span class="customer-name">${escapeHTML(item.customer)}</span></td>
          <td>${escapeHTML(item.product)}</td>
          <td>${escapeHTML(item.category)}</td>
          <td>${escapeHTML(item.channel || 'Direct')}</td>
          <td>${formatDateDisplay(item.date)}</td>
          <td>
            <span class="status-pill ${statusClass}">
              <span class="status-dot"></span>
              ${item.status}
            </span>
          </td>
          <td class="text-right amount-cell">${formatCurrency(item.amount)}</td>
          <td class="text-center">
            <div class="table-actions">
              <button class="btn-edit-action btn-edit" data-id="${item.id}" title="Edit transaction">Edit</button>
              <button class="btn-danger-outline btn-delete" data-id="${item.id}" title="Delete transaction">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Pagination controls
    if (paginationInfo) {
      paginationInfo.textContent = `Showing ${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of ${totalItems} (Page ${state.currentPage} of ${totalPages})`;
    }

    if (btnPrev) btnPrev.disabled = state.currentPage <= 1;
    if (btnNext) btnNext.disabled = state.currentPage >= totalPages;

    if (pageNumbersEl) {
      pageNumbersEl.innerHTML = '';
      for (let p = 1; p <= totalPages; p++) {
        const pBtn = document.createElement('button');
        pBtn.className = `page-btn ${p === state.currentPage ? 'active' : ''}`;
        pBtn.textContent = p;
        pBtn.addEventListener('click', () => {
          state.currentPage = p;
          renderTable();
        });
        pageNumbersEl.appendChild(pBtn);
      }
    }

    // Attach listeners
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const id = this.getAttribute('data-id');
        deleteTransaction(id);
      });
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const id = this.getAttribute('data-id');
        openEditModal(id);
      });
    });
  }

  // --- Active Filters Bar Render ---
  function updateActiveFiltersBar() {
    const bar = document.getElementById('active-filters-bar');
    const container = document.getElementById('active-filter-chips');
    if (!bar || !container) return;

    const chips = [];

    if (state.searchQuery.trim()) {
      chips.push({ label: `Search: "${state.searchQuery}"`, key: 'search' });
    }
    if (state.categoryFilter !== 'all') {
      chips.push({ label: `Category: ${state.categoryFilter}`, key: 'category' });
    }
    if (state.channelFilter !== 'all') {
      chips.push({ label: `Channel: ${state.channelFilter}`, key: 'channel' });
    }
    if (state.statusFilter !== 'all') {
      chips.push({ label: `Status: ${state.statusFilter}`, key: 'status' });
    }
    if (state.timeframe === 'custom' && state.customStart && state.customEnd) {
      chips.push({ label: `Range: ${state.customStart} to ${state.customEnd}`, key: 'timeframe' });
    }

    if (chips.length === 0) {
      bar.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    bar.classList.remove('hidden');
    container.innerHTML = chips.map(chip => `
      <span class="filter-chip">
        ${escapeHTML(chip.label)}
        <button class="filter-chip-remove" data-key="${chip.key}" title="Remove filter">&times;</button>
      </span>
    `).join('');

    container.querySelectorAll('.filter-chip-remove').forEach(btn => {
      btn.addEventListener('click', function () {
        const key = this.getAttribute('data-key');
        if (key === 'search') {
          state.searchQuery = '';
          const s = document.getElementById('filter-search');
          if (s) s.value = '';
        } else if (key === 'category') {
          state.categoryFilter = 'all';
          const c = document.getElementById('filter-category');
          if (c) c.value = 'all';
          renderCategoryDonutChart();
        } else if (key === 'channel') {
          state.channelFilter = 'all';
          const ch = document.getElementById('filter-channel');
          if (ch) ch.value = 'all';
          renderChannelBarChart();
        } else if (key === 'status') {
          state.statusFilter = 'all';
          const st = document.getElementById('filter-status');
          if (st) st.value = 'all';
        } else if (key === 'timeframe') {
          state.timeframe = '30d';
          const pButtons = document.querySelectorAll('#timeframe-selector .pill-btn');
          pButtons.forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-timeframe') === '30d');
          });
          const cBox = document.getElementById('custom-date-controls');
          if (cBox) cBox.classList.add('hidden');
        }
        state.currentPage = 1;
        refreshDashboard();
      });
    });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // --- CRUD: Delete Transaction ---
  function deleteTransaction(id) {
    const itemIndex = state.transactions.findIndex(t => t.id === id);
    if (itemIndex > -1) {
      const deletedItem = state.transactions[itemIndex];
      state.transactions.splice(itemIndex, 1);
      saveData();
      refreshDashboard();
      showToast(`Deleted transaction ${deletedItem.id}`, 'warning');
    }
  }

  // --- CRUD: Open Edit Modal ---
  function openEditModal(id) {
    const item = state.transactions.find(t => t.id === id);
    if (!item) return;

    document.getElementById('form-edit-id').value = item.id;
    document.getElementById('form-customer').value = item.customer;
    document.getElementById('form-product').value = item.product;
    document.getElementById('form-category').value = item.category;
    document.getElementById('form-channel').value = item.channel || 'Website Direct';
    document.getElementById('form-amount').value = item.amount;
    document.getElementById('form-status').value = item.status;
    document.getElementById('form-date').value = item.date;

    const titleEl = document.querySelector('#sale-modal .modal-title');
    const subtitleEl = document.querySelector('#sale-modal .modal-subtitle');
    const submitBtn = document.getElementById('btn-save-sale');

    if (titleEl) titleEl.textContent = `Edit Transaction (${item.id})`;
    if (subtitleEl) subtitleEl.textContent = 'Update transaction details and recalculate metrics';
    if (submitBtn) submitBtn.textContent = 'Save Changes';

    const modal = document.getElementById('sale-modal');
    if (modal) modal.classList.remove('hidden');
  }

  // --- CRUD: Add or Update Transaction ---
  function handleAddSaleSubmit(e) {
    e.preventDefault();

    const editId = document.getElementById('form-edit-id').value;
    const customerInput = document.getElementById('form-customer');
    const productInput = document.getElementById('form-product');
    const categorySelect = document.getElementById('form-category');
    const channelSelect = document.getElementById('form-channel');
    const amountInput = document.getElementById('form-amount');
    const statusSelect = document.getElementById('form-status');
    const dateInput = document.getElementById('form-date');

    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid positive sale amount', 'danger');
      return;
    }

    if (editId) {
      // Update existing
      const existingIdx = state.transactions.findIndex(t => t.id === editId);
      if (existingIdx > -1) {
        state.transactions[existingIdx] = {
          id: editId,
          customer: customerInput.value.trim(),
          product: productInput.value.trim(),
          category: categorySelect.value,
          channel: channelSelect.value,
          amount: amount,
          status: statusSelect.value,
          date: dateInput.value || getTodayString(0)
        };
        saveData();
        closeModal();
        refreshDashboard();
        showToast(`Transaction ${editId} updated successfully`, 'success');
        return;
      }
    }

    // Create new
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `ORD-${randomNum}`;

    const newSale = {
      id: newId,
      customer: customerInput.value.trim(),
      product: productInput.value.trim(),
      category: categorySelect.value,
      channel: channelSelect.value,
      amount: amount,
      status: statusSelect.value,
      date: dateInput.value || getTodayString(0)
    };

    state.transactions.unshift(newSale);
    saveData();

    document.getElementById('sale-form').reset();
    closeModal();

    refreshDashboard();
    showToast(`Transaction ${newId} recorded successfully!`, 'success');
  }

  // --- CSV Import ---
  function handleCSVImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          showToast('CSV file is empty or missing data rows', 'warning');
          return;
        }

        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cells.length >= 7) {
            const id = cells[0] || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
            const customer = cells[1] || 'Imported Customer';
            const product = cells[2] || 'Standard Package';
            const category = cells[3] || 'Software & SaaS';
            const channel = cells[4] || 'Website Direct';
            const date = cells[5] || getTodayString(0);
            const status = cells[6] || 'Completed';
            const amount = parseFloat(cells[7]) || 100.00;

            const existingIdx = state.transactions.findIndex(t => t.id === id);
            if (existingIdx > -1) {
              state.transactions[existingIdx] = { id, customer, product, category, channel, date, status, amount };
            } else {
              state.transactions.unshift({ id, customer, product, category, channel, date, status, amount });
            }
            importedCount++;
          }
        }

        saveData();
        refreshDashboard();
        showToast(`Imported ${importedCount} transactions from CSV!`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Error processing CSV file', 'danger');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  // --- CSV Export ---
  function exportToCSV() {
    const dataToExport = getProcessedTransactions();
    if (dataToExport.length === 0) {
      showToast('No transaction data to export with current filters', 'warning');
      return;
    }

    const headers = ['Order ID', 'Customer', 'Product', 'Category', 'Channel', 'Date', 'Status', 'Amount (USD)'];
    const rows = dataToExport.map(t => [
      `"${t.id}"`,
      `"${(t.customer || '').replace(/"/g, '""')}"`,
      `"${(t.product || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.channel || '').replace(/"/g, '""')}"`,
      `"${t.date}"`,
      `"${t.status}"`,
      Number(t.amount || 0).toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `salespulse-export-${getTodayString(0)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${dataToExport.length} transactions to CSV`, 'success');
  }

  // --- Reset Demo Data ---
  function resetDemoData() {
    state.transactions = generateDefaultSampleData();
    saveData();
    state.currentPage = 1;
    state.categoryFilter = 'all';
    state.channelFilter = 'all';
    state.statusFilter = 'all';
    state.searchQuery = '';
    state.timeframe = '30d';

    const s = document.getElementById('filter-search');
    if (s) s.value = '';
    const c = document.getElementById('filter-category');
    if (c) c.value = 'all';
    const ch = document.getElementById('filter-channel');
    if (ch) ch.value = 'all';
    const st = document.getElementById('filter-status');
    if (st) st.value = 'all';

    const pButtons = document.querySelectorAll('#timeframe-selector .pill-btn');
    pButtons.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-timeframe') === '30d');
    });

    refreshDashboard();
    showToast('Reset to original sample dataset', 'success');
  }

  // --- Full Dashboard Refresh ---
  function refreshDashboard() {
    updateKPIs();
    renderRevenueLineChart();
    renderCategoryDonutChart();
    renderChannelBarChart();
    updateTopProducts();
    renderTable();
    updateActiveFiltersBar();
  }

  // --- Modal Helpers ---
  function openAddModal() {
    document.getElementById('form-edit-id').value = '';
    document.getElementById('sale-form').reset();
    const dateInput = document.getElementById('form-date');
    if (dateInput) dateInput.value = getTodayString(0);

    const titleEl = document.querySelector('#sale-modal .modal-title');
    const subtitleEl = document.querySelector('#sale-modal .modal-subtitle');
    const submitBtn = document.getElementById('btn-save-sale');

    if (titleEl) titleEl.textContent = 'Record New Sale';
    if (subtitleEl) subtitleEl.textContent = 'Add a verified sale transaction to update metrics in real-time';
    if (submitBtn) submitBtn.textContent = 'Save Transaction';

    const modal = document.getElementById('sale-modal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeModal() {
    const modal = document.getElementById('sale-modal');
    if (modal) modal.classList.add('hidden');
  }

  // --- Target Modal Helpers ---
  function openTargetModal() {
    const input = document.getElementById('form-target-amount');
    if (input) input.value = state.monthlyTarget || 60000;
    const modal = document.getElementById('target-modal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeTargetModal() {
    const modal = document.getElementById('target-modal');
    if (modal) modal.classList.add('hidden');
  }

  // --- Toast Notification System ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3200);
  }

  // --- Chart Mouse Interactions (Line Chart Tooltip) ---
  function initChartInteractions() {
    const canvas = document.getElementById('revenueLineChart');
    const tooltip = document.getElementById('chart-tooltip');
    if (!canvas || !tooltip) return;

    canvas.addEventListener('mousemove', function (e) {
      const points = canvas._chartPoints;
      if (!points || points.length === 0) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      let closestPt = null;
      let minDistance = 28;

      points.forEach(pt => {
        const dx = Math.abs(pt.x - mouseX);
        if (dx < minDistance) {
          closestPt = pt;
          minDistance = dx;
        }
      });

      if (closestPt) {
        activeHoverPoint = closestPt;
        renderRevenueLineChart();

        tooltip.style.display = 'block';
        tooltip.style.left = `${closestPt.x}px`;
        tooltip.style.top = `${closestPt.y}px`;
        tooltip.innerHTML = `
          <div class="tooltip-title">${formatDateDisplay(closestPt.data.date)}</div>
          <div class="tooltip-val">${formatCurrency(closestPt.data.revenue)}</div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">${closestPt.data.count} completed order${closestPt.data.count === 1 ? '' : 's'}</div>
        `;
      } else {
        if (activeHoverPoint) {
          activeHoverPoint = null;
          renderRevenueLineChart();
        }
        tooltip.style.display = 'none';
      }
    });

    canvas.addEventListener('mouseleave', function () {
      if (activeHoverPoint) {
        activeHoverPoint = null;
        renderRevenueLineChart();
      }
      tooltip.style.display = 'none';
    });
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Timeframe selector buttons
    const timeframeButtons = document.querySelectorAll('#timeframe-selector .pill-btn');
    const customControls = document.getElementById('custom-date-controls');
    const customStartInput = document.getElementById('custom-date-start');
    const customEndInput = document.getElementById('custom-date-end');
    const btnApplyCustom = document.getElementById('btn-apply-custom-date');

    timeframeButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const tf = this.getAttribute('data-timeframe');
        timeframeButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        if (tf === 'custom') {
          if (customControls) {
            customControls.classList.toggle('hidden');
            if (!customStartInput.value) customStartInput.value = getTodayString(14);
            if (!customEndInput.value) customEndInput.value = getTodayString(0);
          }
          return;
        }

        if (customControls) customControls.classList.add('hidden');
        state.timeframe = tf;
        state.currentPage = 1;
        refreshDashboard();
      });
    });

    if (btnApplyCustom) {
      btnApplyCustom.addEventListener('click', () => {
        const start = customStartInput.value;
        const end = customEndInput.value;
        if (!start || !end) {
          showToast('Please select both start and end dates', 'warning');
          return;
        }
        if (start > end) {
          showToast('Start date must be before end date', 'warning');
          return;
        }
        state.timeframe = 'custom';
        state.customStart = start;
        state.customEnd = end;
        state.currentPage = 1;
        refreshDashboard();
        showToast(`Filtered: ${formatDateDisplay(start)} to ${formatDateDisplay(end)}`, 'info');
      });
    }

    // Chart metric toggles (Revenue vs Orders)
    const metricButtons = document.querySelectorAll('.chart-toggle-btn');
    metricButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        metricButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.chartMetric = this.getAttribute('data-metric');
        renderRevenueLineChart();
      });
    });

    // Search filter
    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        state.searchQuery = e.target.value;
        state.currentPage = 1;
        renderTable();
        updateActiveFiltersBar();
      });
    }

    // Category filter
    const catSelect = document.getElementById('filter-category');
    if (catSelect) {
      catSelect.addEventListener('change', function (e) {
        state.categoryFilter = e.target.value;
        state.currentPage = 1;
        renderCategoryDonutChart();
        renderTable();
        updateActiveFiltersBar();
      });
    }

    // Channel filter
    const channelSelect = document.getElementById('filter-channel');
    if (channelSelect) {
      channelSelect.addEventListener('change', function (e) {
        state.channelFilter = e.target.value;
        state.currentPage = 1;
        renderChannelBarChart();
        renderTable();
        updateActiveFiltersBar();
      });
    }

    // Status filter
    const statusSelect = document.getElementById('filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', function (e) {
        state.statusFilter = e.target.value;
        state.currentPage = 1;
        renderTable();
        updateActiveFiltersBar();
      });
    }

    // Clear all filters button
    const btnClearAll = document.getElementById('btn-clear-all-filters');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        state.searchQuery = '';
        state.categoryFilter = 'all';
        state.channelFilter = 'all';
        state.statusFilter = 'all';
        state.timeframe = '30d';

        if (searchInput) searchInput.value = '';
        if (catSelect) catSelect.value = 'all';
        if (channelSelect) channelSelect.value = 'all';
        if (statusSelect) statusSelect.value = 'all';

        timeframeButtons.forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-timeframe') === '30d');
        });
        if (customControls) customControls.classList.add('hidden');

        state.currentPage = 1;
        refreshDashboard();
      });
    }

    // Table sorting headers
    const sortHeaders = document.querySelectorAll('.sales-table th.sortable');
    sortHeaders.forEach(th => {
      th.addEventListener('click', function () {
        const col = this.getAttribute('data-sort');
        if (state.sortColumn === col) {
          state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortColumn = col;
          state.sortDirection = col === 'amount' || col === 'date' ? 'desc' : 'asc';
        }

        sortHeaders.forEach(h => {
          h.classList.remove('sorted');
          const icon = h.querySelector('.sort-icon');
          if (icon) icon.textContent = '↕';
        });

        this.classList.add('sorted');
        const activeIcon = this.querySelector('.sort-icon');
        if (activeIcon) {
          activeIcon.textContent = state.sortDirection === 'asc' ? '▲' : '▼';
        }

        renderTable();
      });
    });

    // Pagination buttons
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (state.currentPage > 1) {
          state.currentPage--;
          renderTable();
        }
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        state.currentPage++;
        renderTable();
      });
    }

    // Modal triggers (Add/Edit Sale)
    const btnOpenModal = document.getElementById('btn-open-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const saleModal = document.getElementById('sale-modal');
    const saleForm = document.getElementById('sale-form');

    if (btnOpenModal) btnOpenModal.addEventListener('click', openAddModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

    if (saleModal) {
      saleModal.addEventListener('click', function (e) {
        if (e.target === saleModal) closeModal();
      });
    }

    if (saleForm) {
      saleForm.addEventListener('submit', handleAddSaleSubmit);
    }

    // Target Quota Modal
    const btnEditTarget = document.getElementById('btn-edit-target');
    const btnCloseTargetModal = document.getElementById('btn-close-target-modal');
    const btnCancelTargetModal = document.getElementById('btn-cancel-target-modal');
    const targetModal = document.getElementById('target-modal');
    const targetForm = document.getElementById('target-form');

    if (btnEditTarget) btnEditTarget.addEventListener('click', openTargetModal);
    if (btnCloseTargetModal) btnCloseTargetModal.addEventListener('click', closeTargetModal);
    if (btnCancelTargetModal) btnCancelTargetModal.addEventListener('click', closeTargetModal);

    if (targetModal) {
      targetModal.addEventListener('click', function (e) {
        if (e.target === targetModal) closeTargetModal();
      });
    }

    if (targetForm) {
      targetForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const amtInput = document.getElementById('form-target-amount');
        const newTarget = parseFloat(amtInput.value);
        if (!isNaN(newTarget) && newTarget > 0) {
          state.monthlyTarget = newTarget;
          saveTarget();
          closeTargetModal();
          updateKPIs();
          showToast(`Monthly target set to ${formatCurrency(newTarget)}`, 'success');
        }
      });
    }

    // CSV File Import
    const btnImport = document.getElementById('btn-import-csv');
    const fileInput = document.getElementById('csv-file-input');
    if (btnImport && fileInput) {
      btnImport.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', handleCSVImport);
    }

    // Export CSV and Reset Demo buttons
    const btnExport = document.getElementById('btn-export-csv');
    const btnReset = document.getElementById('btn-reset-data');

    if (btnExport) btnExport.addEventListener('click', exportToCSV);
    if (btnReset) btnReset.addEventListener('click', resetDemoData);

    // Print Report
    const btnPrint = document.getElementById('btn-print-report');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => window.print());
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal();
        closeTargetModal();
      }
    });

    // Window Resize Observer for Charts
    window.addEventListener('resize', debounce(() => {
      renderRevenueLineChart();
      renderCategoryDonutChart();
      renderChannelBarChart();
    }, 150));
  }

  function debounce(fn, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // --- Initializer ---
  function init() {
    loadData();
    setupEventListeners();
    initChartInteractions();
    refreshDashboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
