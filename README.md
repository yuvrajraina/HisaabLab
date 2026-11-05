# HisaabLab

HisaabLab is a production-oriented static financial-calculator website for Indian households. It includes ten functioning calculators, six original guides, Indian currency formatting, accessible charts, technical SEO, legal/information pages and disabled-by-default AdSense architecture.

The application has no backend, login or database. Calculator values are processed in the visitor's browser.

## Requirements

- Node.js 20.19 or newer (Node 22 LTS is recommended)
- npm 10 or newer

## Start locally

```bash
npm install
npm run dev
```

Then open `http://localhost:4321`.

## Quality commands

```bash
npm run check     # Astro and strict TypeScript checks
npm run test      # Vitest financial-engine and registry tests
npm run test:seo  # production build + metadata, schema, sitemap and link audit
npm run build     # type check + static production build
npm run verify    # financial tests + production SEO build and audit
npm run preview   # serve the built dist directory
```

## Launch configuration

Copy `.env.example` to `.env` for local production testing. Set:

```dotenv
PUBLIC_SITE_URL=https://hisaablab.in
PUBLIC_CONTACT_EMAIL=your-real-public-contact-address
PUBLIC_ADS_ENABLED=false
PUBLIC_ADSENSE_PUBLISHER_ID=
PUBLIC_ADSENSE_CALCULATOR_SLOT=
PUBLIC_ADSENSE_ARTICLE_SLOT=
```

`PUBLIC_SITE_URL` is deliberately blank by default. Until it is configured, the site emits `noindex,follow`, serves a disallowing `robots.txt`, omits canonical URLs and does not generate a sitemap. This prevents a placeholder or preview origin from being indexed accidentally.

`PUBLIC_CONTACT_EMAIL` must be set before launch. When blank, the contact page displays an honest configuration notice rather than an invented address.

## Cloudflare Workers deployment

1. Push this repository to GitHub.
2. Create a Cloudflare Workers project with Builds from that repository.
3. Configure:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: `22`
4. Add `PUBLIC_SITE_URL` and `PUBLIC_CONTACT_EMAIL` as production environment variables.
5. Leave advertising variables disabled.
6. Deploy, then verify the returned production URL, canonical tags, `robots.txt` and `sitemap-index.xml`.

For a custom domain, attach it to the Worker, wait for TLS activation, set `PUBLIC_SITE_URL` to the final canonical HTTPS origin and rebuild.

## Search launch

After the real domain is live:

1. Verify the domain in Google Search Console using a method controlled by the site owner.
2. Open `/robots.txt` and confirm the production sitemap URL.
3. Submit `/sitemap-index.xml` in Search Console.
4. Inspect the homepage, calculator directory, guide directory and priority calculator URLs.
5. In Cloudflare Redirect Rules, permanently redirect `http://hisaablab.in/*`, `http://www.hisaablab.in/*` and `https://www.hisaablab.in/*` to `https://hisaablab.in/${path}` while preserving the query string.

No ranking, traffic or rich-result outcome is claimed.

## Advertising and AdSense

Advertising code is inert unless both `PUBLIC_ADS_ENABLED=true` and a publisher ID are configured. Do not enable it before account approval, privacy-policy revision and applicable consent setup.

After approval:

1. Add the real `PUBLIC_ADSENSE_PUBLISHER_ID` (`ca-pub-...`).
2. Run `npm run ads:generate` to create `public/ads.txt`; the script refuses blank or malformed IDs.
3. Add the approved numeric calculator and article slot IDs to `PUBLIC_ADSENSE_CALCULATOR_SLOT` and `PUBLIC_ADSENSE_ARTICLE_SLOT`. The AdSense script is injected once only when all required values are valid.
4. Configure a certified consent management platform where Google's rules or applicable law require it.
5. Update the privacy policy to describe actual cookies, processing, providers, retention and choices.
6. Test mobile layout, cumulative layout shift, labelling and ad density before setting `PUBLIC_ADS_ENABLED=true`.

Never make a calculator depend on viewing or clicking an ad. Never put personal financial inputs in ad or analytics events.

## Project structure

```text
src/
├── components/
│   ├── advertising/AdSlot.astro
│   ├── calculators/CalculatorApp.tsx
│   ├── common/
│   └── layout/
├── content/blog/              # editable Markdown guides
├── data/
│   ├── calculators.ts         # typed calculator registry
│   └── references.ts          # primary-source registry
├── layouts/BaseLayout.astro
├── lib/
│   ├── finance.ts             # pure calculation engine
│   └── formatting.ts
├── pages/                     # static routes and dynamic static generators
├── styles/global.css
└── tests/
```

## Adding a calculator

1. Extend `CalculatorId` and add a complete registry entry in `src/data/calculators.ts`.
2. Add a pure calculation function in `src/lib/finance.ts`.
3. Add the UI result mapping in `CalculatorApp.tsx`.
4. Add independent test expectations in `src/tests/finance.test.ts`.
5. Run `npm run verify` and inspect the generated route at `/calculators/<id>/`.

The homepage, directory, footer and related links read from the registry automatically.

## Writing a guide

Add Markdown to `src/content/blog/` with the schema defined in `src/content.config.ts`. Use permanent lowercase slugs, truthful author metadata, strong internal links and primary sources for regulatory claims. Do not insert supposedly current rates, market claims or statistics without dated verification.

## Updating regulations and sources

Primary references live in `src/data/references.ts` and are documented in `docs/SOURCES.md`. For each review:

1. Open the current primary source on the regulator's official domain.
2. Confirm scope: lender type, borrower type, loan purpose, rate type and effective date.
3. Update page wording and the `checked` date.
4. Preserve qualifications; do not turn a scoped rule into a universal claim.
5. Run link and production checks.

## Financial conventions

- Loan rates are nominal annual percentages divided by 12 unless stated otherwise.
- EMIs occur at month end.
- Calculations retain full precision and round only for display.
- Early payoff is capped at the remaining balance.
- Savings contributions occur at month end.
- Hypothetical returns, appreciation and inflation are not forecasts.
- Taxes are excluded unless a calculator explicitly models them.

See each calculator page for specific assumptions and limitations.

## Pre-launch human review

- Confirm the operator identity, address, governing law and final legal language.
- Set and test the real contact email.
- Re-check RBI and other time-sensitive sources.
- Verify state- and property-specific fees are not presented as universal.
- Confirm real Cloudflare headers, redirects and canonical hostname.
- Run mobile and desktop accessibility/performance audits on the deployed origin.
- Review financial models with an appropriately qualified independent professional.
- Configure consent and revise privacy text before enabling any advertising or analytics.

## License

No open-source licence has been selected. Add one only after the site owner chooses the intended reuse terms.
