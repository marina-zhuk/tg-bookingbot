# FitAdmin Bot Validation Checklist

Use this checklist before showing the bot to a client or adding it to a portfolio.

## Environment

- [ ] `.env` exists locally and is not committed.
- [ ] `BOT_TOKEN` uses a demo bot token.
- [ ] `ADMIN_IDS` contains only intended demo admin Telegram IDs.
- [ ] `TEST_MODE=true`.
- [ ] YooKassa keys are empty or demo-only.
- [ ] `.env.example` contains only placeholders.

## Local Start

- [ ] Run `npm install`.
- [ ] Run `npm run dev` or `npm.cmd run dev` on Windows PowerShell.
- [ ] Server starts without missing env errors.
- [ ] Health endpoint responds: `http://127.0.0.1:3000/healthz`.

## Client Flow

- [ ] Send `/start` to the bot.
- [ ] Registration asks for full name.
- [ ] Phone validation accepts a valid demo phone.
- [ ] Email validation accepts a valid demo email.
- [ ] Main menu opens after registration.
- [ ] Membership catalog opens.
- [ ] Single visit opens.
- [ ] Special offers open.
- [ ] Selecting a plan opens the payment screen.

## Mock Payment Flow

- [ ] Payment screen clearly says this is demo/mock payment.
- [ ] Successful mock payment creates a succeeded payment record.
- [ ] Failed mock payment creates a canceled payment record.
- [ ] Bot confirms that real money is not charged.

## Admin Flow

- [ ] `/admin` opens for an ID listed in `ADMIN_IDS`.
- [ ] `/admin` is blocked for non-admin users.
- [ ] Paid clients list opens.
- [ ] Excel report is generated and sent.
- [ ] Broadcast preview opens.
- [ ] Broadcast can be confirmed or canceled.
- [ ] `/admins` notification recipients flow works.
- [ ] Catalog management opens from admin panel.
- [ ] Price/edit/visibility actions work on demo catalog items.

## Public Packaging

- [ ] README has demo links or clear placeholders.
- [ ] Screenshots in `docs/screenshots` use safe demo data.
- [ ] Landing page links are updated before publication.
- [ ] No real phone numbers, emails, tokens, admin IDs, private URLs, or database files are committed.
- [ ] `git check-ignore -v .env data/bot.db logs/app.log .vercel` confirms local sensitive files are ignored.
