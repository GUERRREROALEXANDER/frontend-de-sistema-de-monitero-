# Pulse — Microservices Monitor (Frontend)

Real-time observability dashboard for the **Inventory**, **Orders** and **Payments** microservices. Every call goes through a monitoring proxy, and this app turns those calls into live health, traffic, resource and log views.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · Motion (Framer Motion) · Recharts · Axios · lucide-react

## Features

### Overview

- **KPI strip:** total requests, global success rate, average and p95 latency, and throughput (requests per minute). Numbers count up smoothly between updates.
- **Service cards:** total calls, success rate and average response time per service, with a latency sparkline.
- **Critical alerting:** when a service's error rate goes above **15%**, its card turns coral and pulses.
- **Traffic over time:** a stacked area chart in 15-second buckets. It can switch between request count and latency.
- **Response time per call:** the last 20 calls of each service. Errors are drawn as coral points.
- **Alerts feed:** alerts open and resolve on their own from live thresholds (error rate, latency, CPU, memory). The feed shows active alerts and history.

### Topology

- **Animated service map:** Clients → API Gateway → services → databases. Traffic particles move faster on busier links, and edges are colored by health.
- **Node inspection:** hover a node to highlight its links, or click it to see metrics, CPU/memory gauges and top operations.
- **Health status grid:** every component, filterable by Healthy, Degraded, Critical or Idle.

### Resources

- CPU and memory gauges for the gateway and each service.
- A usage history chart with the warning threshold drawn as a dashed line.

### Logs

- **Real-time table:** polls every 3 seconds and shows `requestId`, service, operation, duration and status.
- **Filters:** by service, by status (`SUCCESS` / `ERROR`) and by date range.
- **Detail view:** click a row to expand it and see the input parameters and the full response as JSON, with copy buttons.

### Across the app

- **Simulate Load:** calls `POST /api/metrics/simulate-load` and refreshes the dashboard right away.
- **Look and feel:** warm glassmorphism theme, dark by default, with a light mode. Page transitions, staggered card entrances and hover micro-interactions all honor `prefers-reduced-motion`.
- **Resilience:**
  - GET requests retry automatically with exponential backoff; POST requests are never retried.
  - Skeleton placeholders show while data loads.
  - When the connection drops, a banner appears and the last data received stays on screen.
  - Polling pauses while the tab is hidden.

## Getting started

```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev              # http://localhost:5173
```

To run without a backend, set `VITE_USE_MOCK=true`. An in-memory backend then generates traffic, failures and resource usage.

| Script            | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Development server             |
| `npm run build`   | Type-check and production build |
| `npm run lint`    | ESLint                         |
| `npm run preview` | Serve the production build     |

## Environment variables

| Variable                   | Default                 | Description                          |
| -------------------------- | ----------------------- | ------------------------------------ |
| `VITE_API_BASE_URL`        | `http://localhost:8080` | Backend base URL (no trailing slash) |
| `VITE_USE_MOCK`            | `false`                 | `true` to use the in-memory backend  |
| `VITE_POLLING_INTERVAL_MS` | `3000`                  | Refresh interval                     |
| `VITE_API_TIMEOUT_MS`      | `8000`                  | Per-request timeout                  |

## Backend contract

Routes are defined in `src/api/httpMonitoringApi.ts` (`ENDPOINTS`).

| Method | Route                         | Purpose                                                                 |
| ------ | ----------------------------- | ----------------------------------------------------------------------- |
| GET    | `/api/metrics`                | Aggregated metrics per service                                          |
| GET    | `/api/logs`                   | Call logs. Optional query: `service`, `status`, `from`, `to`, `limit` |
| GET    | `/api/metrics/resources`      | *Optional.* CPU and memory per component                                |
| POST   | `/api/metrics/simulate-load`  | Generates simulated load                                                |

Example payloads:

```json
// GET /api/metrics
[{ "service": "INVENTORY", "totalCalls": 120, "successCount": 110, "errorCount": 10, "avgResponseTime": 134.5 }]

// GET /api/logs
[{ "requestId": "a1b2", "service": "PAYMENTS", "operation": "processPayment", "durationMs": 230,
   "status": "SUCCESS", "timestamp": "2026-10-30T15:20:00", "input": {}, "response": {} }]

// GET /api/metrics/resources
[{ "service": "gateway", "cpuPercent": 34, "memoryUsedMb": 210, "memoryTotalMb": 512 }]
```

`src/api/normalizers.ts` tolerates common variations of this contract:

- English or Spanish field names (`servicio`, `duration`, `responseTime`, `params`…);
- lists wrapped in `content` or `data` (Spring pagination);
- `LocalDateTime` values serialized as arrays;
- payloads sent as JSON strings.

If `/api/metrics` returns 404, metrics are computed from the logs. If `/api/metrics/resources` returns 404, the Resources view explains how to enable it and everything else keeps working.

Database status in the topology map is **inferred** from the owning service, and the UI labels it that way.

**CORS:** the backend must allow the frontend origin (`http://localhost:5173` and the Vercel domain).

## Project structure

```
src/
├── api/              HTTP client (axios + retries), real API, mock API, normalizers
├── components/
│   ├── ui/           Reusable building blocks: GlassCard, HealthBadge, RadialGauge, Sparkline,
│   │                 AnimatedNumber, SegmentedControl, Toast, motion presets…
│   ├── charts/       Shared chart theme, tooltip and interactive legend
│   ├── layout/       Sidebar, top bar, ambient background, navigation
│   ├── overview/     KPIs, service cards, traffic and response-time charts, alerts feed
│   ├── topology/     Service map, node details, health grid
│   ├── resources/    Resource gauges and usage history
│   ├── logs/         Filters, table and expandable detail
│   └── feedback/     Connection error states
├── views/            One component per page (Overview, Topology, Resources, Logs)
├── hooks/            Polling, dashboard data, hash navigation, theme
├── config/           Environment, services catalog and thresholds
├── types/            Domain types
└── utils/            Analytics, alerts, topology model, formatting, filters
```

## Deploying to Vercel

1. Import the repository in Vercel. The Vite framework is detected automatically, and `vercel.json` sets the build command, the `dist` output directory and the SPA rewrite.
2. Under **Settings → Environment Variables**, set `VITE_API_BASE_URL` to the public backend URL. Optionally set `VITE_USE_MOCK=true` for a demo deployment.
3. Deploy. Vite embeds the variables at build time, so redeploy after changing them.
