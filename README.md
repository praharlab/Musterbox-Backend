# MusterBox Backend

MusterBox Backend is the server-side application for the MusterBox HRMS platform. It is built with Node.js, Express, Sequelize, PostgreSQL, Socket.IO, and cron-based background jobs.

## Local seed state

The database has been reset to a blank slate. Only the platform super admin and its company exist. Everything else such as client companies, subscriptions, roles, and employees must be created through the UI.

## Requirements

Before running this project, make sure you have the following installed:

- Node.js 18+ (recommended: LTS)
- npm
- PostgreSQL database
- Git
- Optional: PostgreSQL client tools for local DB management

## Project dependencies

This backend uses:

- Express.js for the REST API
- Sequelize ORM
- PostgreSQL as the main database
- Socket.IO for real-time communication
- Node-cron for scheduled jobs
- dotenv for environment variables
- Nodemailer for email sending
- Firebase Admin for push notifications

## Environment setup

1. Open the project folder.
2. Copy the example environment file:

   Windows PowerShell:
   ```powershell
   Copy-Item .env.example .env
   ```

   Linux/macOS:
   ```bash
   cp .env.example .env
   ```

3. Fill in the values in the `.env` file.

### Required environment variables

At minimum, configure the database and app security values:

```env
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name
DB_DIALECT=postgres
DB_PORT=5432

SECRETKEY=your_jwt_secret
PASSWORD=your_hmac_secret
SECRETKEYFORENCODING=your_encoding_secret
APIURL=http://localhost:3000/
NODE_ENV=development

HOSTMAIL=your_smtp_host
USEREMAIL=your_sender_email
PASS=your_smtp_password
SMTPUSEREMAIL=your_smtp_user
```

Additional optional values may be required depending on features you use, such as:

- ERP database (`ERP_SERVER`, `ERP_PORT`, `ERP_USER`, `ERP_PASSWORD`, `ERP_DATABASE`)
- Biometric DB (`BIOMETRICS_SERVER`, `BIOMETRICS_PORT`, `BIOMETRICS_USER`, `BIOMETRICS_PASSWORD`, `BIOMETRICS_DATABASE_SELF`, `BIOMETRICS_DATABASE_THIRD_PARTY`)
- Firebase notification credentials (`FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON`)
- Face recognition API (`FACE_API_URL`)
- SMTP mail values for outgoing emails
- App branding values (`PROJECT_NAME`, `APP_URL`, `PREBOARDING_APP_URL`)

> Important: do not commit the `.env` file. It is intended for local secrets and should remain untracked.

## Install dependencies

Run:

```bash
npm install
```

## Database migration

This project uses Sequelize migrations. Run the migration command after creating the database and entering credentials in `.env`:

```bash
npm run migration:run
```

## Start the application

Development mode:

```bash
npm run dev
```

Or normal server mode:

```bash
npm start
```

The backend starts on port `3000` by default, as defined in `app.js`.

## Common scripts

```bash
npm run dev
npm start
npm run migration:run
npm run format
npm run lint
```

## Notes

- The application loads environment variables via `dotenv`.
- If database connection fails, confirm that PostgreSQL is running and the credentials in `.env` are correct.
- If email or notification features are not working, make sure the SMTP and Firebase values are configured.
- The project may include integrations that are optional and only needed for certain modules.

## Useful quick checklist

1. Install Node.js and npm
2. Create PostgreSQL database
3. Copy `.env.example` to `.env`
4. Add database and app secrets
5. Run `npm install`
6. Run `npm run migration:run`
7. Start the server with `npm start`

## Project structure overview

- `app.js` – server entry point
- `router.js` – route registration
- `config/` – database and environment config
- `controllers/` – request handlers
- `models/` – Sequelize models
- `routes/` – API endpoints
- `middleware/` – auth and request middleware
- `utils/` – helper utilities and export logic
- `validators/` – request validation schemas

If you want, I can also expand this README with a section for API route groups or add a full project architecture summary.

