# Hostinger Static Export Deploy

This project now uses Next.js static export (`output: "export"`), so the deploy artifact is the `out/` folder from:

```bash
npm run build
```

## What changed

- App API routes are no longer part of the exported frontend.
- Dynamic pages are exported through placeholder static pages (for example `/resume/_.html`).
- Routing source of truth is `serve.json` (copied to `out/serve.json` during build).
- `npm start` serves static output with `serve` + rewrite rules from `out/serve.json`.

## Required deploy steps

1. Build locally:
   ```bash
   npm install
   npm run lint
   npm run typecheck
   npm run build
   ```
2. Copy/upload full `out/` contents to Hostinger public web root.
3. Verify hard refresh/deep-link URLs:
   - `/resume/<id>`
   - `/cv/<id>`
   - `/cover-letter/<id>`
   - `/reports/<id>`
   - `/shared/<id>`
   - `/career-blog/<slug>`
   - `/career-blog/category/<slug>`
   - `/career-blog/tag/<slug>`
   - `/templates/<category>`
4. Verify API-backed flows:
   - login/signup/session
   - create/edit/save resume/cv/cover letter
   - pricing checkout/confirm/status
   - receipts/billing
5. Verify Panel export proxy settings in production (`Panel/.env`):
   - `RESUME_BUILDER_EXPORT_URL=https://www.resumibuilder.com`
   - `RESUPRO_INTERNAL_API_KEY` matches website `.env`
   - `INTERNAL_EXPORT_KEY` / `RESUME_BUILDER_EXPORT_KEY` matches website `.env`
   - `PANEL_API_BASE_URL=https://panel.resumibuilder.com/public/api`
   - Export proxy target (`RESUME_BUILDER_EXPORT_URL`) must expose:
     - `POST /extract-pdf-text`
     - `POST /generate-pdf`
6. On Panel after env update:
   ```bash
   php artisan optimize:clear
   php artisan config:clear
   ```

## Notes

- Static export does not run Next middleware/proxy or runtime API route handlers.
- Frontend API calls are direct Panel calls via `/rb/*` mapping in `resolveApiUrl`, so legacy API-route forwarding is not required.
- Newman regression should be run with the production runtime environment file once per deployment candidate.
