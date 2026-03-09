# Izletnicka Online Form

Mobile-first public checkout form for **Scenario 3** (`POST /api/v2/ITPayments/public/checkout`).

## Stack

- Static HTML/CSS/JS (Netlify-ready, no build step)
- Single configured API base URL from `config.js`

## Run locally

Open `index.html` directly, or use a static server:

```powershell
cd C:\DEV-ITAS\IzletnickaOnlineForm
python -m http.server 5500
```

Then open: `http://localhost:5500`

## Configuration

Edit `config.js`:

- `apiBaseUrl` -> API URL this site should call
- `localApiBaseUrl` -> API URL used only when site is opened from `localhost` / `127.0.0.1`

## API payload sent

```json
{
  "agencyName": "W Touristic",
  "guideName": "Ilija Todorovic",
  "guideEmail": "guide@example.com",
  "guidePhone": "+38267123456",
  "reference": "INT-001",
  "note": "Optional note",
  "brojOsoba": 12,
  "voucherDate": "2026-03-09T00:00:00",
  "locale": "me"
}
```

## Netlify deployment

- Publish directory: repository root (`.`)
- No build command required
- Update `config.js` with test/prod API URLs before deploy
- Set `PrestoIT:PublicReturnBaseUrl` to:
  - `https://<your-netlify-domain>/payment/public-result`
  - Presto redirect includes `/{merchantOrderId}`, and Netlify route rewrite is already configured in `netlify.toml`

## Branding assets

- `assets/background.png`
- `assets/to_kotor_logo.png`

Both are taken from existing TO Kotor mobile assets.
