# Web Portal (React)

## Setup

```bash
cd web-portal
npm install
```

Create `.env`:

- Copy `./.env.example` to `./.env`
- Set `VITE_API_BASE_URL` (backend URL)

Run:

```bash
npm run dev
```

## Pages

- `/verify` Verification portal (public)
- `/login` Login
- `/institution` Institution dashboard (requires `INSTITUTION` login)
- `/admin` Admin panel (requires `ADMIN` login)

