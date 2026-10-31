# Gateway preset sources

All numbers in `src/data/gateway-presets.js` were read from the official pages below on 2026-10-29. Pages were fetched with a fetch/index tool or a real browser (for JS-rendered pages). Search-engine summaries were used only to locate URLs, never as a number source.

## Included

### Stripe
- https://docs.stripe.com/testing (es-MX rendering)
- Verified: Visa 4242..., MX Visa 4000004840008001, generic decline 0002, insufficient funds 9995, expired 0069, incorrect CVC 0127, always-authenticate 3DS 3184, Radar always-blocked 4100000000000019. Rule: any future date, any 3-digit CVC (4 for Amex).

### Mercado Pago (Mexico)
- https://www.mercadopago.com.mx/developers/es/docs/your-integrations/test/cards
- Verified: 5 test cards (all expiry 11/30, CVV 123; Amex 1234) and the cardholder-name table (APRO, OTHE, CONT, CALL, FUND, SECU, EXPI, FORM...). The outcome is driven by the name, so a single number appears with several outcomes. The page did not state document-number rules for Mexico.
- Note: the URL `.../checkout-api-orders/integration-test/test-cards` redirects to an overview page and was not used.

### Conekta
- https://developers.conekta.com/docs/pruebas-tarjetas
- Verified: success cards (Visa 4242, Mastercard 4444), error table: insufficient_funds 0127, card_declined 0002, invalid_cvc 0085, invalid_expiration_date 4765881487764268, suspicious_behaviour 4000000000004954, call_issuer 4134067352736334. Name/CVC random, any future expiry.
- Not used: the 3DS test cards on https://developers.conekta.com/docs/activar-3d-secure-2 (not fetched, so excluded).

### Openpay (Mexico)
- https://documents.openpay.mx/docs/testing.html (JS-rendered, read via browser)
- Verified: valid cards, error cards 3001-3005, selective authentication card 5454545454545454. Note `www.openpay.mx/docs/testing.html` returns an empty SPA shell.

### NetPay (Mexico)
- https://docs.netpay.com.mx/reference/matriz-de-pruebas-2
- Verified: accepted, 3DS accepted, 3DS rejected and directly rejected matrices. Outcome depends on email (accept@/reject@/review@netpay.com.mx; emails decoded from Cloudflare obfuscation).
- Excluded entry: Mastercard "520000000000249" (15 digits) in the 3DS-rejected table looks like a typo in the docs, so it was not shipped.

### Kushki (Mexico)
- https://docs.kushki.com/mx/getting-started/testing-your-integration/
- Verified: approved 5451951574925480 and the decline cards (017, 019, 021, 022, 023). CVV, postal code any; expiry any future date.

### Clip
- https://developer.clip.mx/reference/pruebas
- Verified: table of 60+ cards with Paid/Rejected and reason (Not sufficient funds, Do not honor, Restricted card, Exceeds withdrawal amount limit). Eight MX-issued cards were selected. Applies only to Checkout Transparente and Refunds with test credentials.

### Extras
- PayU Latam (Mexico): https://developers.payulatam.com/latam/en/docs/getting-started/test-your-solution.html. Verified Mexico card list and the APPROVED/REJECTED name, CVV and month rules. The antifraud emails (approved@payu.com, etc.) are on the page but not encoded in presets.
- dLocal: https://docs.dlocal.com/docs/make-a-test-payment and https://docs.dlocal.com/docs/3d-secure. Verified description codes 200/300/302 and the 3DS card table. 4111111111111111 appears only as the example card in the official request, not in a dedicated "test cards" list.
- Adyen: https://docs.adyen.com/development-resources/test-cards-and-credentials/test-card-numbers, https://docs.adyen.com/development-resources/testing/3d-secure-2-authentication and https://docs.adyen.com/development-resources/testing/result-codes. Verified cards (expiry 03/2030, CVC 737) and holderName refusal values. 4212345678910006 as "challenge" comes from the 3DS2 page table; the challenge label was taken from a search summary of that page and the table itself did not show the scenario label in the extracted rows, so treat the label as less certain.

## Excluded

- Billpocket: no public test card list. Its old Confluence docs are archived and point to Kushki card-present docs (https://api-docs.kushkipagos.com/docs/card-present-mexico-bp/home), which were not fetched. The help center says sandbox access requires onboarding with their integrations team. No numbers invented.

## Removed during review

- Adyen `4212345678910006` (3DS2 challenge): scenario label could not be verified on the fetched docs page, so it was removed rather than shipped unverified.
