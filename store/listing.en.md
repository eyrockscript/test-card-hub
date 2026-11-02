# Chrome Web Store listing (English)

## Name (max 75 characters)

Test Credit Cards for Payment Sandboxes

(Spanish listing keeps "Tarjetas de Crédito de Prueba".)

## Summary (max 132 characters)

Copy sandbox test card numbers in one click, grouped by environment. Packs for Stripe, Mercado Pago, Conekta and more.

(118 characters. The manifest extDescription is similar; this version can replace it.)

## Detailed description (plain text)

Keep the test card numbers of your payment sandboxes one click away.

Test Credit Cards stores card numbers that payment gateways publish for sandbox testing, grouped by environment (development, staging, a client project). Open the popup next to your checkout, pick the scenario you need (approved, declined, insufficient funds) and copy the number.

What you can do:
• Copy a card with a click, or press keys 1 to 9.
• Search with "/".
• Copy the expiry date, CVV and postal code with one-click chips.
• Add a card with a form: it detects the brand, checks the Luhn digit and warns you when a number is not a known test number.
• Import cards from a JSON file, or add a ready-made pack of sandbox cards for popular payment gateways, with numbers taken from each gateway's official docs.
• Rename environments, delete cards or environments (with undo), edit the JSON, and export or import a backup file.
• Light and dark theme that follows your system, and a Spanish/English switch.
• Open the popup with Alt+Shift+K.

For sandbox and test environments only. Do not store real payment cards in this extension. It does not generate card numbers.

Privacy: everything stays in your browser (chrome.storage.local). The extension makes no network requests, has no analytics, and asks for a single permission: "storage". Fonts are bundled.

If you used version 2, your data migrates automatically.

## Category

Developer Tools

## Single purpose statement

Store and copy payment-gateway sandbox test card numbers, organized by environment, so developers and QA testers can fill checkout forms in test environments.

## Permission justification: storage

The extension saves the user's environments and test cards (plus the language choice, the last selected environment and local counters for the rating invitation) in chrome.storage.local so they persist between browser sessions. No other permission is requested: no host permissions, no tabs, no clipboard permissions, no remote code. Copying uses the user's click inside the popup.

## Privacy practices tab

Data usage disclosure (what to tick):
• Personally identifiable information: not collected
• Health information: not collected
• Financial and payment information: not collected (see note below)
• Authentication information: not collected
• Personal communications: not collected
• Location: not collected
• Web history: not collected
• User activity: not collected
• Website content: not collected

Note on the financial field: the extension stores only sandbox test card numbers that the user types, pastes or imports, and they never leave the device (chrome.storage.local, no network access, connect-src 'none' in the CSP). Because the developer receives nothing, leave the box unticked. If the review form asks, answer: "Test numbers are stored locally on the user's device only. They are not collected, transmitted or shared. The extension tells users not to store real cards."

Certifications (tick all three):
• I do not sell or transfer user data to third parties, outside of approved use cases
• I do not use or transfer user data for purposes unrelated to the item's single purpose
• I do not use or transfer user data to determine creditworthiness or for lending purposes

Remote code: No, I am not using remote code.

Privacy policy URL: https://github.com/eyrockscript/test-card-hub/blob/main/privacy-policy.md

## What's new in 3.0.0

• New design with light and dark theme that follows your system.
• Copy a card with keys 1 to 9, search with "/", and copy expiry, CVV and postal code with chips.
• Add cards with a form that detects the brand, checks the Luhn digit and warns about numbers that are not known test numbers.
• Ready-made packs of sandbox cards for popular payment gateways.
• Rename and delete environments and cards, with undo. Edit the JSON. Export and import a backup file.
• Spanish and English interface, with a language switch in the popup.
• Open with Alt+Shift+K.
• Stricter security: only the "storage" permission, strict CSP, no network requests.
• Your data from version 2 migrates automatically.
