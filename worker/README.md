# Worker Service (Local)

This folder runs the legacy API handlers as a dedicated worker for Panel `/api/rb/*` proxy routes.

## Start

```bash
npm run worker:dev
```

It listens on `http://127.0.0.1:3010`.

## Required Panel env

In `C:\xampp\htdocs\Panel\.env`:

```env
RB_WORKER_BASE_URL=http://127.0.0.1:3010
RB_WORKER_INTERNAL_KEY=local-rb-worker-key
```

Then run:

```bash
php artisan config:clear
php artisan cache:clear
```

## Notes

- Worker routes are mounted under `/api/*`.
- AI/PDF/market-value calls from Panel `/api/rb/*` now proxy to this worker.
