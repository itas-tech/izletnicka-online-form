# Izletnicka Online Form

Mobile-first public checkout form for **Scenario 3** (`POST /api/v2/ITPayments/public/checkout`).

## Stack

- Static HTML/CSS/JS (Netlify-ready, no build step)
- Single configured API base URL from `config.js`
- Built-in localization (`ME` / `EN`) on the public form

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

## API endpoints used

- `GET /api/v2/ITPayments/public/countries` (loads country picker)
- `POST /api/v2/ITPayments/public/checkout`

## API payload sent

```json
{
  "agencyName": "Sample Agency",
  "guideName": "Sample Guide",
  "guideEmail": "guide@example.com",
  "reference": "INT-001",
  "note": "Optional note",
  "brojOsoba": 12,
  "guestsByCountry": [
    {
      "drzavaID": 1,
      "brojOsoba": 8
    },
    {
      "drzavaID": 44,
      "brojOsoba": 4
    }
  ],
  "locale": "me"
}
```

`voucherDate` is no longer sent by the form UI. Backend uses current server datetime when it is omitted.

## Netlify deployment

- Publish directory: repository root (`.`)
- No build command required
- Update `config.js` with test/prod API URLs before deploy
- Set `PrestoIT:PublicReturnBaseUrl` to:
  - `https://visitortax.tokotor.online/payment/public-result`
  - Presto redirect includes `/{merchantOrderId}`, and the static-site route rewrite is already configured in `netlify.toml`

## Branding assets

- `assets/background.png`
- `assets/to_kotor_logo.png`

Both are taken from existing TO Kotor mobile assets.
