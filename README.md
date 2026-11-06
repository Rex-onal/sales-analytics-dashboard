# SalesPulse - Sales Analytics Dashboard

A responsive sales analytics dashboard built with **vanilla HTML, CSS, and JavaScript**.

No frameworks, no npm dependencies, no backend, no authentication gates, and **zero CSS variables**. All persistent data is stored directly in browser web storage (`localStorage`).

---

## ✨ Features

- **Executive KPI Summary**: Real-time Total Revenue, Orders Completed, Average Order Value (AOV), Conversion Rate, and Collection Rate.
- **Interactive Vanilla HTML5 Canvas Charts**:
  - **Revenue & Volume Trajectory**: Smooth retina line/area chart with gradient fills, grid markings, date ticks, and mouseover tooltip. Supports Revenue, Order Count, and Dual-Axis view.
  - **Category Breakdown**: Donut chart with color-coded slices, center totals, and interactive category legend.
  - **Channel Distribution**: Horizontal bar chart comparing acquisition pipelines (Website Direct, Enterprise Sales, Partner Referrals, Inbound Marketing).
  - **Offerings Leaderboard**: Ranked top products (#1 to #4) with sales counts, revenue totals, and proportional progress bars.
- **Quota Tracker & Sales Intelligence**:
  - Monthly milestone progress bar with editable quota (saved in `localStorage`).
  - Top client account by spend, peak sales day, and leading channel breakdown.
- **Interactive Cross-Filtering**:
  - Quick filters for 7 Days, 30 Days, 90 Days, All Time, or Custom date range.
  - Live breadcrumb filter chips with single-click removal.
  - Click on any category or channel to immediately filter the dashboard.
- **Data Management**:
  - Full CRUD: Add, edit, and delete transactions.
  - Export to CSV & Import from CSV.
  - Reset Demo Data to initial state.
- **Print / PDF Ready**: Dedicated `@media print` styling for clean, professional executive reporting.

---

## 🚀 Quick Start

Open [`index.html`](index.html) directly in any modern browser:

```bash
open index.html
```

Or serve with Python:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

---

## 📁 Project Structure

```
├── index.html       # Single-page dashboard markup, KPIs, charts, table & modals
├── styles.css       # Complete layout, themes & print styles (zero CSS variables)
├── app.js           # Retina canvas charting, state management & localStorage CRUD
└── README.md        # Documentation
```
