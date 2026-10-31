# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Chrome extension, Manifest V3. Vanilla JavaScript with native ES modules, no build step and no runtime dependencies. pnpm is used only for dev tooling (vitest, packaging, store screenshots). Distributed through the Chrome Web Store.

## Users

About 80 active installs (Chrome Web Store stats, 2026-10). Top countries: United States, Japan, Argentina. Install languages: Spanish, English (US), English (UK). Users are developers and QA engineers testing payment checkouts against gateway sandboxes; they open the popup many times per session, mid-flow, with a payment form already on screen.

## Product Purpose

Keep test card numbers one click away, grouped by environment, so a tester can copy the right number for the scenario they want (approved, declined, insufficient funds) without hunting through gateway docs. Success: open, pick, copy in under two seconds.

## Positioning

Environment-grouped, user-editable test card sets with ready-to-import packs for the gateways LatAm developers actually integrate (Stripe, Mercado Pago, Conekta, OpenPay and others), stored only on the device.

## Operating Context

- Opened from the Chrome toolbar while a checkout page is in another tab; popup max 800x600 px.
- Teams share card sets as JSON files.
- Only test/sandbox numbers belong here; real cards must never be stored.

## Capabilities and Constraints

- Copy card number on click; add cards via form or JSON; manage environments.
- Data stored locally only; nothing is transmitted.
- Chrome Web Store policies apply: minimal permissions, no remote code, privacy disclosures must match behavior, no card-number generators (fraud policy risk).
- Adding a permission with an install warning disables the extension for existing users until they accept it; avoid such permissions.
- Existing user data lives in `localStorage` key `creditCardEnvironments` and must survive every update.
- UI languages: Spanish (default) and English via `_locales`.

## Brand Commitments

- Name: "Tarjetas de Crédito de Prueba" (listing name). Repository: test-card-hub.
- No donation or payment links: a Stripe payment link was removed in v3 after it was abused for card-testing fraud.

## Evidence on Hand

- Install stats above. No testimonials, reviews or case studies on hand; do not fabricate any.

## Product Principles

1. Speed of the copy action beats everything else on the main screen.
2. The outcome of each card (approved, declined, ...) must be readable at a glance.
3. Never put user data at risk: local only, validate every import, warn on numbers that look real.
4. Ship nothing the store review would question: minimal permissions, honest listing.

## Accessibility & Inclusion

Full keyboard operation (copy by number keys, focus-visible states), WCAG AA contrast in light and dark, respects reduced motion.
