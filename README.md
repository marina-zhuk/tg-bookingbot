# FitAdmin Bot

Portfolio demo Telegram MVP for a fictional fitness club, built to show how a local fitness business can sell memberships, collect client data, run admin actions, and export reports directly through Telegram.

Built as an AI-assisted commercial MVP. I handled product logic, scenario design, setup, testing, integration flow, debugging and portfolio packaging.

## Live Demo

- Telegram demo bot: https://t.me/FitAdmin2_bot
- Landing/demo page: https://tg-bookingbot-gravity.vercel.app

## Business Problem

Fitness clubs often lose leads and purchase requests inside chats. Administrators repeat the same answers, manually collect contact details, and do not have a simple place to track who selected a membership, who completed payment, and who should receive follow-up messages.

FitAdmin Bot demonstrates a compact MVP for fixing that flow: the client can register, choose a service, and pass through a demo payment scenario, while the administrator can view paid clients, manage the catalog, send broadcasts, and export an Excel report.

## What It Does

- Client registration through `/start`.
- Membership and service catalog.
- Mock payment flow with successful and failed demo outcomes.
- Admin panel through `/admin`.
- Catalog management for memberships, prices, visibility, and special offers.
- Excel/XLSX report for paid clients.
- Broadcast flow for users who opened the bot.
- SQLite storage for users, visitors, payments, catalog data, and admin change history.

## Client Flow

1. Client opens the Telegram bot and sends `/start`.
2. Bot registers the client: full name, phone, and email.
3. Client opens the catalog.
4. Client chooses a membership, single visit, or special offer.
5. Bot shows the selected item and price.
6. Client enters the mock payment flow.
7. Client can test successful payment or failed payment.
8. Bot stores the payment status and shows next-step club information.

## Admin Flow

1. Admin opens `/admin`.
2. Bot checks access through `ADMIN_IDS`.
3. Admin can view paid clients.
4. Admin can export an Excel payment report.
5. Admin can start and confirm a broadcast.
6. Admin can manage notification recipients through `/admins`.
7. Admin can manage memberships, prices, visibility, special offers, and view change history.

## Mock Payment Flow

В демо-версии реализован mock payment flow: успешная и неуспешная оплата без подключения реального платёжного провайдера. Для production можно подключить YouKassa, CloudPayments или другой сервис.

The demo flow does not charge real money. `TEST_MODE=true` keeps the bot in safe portfolio mode and shows fake payment buttons instead of creating a real YooKassa payment.

## Tech Stack

- Node.js CommonJS
- Telegraf
- Telegram Bot API
- Express
- SQLite through `node:sqlite`
- `dotenv`
- `exceljs`
- `node-cron`
- YooKassa SDK dependency prepared for future real payment integration
- Vercel-ready static landing and serverless API endpoints

## Screenshots

Screenshots are stored in [`docs/screenshots`](docs/screenshots). Current expected files:

- `client-menu.png`
- `subscription-flow.png`
- `mock-payment.png`
- `admin-panel.png`
- `admin-subscriptions.png`
- `crm.png`
- `excel-report.png`
- `broadcasts.png`

Before public publication, make sure all screenshots contain only demo data and safe placeholders.

## Demo Limitations

- Mock payment instead of real payment provider.
- Demo data and local SQLite database.
- Runtime SQLite on serverless hosting is suitable only for a portfolio preview.
- Production hosting, payment confirmation, webhook reliability, database persistence, backups, monitoring, legal payment texts, and security hardening require additional setup.
- This project is a commercial MVP demo, not a production-ready fitness CRM.

## Environment Variables

Create `.env` from `.env.example`. Do not commit real tokens, admin IDs, payment keys, private webhook URLs, local databases, or logs.

Required for local Telegram demo:

- `BOT_TOKEN` - demo Telegram bot token from BotFather.
- `ADMIN_IDS` - comma-separated numeric Telegram user IDs with admin access.
- `TEST_MODE` - keep `true` for portfolio mock payment mode.

Optional payment/webhook variables:

- `YOOKASSA_SHOP_ID` - required only when real YooKassa payments are enabled.
- `YOOKASSA_SECRET_KEY` - required only when real YooKassa payments are enabled.
- `WEBHOOK_DOMAIN` - production-like webhook domain for long-running server mode.
- `WEBHOOK_PATH` - Telegram webhook path, default `/telegram`.
- `YOOKASSA_WEBHOOK_PATH` - YooKassa webhook path, default `/webhook/yookassa`.

Runtime and demo content:

- `PORT` - local server port, default `3000`.
- `NODE_ENV` - `development` for local polling, `production` for webhook mode.
- `DB_PATH` - SQLite database path.
- `SUBSCRIPTIONS_PATH` - membership catalog JSON path.
- `NOTIFIERS_PATH` - notification recipients JSON path.
- `CLUB_NAME`, `CLUB_ADDRESS`, `CLUB_PHONE`, `CLUB_HOURS` - safe demo club details shown in bot messages.

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment file:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Start development mode:

```bash
npm run dev
```

On Windows PowerShell, if `npm.ps1` is blocked by script policy:

```powershell
npm.cmd run dev
```

Production-like local start:

```bash
npm start
```

Fast health check when the server is running:

```bash
curl http://127.0.0.1:3000/healthz
```

## Validation Checklist

- [ ] Start bot.
- [ ] Client registration works.
- [ ] Catalog opens.
- [ ] Mock successful payment works.
- [ ] Mock failed payment works.
- [ ] Admin panel opens for admin user.
- [ ] Non-admin user is denied admin access.
- [ ] Excel report generation works.
- [ ] Broadcast flow works.
- [ ] No secrets committed.

## Deploy Notes

The project includes a static landing and Vercel serverless endpoints:

- `/` serves the portfolio landing from `public/index.html`.
- `/api/healthz` returns a health response.
- `/api/telegram` is prepared as a Telegram webhook endpoint.

For Vercel demo deployment:

1. Add safe demo env variables in Vercel Project Settings.
2. Use a separate demo bot token, not a client production bot.
3. Keep `TEST_MODE=true`.
4. Configure Telegram webhook manually to `https://your-domain.vercel.app/api/telegram`.
5. Use external persistent storage before positioning the project as production-ready.

The daily report scheduler in `src/index.js` is intended for long-running Node.js mode, not serverless execution.

## Portfolio Value

This project demonstrates a Telegram bot MVP with real business scenarios: client registration, catalog selection, admin flow, reporting, demo payment states, broadcast tools, SQLite persistence, and clean client-ready packaging. It is useful as a portfolio case for fitness clubs, studios, schools, salons, and other local businesses that sell memberships or service packages.
