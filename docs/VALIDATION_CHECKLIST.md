# Чеклист проверки FitAdmin Bot

Используй этот чеклист перед тем, как показывать проект клиенту или добавлять его в портфолио.

## Окружение

- [ ] Локальный `.env` создан и не закоммичен.
- [ ] `BOT_TOKEN` — demo token, а не токен клиентского production bot.
- [ ] `ADMIN_IDS` содержит только нужные demo Telegram IDs.
- [ ] `TEST_MODE=true` для portfolio demo.
- [ ] YooKassa keys пустые или demo-only, если реальные платежи не тестируются.
- [ ] `.env.example` содержит только placeholders.

## Автоматические проверки

- [ ] Запустить `npm run lint`.
- [ ] Запустить `npm test`.
- [ ] Проверить, что JS syntax check проходит.
- [ ] Проверить, что smoke-test миграций проходит.
- [ ] Проверить, что каталог абонементов загружается.
- [ ] Проверить, что Express health server создаётся без реальных Telegram API calls.

## Локальный запуск

- [ ] Выполнить `npm install` или `npm ci`.
- [ ] Запустить `npm run dev` или `npm.cmd run dev` в Windows PowerShell.
- [ ] Сервер стартует без missing env errors.
- [ ] Health endpoint отвечает: `http://127.0.0.1:3000/healthz`.

## Клиентский сценарий

- [ ] Отправить `/start` в demo bot.
- [ ] Бот запрашивает ФИО.
- [ ] Валидация телефона принимает корректный demo phone.
- [ ] Валидация email принимает корректный demo email.
- [ ] После регистрации открывается главное меню.
- [ ] Открывается каталог абонементов.
- [ ] Открывается разовое посещение.
- [ ] Открываются спецпредложения.
- [ ] Выбор плана открывает payment screen.

## Mock payment flow

- [ ] Payment screen явно говорит, что это demo/mock payment.
- [ ] Успешная demo-оплата создаёт succeeded payment record.
- [ ] Неуспешная demo-оплата создаёт canceled payment record.
- [ ] Бот явно сообщает, что реальные деньги не списываются.

## Admin flow

- [ ] `/admin` открывается для ID из `ADMIN_IDS`.
- [ ] `/admin` заблокирован для non-admin user.
- [ ] Открывается список оплативших клиентов.
- [ ] Excel report генерируется и отправляется.
- [ ] Broadcast preview открывается.
- [ ] Broadcast можно подтвердить или отменить.
- [ ] `/admins` flow для получателей уведомлений работает.
- [ ] Catalog management открывается из admin panel.
- [ ] Изменение цены/видимости/demo catalog items работает.

## Портфолио-упаковка

- [ ] README понятен русскоязычному клиенту.
- [ ] README явно говорит, что это portfolio demo/adaptable service example.
- [ ] Live demo link работает.
- [ ] Telegram demo bot link работает.
- [ ] Screenshots используют безопасные demo data.
- [ ] GitHub repository имеет понятное русское описание.
- [ ] В репозитории нет реальных телефонов, email, tokens, admin IDs, private URLs, database files или logs.
- [ ] `git check-ignore -v .env data/bot.db logs/app.log .vercel` подтверждает, что sensitive local files игнорируются.

## Перед production adaptation

- [ ] Заменить demo branding, prices, screenshots и copy.
- [ ] Решить, нужны ли реальные payments.
- [ ] Если payments нужны — подключить provider и legal texts.
- [ ] Заменить serverless/runtime SQLite на persistent database или VPS storage.
- [ ] Добавить backups, monitoring и operational logging.
- [ ] Провести security review для персональных данных и admin access.
