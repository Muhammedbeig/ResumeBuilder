# Active API Collection (Website + Panel Internal)

## Files

- `resupro-active-apis.postman_collection.json`
- `resupro-active-apis.postman_environment.json`
- `newman-active-apis-report.json` (generated report)

## Run with Newman

```powershell
newman run active-apis/resupro-active-apis.postman_collection.json -e active-apis/resupro-active-apis.postman_environment.json -r "cli,json" --reporter-json-export active-apis/newman-active-apis-report.json --insecure
```

## Notes

- `packageId` default is set to `4` (valid paid package in this local setup).
- `nextBaseUrl` is set to `https://www.resumibuilder.com`.
- `panelApiBaseUrl` is set to `https://panel.resumibuilder.com/public/api`.
- `panelBaseUrl` is set to `https://panel.resumibuilder.com/public/api/internal`.
- Fixture paths use `active-apis/fixtures/sample.pdf` and `active-apis/fixtures/receipt.jpg`.
- Environment includes helper payload variables for manual POST testing.
