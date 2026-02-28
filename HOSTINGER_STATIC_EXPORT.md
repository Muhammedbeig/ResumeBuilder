# Hostinger Static Export Deploy

This project now uses Next.js static export (`output: "export"`), so the deploy artifact is the `out/` folder from:

```bash
npm run build
```

## What changed

- App API routes are no longer part of the exported frontend.
- Dynamic pages are exported through placeholder static pages (for example `/resume/_.html`).
- `public/.htaccess` is included to:
  - map dynamic URLs to placeholder pages
  - provide `.html` fallback routing
  - serve static assets and route rewrites only

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

## Notes

- Static export does not run Next middleware/proxy or runtime API route handlers.
- Frontend API calls are direct Panel calls via `/rb/*` mapping in `resolveApiUrl`, so legacy API-route forwarding is not required.
- Newman regression can be run after you add/import Postman collections in this repo (none were present at implementation time).
