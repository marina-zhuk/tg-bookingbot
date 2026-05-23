# AGENTS.md

## Project

Telegram MVP for a fitness club.

The bot demonstrates a commercial MVP for selling fitness club subscriptions through Telegram.

Core demo features:

- User registration through `/start`.
- Subscription catalog.
- Mock payment flow for portfolio demo.
- Admin panel.
- Broadcast tools.
- CSV export.

## Stack

- Node.js
- Telegraf
- Express
- SQLite
- YooKassa SDK

## Commands

```bash
npm install
npm run dev
npm start
```

Use `npm.cmd run dev` on Windows PowerShell if `npm run dev` is blocked by script policy.

## Environment

Required for demo:

```env
BOT_TOKEN=
ADMIN_IDS=
TEST_MODE=true
```

Recommended demo club values:

```env
CLUB_NAME=Demo Fitness Club
CLUB_ADDRESS=Demo city, Demo street
CLUB_PHONE=+7 000 000-00-00
CLUB_HOURS=Пн–Пт 06:00–23:00, Сб–Вс 07:00–22:00
```

Optional for production:

```env
WEBHOOK_DOMAIN=
WEBHOOK_PATH=/telegram
YOOKASSA_WEBHOOK_PATH=/webhook/yookassa
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
```

Local defaults:

```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/bot.db
SUBSCRIPTIONS_PATH=./config/subscriptions.json
NOTIFIERS_PATH=./config/notifiers.json
```

## Demo Mode

- Keep `TEST_MODE=true` for portfolio demo.
- Demo mode uses fake payment buttons instead of creating a production YooKassa payment.
- Do not describe the payment flow as production-ready unless YooKassa credentials, webhook delivery, and payment confirmation are fully tested.

## Safety Rules

- Do not commit `.env`.
- Do not expose real Telegram tokens, admin IDs, payment keys, shop IDs, customer data, phone numbers, addresses, or private URLs.
- Use `.env.example` for placeholders only.
- Keep the project simple and demo-friendly.
- Preserve user flow, admin flow, CSV export, broadcast tools, subscription catalog, and mock payment flow.
- Do not rename internal functions or rewrite business logic unless the task explicitly requires it.
- Do not remove existing integrations just to make the demo cleaner.

## Definition of Done

- Bot starts locally.
- `/start` opens the user flow.
- User can register with name, phone, and email.
- User can select a subscription.
- Demo payment flow works.
- Admin can open admin panel.
- Admin can view payments/users if these features exist.
- CSV export works if implemented.
- README or project instructions explain demo status clearly.
