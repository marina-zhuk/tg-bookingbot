# FitAdmin Bot — Telegram-бот для фитнес-клуба

**FitAdmin Bot** — portfolio demo Telegram MVP для вымышленного фитнес-клуба **FitAdmin Demo Club**.

Проект показывает, как клуб может принимать заявки на абонементы прямо в Telegram: пользователь открывает бот, проходит регистрацию, смотрит каталог, выбирает абонемент и проходит demo/mock payment flow. Администратор открывает admin panel, видит оплативших клиентов, выгружает Excel-отчёт оплат, запускает рассылку и управляет demo-каталогом.

Бизнес-проблема: фитнес-клубу нужен быстрый MVP для сбора лидов, демонстрации абонементов и базовой коммуникации с клиентами без сложной CRM на старте.

Подходит для:

- фитнес-клубов;
- студий танцев;
- йога-студий;
- спортивных секций;
- школ и курсов;
- салонов и локальных сервисных бизнесов с абонементами или пакетами услуг.

## Возможности

Реализовано:

- просмотр абонементов и спецпредложений;
- оформление заявки через регистрацию: ФИО, телефон, email;
- mock payment flow;
- успешная demo-оплата;
- неуспешная demo-оплата;
- admin panel через команду `/admin`;
- доступ администраторов через `ADMIN_IDS`;
- дополнительные получатели уведомлений через `/admins`;
- broadcast-рассылки по пользователям, которые открывали бот;
- SQLite-хранилище для пользователей, посетителей и платежных записей;
- статусы платежей: `pending`, `succeeded`, `canceled`;
- Excel-отчёт оплативших клиентов в формате `.xlsx`;
- управление абонементами, ценами и спецпредложениями из admin panel;
- ежедневный отчет администраторам через `node-cron`.

За пределами текущего demo scope:

- отдельная CRM-воронка со сменой статуса клиента админом;
- UI для управления ролями администраторов;
- синхронизация с внешней CRM, 1C или Google Sheets;
- интеграция с сервером клуба как future integration;
- production payment flow с реальным платежным провайдером.

## Stack

Реальный stack проекта:

- Node.js CommonJS;
- Telegraf;
- Express;
- SQLite через `node:sqlite`;
- Telegram Bot API;
- YooKassa SDK как подготовка к будущей интеграции;
- `node-cron` для ежедневного отчета;
- `exceljs` для Excel-отчёта оплат в формате `.xlsx`;
- `dotenv` для env variables;
- `nodemon` для локального dev-запуска;
- Vercel-ready структура для portfolio landing и API endpoints.

## Demo limitations

- Payment flow работает в mock/demo mode.
- Production payment provider входит в future integration scope.
- Интеграция с сервером клуба входит в future integration scope.
- Данные клуба, цены и пользовательские примеры вымышленные.
- Проект предназначен для портфолио и демонстрации commercial MVP.
- Runtime SQLite на Vercel подходит только для demo preview. Для production нужна внешняя база данных.
- YooKassa credentials не нужны для demo mode.

## Mock payment flow

В демо-версии реализован mock payment flow: успешная и неуспешная оплата проходят в безопасном demo mode без реального списания денег. Архитектура подготовлена к будущей интеграции с ЮKassa / CloudPayments / другой платежной системой.

В пользовательском сценарии бот явно сообщает:

- “Это демо-оплата для портфолио.”
- “Payment flow работает в demo mode.”
- “В демо доступны сценарии успешной и неуспешной оплаты.”
- “Реальные деньги не списываются.”

Кнопки demo-оплаты:

- `✅ Демо: успешная оплата`;
- `❌ Демо: неуспешная оплата`.

## Env variables

Создайте `.env` на основе `.env.example`. Реальные токены, admin IDs, payment keys и private webhook URLs не должны попадать в GitHub.

Минимум для demo-запуска:

```env
BOT_TOKEN=your_demo_telegram_bot_token
ADMIN_IDS=your_numeric_telegram_id
TEST_MODE=true
```

Полный пример:

```env
BOT_TOKEN=your_demo_telegram_bot_token
ADMIN_IDS=your_numeric_telegram_id
TEST_MODE=true

YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=

WEBHOOK_DOMAIN=https://your-demo-domain.example
WEBHOOK_PATH=/telegram
YOOKASSA_WEBHOOK_PATH=/webhook/yookassa

PORT=3000
NODE_ENV=development

DB_PATH=./data/bot.db
SUBSCRIPTIONS_PATH=./config/subscriptions.json
NOTIFIERS_PATH=./config/notifiers.json

CLUB_NAME=FitAdmin Demo Club
CLUB_ADDRESS=Demo City, 10 Portfolio Street
CLUB_PHONE=+7 000 000-00-00
CLUB_HOURS=Пн-Пт 07:00-22:00, Сб-Вс 09:00-21:00
```

Что означают основные переменные:

- `BOT_TOKEN` — token demo-бота из BotFather.
- `ADMIN_IDS` — numeric Telegram IDs администраторов через запятую.
- `TEST_MODE=true` — включает mock payment flow и не требует YooKassa credentials.
- `DB_PATH` — путь к локальной SQLite database.
- `SUBSCRIPTIONS_PATH` — путь к JSON-файлу с demo-каталогом.
- `NOTIFIERS_PATH` — путь к списку дополнительных получателей уведомлений.
- `CLUB_*` — вымышленные demo-данные клуба для сообщений бота.

## Local setup

Установить зависимости:

```bash
npm install
```

Создать `.env`:

```bash
cp .env.example .env
```

На Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Запустить dev mode:

```bash
npm run dev
```

На Windows PowerShell, если `npm.ps1` заблокирован script policy:

```bash
npm.cmd run dev
```

Production-like start:

```bash
npm start
```

## Checklist локальной проверки

- Отправить `/start` в Telegram-бот.
- Проверить приветствие с брендом `FitAdmin Demo Club`.
- Пройти регистрацию: ФИО, телефон, email.
- Открыть каталог абонементов.
- Выбрать абонемент.
- Проверить successful demo payment.
- Проверить failed demo payment.
- Убедиться, что бот пишет: реальные деньги не списываются.
- Открыть `/admin` с Telegram ID из `ADMIN_IDS`.
- Проверить, что неадмин получает отказ в доступе.
- Проверить список оплативших.
- Проверить Excel-отчёт оплат.
- Проверить broadcast flow.
- Проверить управление demo-каталогом, если нужно показать admin tools.

Если старый каталог уже был загружен в `data/bot.db`, новые demo-цены из `config/subscriptions.json` могут не появиться автоматически. Для чистого локального demo-теста используйте отдельную локальную demo database, не production data.

## Deploy notes

Проект подготовлен для portfolio preview на Vercel:

- `/` показывает static landing из `public/index.html`;
- `/api/healthz` возвращает health response;
- `/api/telegram` подготовлен как Telegram webhook endpoint.

Локально бот запускается в polling mode через `npm run dev`. На Vercel polling не используется: Telegram должен отправлять updates в webhook URL:

```text
https://your-vercel-domain.vercel.app/api/telegram
```

Для Vercel demo:

1. Добавьте env variables в Vercel Project Settings.
2. Используйте отдельный demo bot token, не production bot.
3. Оставьте `TEST_MODE=true` для portfolio demo и mock payment flow.
4. Подключите Telegram webhook вручную через Telegram Bot API на `/api/telegram`.
5. Для production storage используйте внешнюю database/storage вместо runtime SQLite на Vercel.
6. Для production нужны внешний database/storage, стабильный webhook delivery, мониторинг, backups и юридически проверенный payment flow.

На Vercel serverless endpoint `api/telegram.js` по умолчанию использует временные пути:

```env
DB_PATH=/tmp/bot.db
NOTIFIERS_PATH=/tmp/notifiers.json
SUBSCRIPTIONS_PATH=./config/subscriptions.json
```

Это подходит для portfolio demo preview. Данные могут сбрасываться между cold starts/deploys, поэтому такой storage не позиционируется как production-ready.

Также Vercel serverless endpoint работает как webhook handler, а не как long-running process. Ежедневный отчет через `node-cron` рассчитан на long-running запуск `src/index.js`, а не на serverless route.

Минимальные env variables для Vercel demo:

```env
BOT_TOKEN=your_demo_telegram_bot_token
ADMIN_IDS=your_numeric_telegram_id
TEST_MODE=true
CLUB_NAME=FitAdmin Demo Club
CLUB_ADDRESS=Demo City, 10 Portfolio Street
CLUB_PHONE=+7 000 000-00-00
CLUB_HOURS=Пн-Пт 07:00-22:00, Сб-Вс 09:00-21:00
```

`WEBHOOK_DOMAIN` и `WEBHOOK_PATH` нужны для long-running Node.js production-like запуска из `src/index.js`, но serverless endpoint на Vercel использует route `/api/telegram` из `vercel.json`.

## Portfolio value

Проект показывает потенциальному клиенту:

- как быстро запустить Telegram MVP для продажи абонементов;
- как собирать заявки без отдельного сайта или сложной CRM;
- как показать каталог услуг прямо в Telegram;
- как разделить client flow и admin flow;
- как хранить пользователей, платежные записи и статусы платежей в базе;
- как подготовить mock payment demo без реального списания денег;
- как сделать простой Excel-отчёт оплат для менеджера;
- как запускать рассылки по базе пользователей;
- как подготовить архитектуру к будущим production integrations.

## Адаптация под другие бизнесы

Проект можно адаптировать под:

- фитнес-клубы;
- студии танцев;
- йога-студии;
- спортивные секции;
- школы и курсы;
- салоны;
- локальные сервисные бизнесы с абонементами или пакетами услуг.

Что обычно меняется:

- бренд и тексты;
- каталог услуг;
- цены;
- сценарий заявки;
- admin recipients;
- landing page;
- будущая payment/database integration.

## Screenshots

Real Telegram screenshots are stored in `docs/screenshots`.

Personal contact data in CRM/report/payment screenshots is redacted and replaced with demo placeholders before publication.

Files:

- `/docs/screenshots/client-menu.png`
- `/docs/screenshots/subscription-flow.png`
- `/docs/screenshots/mock-payment.png`
- `/docs/screenshots/admin-panel.png`
- `/docs/screenshots/admin-subscriptions.png`
- `/docs/screenshots/crm.png`
- `/docs/screenshots/excel-report.png`
- `/docs/screenshots/broadcasts.png`

## Security notes

Не публикуйте в GitHub:

- реальные Telegram bot tokens;
- реальные admin IDs;
- YooKassa / CloudPayments keys;
- реальные данные клиентов;
- реальные адреса и телефоны клуба;
- private webhook URLs;
- локальную SQLite database из папки `data`;
- `.env`.

Для GitHub используйте только `.env.example` с placeholder-значениями.
