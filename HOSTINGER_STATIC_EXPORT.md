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
  - support optional `/api/*` forwarding to Panel

## Required deploy steps

1. Build locally:
   ```bash
   npm install
   npm run lint
   npm run typecheck
   npm run build
   ```
2. Open `public/.htaccess` and configure API forwarding:
   - Uncomment **Option A** and set your Panel API host, or
   - Uncomment **Option B** if Panel API is under same domain path.
3. Copy/upload full `out/` contents to Hostinger public web root.
4. Verify hard refresh/deep-link URLs:
   - `/resume/<id>`
   - `/cv/<id>`
   - `/cover-letter/<id>`
   - `/reports/<id>`
   - `/shared/<id>`
   - `/career-blog/<slug>`
   - `/career-blog/category/<slug>`
   - `/career-blog/tag/<slug>`
   - `/templates/<category>`
5. Verify API-backed flows:
   - login/signup/session
   - create/edit/save resume/cv/cover letter
   - pricing checkout/confirm/status
   - receipts/billing

## Notes

- Static export does not run Next middleware/proxy or `app/api/*`.
- If `/api/*` forwarding is not configured on Hostinger, authenticated and data-saving flows will fail.
- Newman regression can be run after you add/import Postman collections in this repo (none were present at implementation time).
