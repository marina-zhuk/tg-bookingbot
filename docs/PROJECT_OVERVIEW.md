# FitAdmin Bot Project Overview

## Goal

FitAdmin Bot is a portfolio/commercial MVP demo for a fitness club Telegram bot. The goal is to show a compact business flow: registration, catalog selection, mock payment, admin management, reporting, and broadcasts.

## Users

The client user is a potential club member who opens the bot, registers, views memberships or services, and tests a safe mock payment scenario.

The administrator is a club manager with a Telegram ID listed in `ADMIN_IDS`. The admin can open the admin panel, view paid clients, export an Excel report, run broadcasts, manage notification recipients, and update catalog items.

## Business Tasks Covered

- Capture client contact data.
- Present membership and service options.
- Demonstrate successful and failed payment outcomes without charging money.
- Store users, visitors, payments, catalog data, and admin changes in SQLite.
- Give the admin a practical Telegram-based control panel.
- Export paid-client data to Excel.
- Send broadcasts to users who opened the bot.

## Demo vs Production-Ready

Demo parts:

- Mock payment flow.
- Demo club data.
- Local SQLite storage.
- Portfolio screenshots and landing content.
- Vercel preview/serverless setup for demonstration.

Production-ready foundations:

- Clear client and admin scenarios.
- Env-based secrets handling.
- Admin access through `ADMIN_IDS`.
- Structured SQLite schema.
- Catalog and report services.
- Safe separation of demo payment mode through `TEST_MODE`.

## Needed Before Real Client Use

- Connect and fully test a real payment provider such as YouKassa or CloudPayments.
- Use persistent production database/storage.
- Configure reliable webhook hosting.
- Add monitoring, backups, and operational logging.
- Review legal/payment texts with the client.
- Add proper security review for production data.
- Replace demo branding, prices, screenshots, and links with real client materials.
