# Telegram Bot для фитнес-клуба

MVP Telegram-бота для фитнес-клуба: каталог абонементов, регистрация клиента, demo payment flow, admin panel, CSV-export и рассылки.

## Features

- Регистрация клиента: ФИО, телефон, email
- Каталог абонементов
- Покупка через demo payment flow
- Admin panel для просмотра оплат и пользователей
- CSV-export клиентов и оплат
- Рассылки по базе пользователей
- Управление абонементами, спецпредложениями и ценами
- Подготовка к интеграции с YooKassa

## Stack

- Node.js
- Telegraf
- Express
- SQLite
- YooKassa SDK
- PM2 config

## Demo Mode

Для portfolio/demo используется `TEST_MODE=true`.

В этом режиме бот не создаёт production YooKassa-платежи. Вместо этого пользователь видит demo-кнопки успешной или неуспешной тестовой оплаты. Деньги не списываются, а production payment requires YooKassa setup.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Перед запуском заполните в `.env`:

```env
BOT_TOKEN=
ADMIN_IDS=
TEST_MODE=true
```

На Windows PowerShell можно использовать:

```bash
npm.cmd run dev
```

## Smoke Test Checklist

- [ ] `npm install` completes without errors.
- [ ] `.env` exists and contains `BOT_TOKEN` and `ADMIN_IDS`.
- [ ] `npm run dev` starts the bot.
- [ ] `/healthz` returns `{ "ok": true }` while the server is running.
- [ ] Telegram polling starts without timeout. If it times out, check `BOT_TOKEN`, VPN/proxy, firewall, and Telegram API availability.
- [ ] `/start` opens the user menu.
- [ ] User can complete registration.
- [ ] User can select a subscription.
- [ ] Demo payment success path works.
- [ ] Demo payment failure path works.
- [ ] `/admin` opens admin panel for users from `ADMIN_IDS`.
- [ ] Admin can view payments. Optional: user list view if added later.
- [ ] CSV export works.
- [ ] Broadcast flow works in safe/test mode.

## Environment Variables

Основные переменные:

- `BOT_TOKEN` — токен demo Telegram bot от BotFather.
- `ADMIN_IDS` — Telegram ID администраторов через запятую.
- `TEST_MODE` — `true` для portfolio/demo payment flow.
- `PORT` — порт Express server, по умолчанию `3000`.
- `NODE_ENV` — `development` для локального запуска.
- `DB_PATH` — путь к SQLite database.
- `SUBSCRIPTIONS_PATH` — путь к JSON-файлу начального каталога.
- `NOTIFIERS_PATH` — путь к списку дополнительных получателей уведомлений.
- `CLUB_NAME` — demo-название клуба.
- `CLUB_ADDRESS` — demo-адрес клуба.
- `CLUB_PHONE` — demo-телефон клуба.
- `CLUB_HOURS` — demo-часы работы.

Production-only переменные:

- `WEBHOOK_DOMAIN` — домен для Telegram webhook.
- `WEBHOOK_PATH` — путь Telegram webhook.
- `YOOKASSA_WEBHOOK_PATH` — путь YooKassa webhook.
- `YOOKASSA_SHOP_ID` — shop ID YooKassa.
- `YOOKASSA_SECRET_KEY` — secret key YooKassa.

Не храните реальные токены, ID, ключи, телефоны, адреса или клиентские данные в репозитории.

## User Flow

1. Пользователь отправляет `/start`.
2. Бот просит ФИО, телефон и email.
3. Пользователь выбирает абонемент из каталога.
4. В demo mode пользователь проходит mock payment flow.
5. После успешной demo-оплаты бот отправляет confirmation message с demo-данными клуба.

## Admin Flow

Admin-доступ есть только у пользователей из `ADMIN_IDS`.

Команды:

- `/admin` — открыть admin panel.
- `/broadcast` — запустить рассылку.
- `/admins` — управление дополнительными получателями уведомлений.

В admin panel доступны:

- просмотр оплат;
- CSV export;
- broadcast;
- управление абонементами и ценами;
- управление получателями уведомлений.

## Production Notes

Для production требуется:

- подключить и протестировать production YooKassa;
- настроить webhook и сервер;
- проверить `/healthz` после деплоя;
- проверить юридическую часть договора и пользовательских согласий;
- подключить CRM/1C/API клуба;
- добавить мониторинг, backup и error handling;
- проверить безопасность хранения env variables и клиентских данных.

Для long-running deploy можно использовать `pm2.config.js`:

```bash
pm2 start pm2.config.js
```

В production mode нужно заполнить `WEBHOOK_DOMAIN`. Если `TEST_MODE=false`, также обязательны `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY`.

## Vercel Preview

Vercel deployment in this repository is a portfolio preview page with `/api/healthz`.

The repository also includes `/api/telegram` as a Vercel webhook endpoint for demo mode.

Runtime SQLite data on Vercel is temporary. For a real production bot, use an external database or run the long-running Node.js bot on VPS, Railway, Render, Fly.io, or PM2 on a server.

Portfolio preview includes a public Telegram bot link:

```text
https://t.me/FitAdmin2_bot
```

## Portfolio Status

Проект является commercial MVP/demo для портфолио, а не внедрённым production-решением.
