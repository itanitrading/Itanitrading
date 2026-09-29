# ItaniTrading

Two separate experiences:

- `/` = public customer ordering page
- `/admin` = private admin login/dashboard

The customer never receives the admin controls. Product and order APIs that modify/read private data require an authenticated admin session.

## Run
1. Install Node.js 18+.
2. Copy `.env.example` to `.env` and change `ADMIN_PASSWORD`, `WHATSAPP_NUMBER`, and `SESSION_SECRET`.
3. Run `npm install`
4. Run `npm start`
5. Open `http://localhost:5000/`
6. Admin: `http://localhost:5000/admin`

Replace `icon-192.png` and `icon-512.png` with your ItaniTrading logo.

For production, deploy the Node server behind HTTPS and set secure cookies.