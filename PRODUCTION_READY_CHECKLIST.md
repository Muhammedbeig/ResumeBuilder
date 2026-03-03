# Production Ready Checklist

## Website (static export)
- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Ensure `out/serve.json` exists and matches root `serve.json`
- Serve with `npm start` (uses `out/serve.json`)

## Website env (`.env`)
- `PANEL_API_BASE_URL=https://panel.resumibuilder.com/public/api`
- `NEXT_PUBLIC_API_URL=https://panel.resumibuilder.com/public`
- `NEXT_PUBLIC_API_BASE_URL=https://panel.resumibuilder.com/public/api/rb`
- `WEBSITE_URL=https://www.resumibuilder.com`
- `NEXT_PUBLIC_WEBSITE_URL=https://www.resumibuilder.com`
- `NEXT_PUBLIC_APP_URL=https://www.resumibuilder.com`
- `INTERNAL_EXPORT_KEY` must match Panel `RESUME_BUILDER_EXPORT_KEY`
- `RESUPRO_INTERNAL_API_KEY` must match Panel `RESUPRO_INTERNAL_API_KEY`

## Panel env (`Panel/.env`)
- `APP_ENV=production`
- `APP_URL=https://panel.resumibuilder.com/public`
- `WEBSITE_URL=https://www.resumibuilder.com`
- `PANEL_API_BASE_URL=https://panel.resumibuilder.com/public/api`
- `RB_AUTH_GOOGLE_STATE_BYPASS_LOCAL=0`
- `RB_AUTH_COOKIE_SECURE=true`
- `RB_AUTH_COOKIE_DOMAIN=.resumibuilder.com`
- `RESUME_BUILDER_EXPORT_URL=https://www.resumibuilder.com`
- `RESUME_BUILDER_EXPORT_KEY` matches website `INTERNAL_EXPORT_KEY`

## Panel runtime prerequisites
- Export proxy target is reachable from Panel host
- Export proxy target implements `POST /extract-pdf-text` and `POST /generate-pdf`

## After env changes on Panel
- `php artisan optimize:clear`
- `php artisan config:clear`
- restart php-fpm/apache service

## Must-pass smoke tests
- `POST /public/api/rb/extract-pdf-text` returns 200
- `POST /public/api/rb/generate-pdf` returns PDF 200
- Google login callback redirects to `/dashboard` without `?error=OAuthCallback`
- Pricing return URL redirect works from resume/cv/cover-letter download flows
