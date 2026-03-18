# Backend (Node.js + Express + MongoDB + Ethers)

## Setup

1. Install dependencies

```bash
cd backend
npm install
```

2. Create `.env`

Copy `./.env.example` to `./.env` and fill values:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `CHAIN_RPC_URL`, `CHAIN_ID`, `CONTRACT_ADDRESS`, `RELAYER_PRIVATE_KEY`

3. Run

```bash
npm run dev
```

Health check: `GET /health`

## Key APIs

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)

### Institutions (admin)
- `POST /api/institutions`
- `POST /api/institutions/:institutionId/status`
- `GET /api/institutions`

### Certificates
- `POST /api/certificates/issue` (INSTITUTION or ADMIN; admin must pass `institutionId`)
- `GET /api/certificates/:certificateId` (role-gated)

### Verification
- `GET /api/verify/:certificateId` (public; logs verification)
- `POST /api/verify/hash` (public; logs verification)

