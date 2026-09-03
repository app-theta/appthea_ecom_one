# Storefront — React + Bootstrap 5 for the Laravel multi-tenant SaaS API

Vite + React 18 + React Router 6 + Axios + Bootstrap 5.3 (SCSS override).
Every colour, size and radius comes from one theme object applied as CSS custom
properties — no component contains a hex code.

## Run

```bash
cp .env.example .env      # set VITE_API_BASE_URL and VITE_APPTHETA_PUBLIC_KEY
npm install
npm run dev
```

`VITE_API_BASE_URL` is the Laravel app root (no `/api`); `src/api/client.js`
appends `/api`.

> Not run or tested in this environment — treat the first `npm run dev` as the
> smoke test. The one thing worth verifying against your own resources first:
> field names in `src/utils/product.js` (see "Field-name assumptions" below).

## Layout

```
src/
  api/          client.js (axios + headers + envelope unwrap), endpoints.js, errors.js
  theme/        defaultTheme.js, applyTheme.js
  styles/       bootstrap-custom.scss (Bootstrap override), app.css (component layer)
  context/      Business, Auth, Cart, Wishlist, I18n, Toast providers
  hooks/        useAsync.js
  utils/        format.js (money/date/status), product.js (payload readers)
  components/   layout, product, cart, checkout, review, home, ui
  pages/        Home, Products, ProductDetail, Cart, Checkout, Order*, Track, Reels,
                Login, Register, ForgotPassword, NotFound, account/*
  routes/       ProtectedRoute.jsx
```

## Request conventions

* `apptheta_public-key: <VITE_APPTHETA_PUBLIC_KEY>` on **every** request (interceptor).
* `Authorization: Bearer <token>` added whenever a token is in `localStorage`
  (`apptheta.token`). Checkout, `cart/price` and `coupon/apply` work with or without it.
* Responses are unwrapped from `{status, message, data, code}`; `status: false`
  is thrown so it lands in the same error path as an HTTP error.
* `parseApiError` in `src/api/errors.js` normalises **both** error shapes —
  top-level `errors{}` (Laravel validation) and `data.errors[]` (business logic) —
  into `{status, message, fields, list}`.

## Cart & checkout

Cart is client-only (`localStorage` key `apptheta.cart`). Entries carry a local
`meta` object for display which `toApiCart()` strips before any request, so the
payload is exactly the three documented shapes.

`total_price` is the whole-entry price, taken from the backend's own precomputed
`combo_tiers` / `bundles` numbers — nothing is recalculated client-side.
`Checkout` calls `cart/price` immediately before `POST /checkout`; if a line
drifted the user sees "prices were refreshed" instead of a rejection. The
honeypot (`website`, hidden via `.honeypot`) and `form_rendered_at`
(page-load timestamp) are submitted with every order.

COD → `{payment_required: false}` → router push to `/order/success?order=CODE`.
Online → `window.location.href = payment_url`; the gateway returns the browser to
`/order/success` or `/order/cancel`, both of which read `order` and `message`
from the query string.

If a COD attempt is rejected asking for phone verification, `OtpModal` opens,
runs `checkout/otp/send` → `checkout/otp/verify`, then retries the order.

## Feature flags

`business/info` drives the UI. Flags default to **false**, so a tenant with a
partial payload never gets a control it hasn't enabled:

| flag | effect |
| --- | --- |
| `open_cart` | cart drawer opens on add-to-cart |
| `is_coupon` | coupon box on checkout |
| `user_wishlist` | wishlist hearts, header icon, account tab |
| `show_breedcrumb` | breadcrumbs |
| `newsletter_popup` | modal after 6s, once per browser |
| `email_verification` / `phone_verification` | contact-change section in Profile |
| `facebook_status` / `google_status` | social sign-in buttons |
| `enable_customer_point_commission` | points stat on the dashboard |

`payment_methods` decides which payment buttons render; `PAYMENT_MAP` in
`BusinessContext.jsx` maps each flag to the `payment_type` string checkout expects.
`shipping` supplies both area charges and the free-shipping threshold.

## Theming

`src/theme/defaultTheme.js` holds colours, fonts, font sizes, spacing, layout,
shadows, transition. `applyTheme()` writes them to `:root` as `--pink`, `--sp-4`,
`--fs-16`, `--radius`, `--shadow-sm` … and re-points Bootstrap's runtime
variables (`--bs-primary` etc.) at them. When the backend ships the theme API:

```js
fetch('/api/ecom-frontend/business/theme')
  .then((r) => r.json())
  .then((res) => applyTheme(res.data));   // mergeTheme handles partial payloads
```

No component CSS changes. `bootstrap-custom.scss` still carries literal hex for
the Sass-time colour functions (tints, contrast) — keep those in sync with
`defaultTheme` if you change the palette permanently.

## Field-name assumptions

`src/utils/product.js` is the one place that reads product payload shapes, and it
tries several key names per value. Confirm these against
`app/Http/Resources/Frontend/` and trim to the real ones:

* headline price — `barcode.discount_selling_amount`, falling back to `selling_amount`
* variant list — `barcodes[]`; label built from `colour.name` / `size.name` / `sku`
* stock — `barcode.stock` (or `available_stock` / `quantity`)
* images — `images[] | gallery[] | product_images[]`, thumbnail from `thumbnail | image`
* combo — `is_combo`, `combo_type`, `combo_tiers[]` (`combo_qty`, `combo_price`,
  `regular_total`, `savings_amount`, `free_qty`, `eligible_free_products[]`)
* bundles — `bundles[]` (`price`, `regular_total`, `savings_amount`,
  `items[].product`, `items[].quantity`, `items[].unit_price`, `items[].is_current_product`)
* pagination — `meta.current_page` / `last_page` / `total`, or the same keys bare

## Language & currency

Bilingual (বাংলা default, EN toggle in the top bar) from `src/i18n/strings.js`;
`t('key')` falls back English → key. Money renders as `Tk 1,093` via
`money()` in `src/utils/format.js` — change it there only.

## Not built

Policy/CMS pages (`/page/:slug` is linked in the footer but has no page yet),
SEO meta injection (`basic/seo-meta`, `enable_meta_seo`), Facebook Pixel,
live notifications, sub-category drill-down UI, review reply composer
(the endpoint is wired in `endpoints.js`).
