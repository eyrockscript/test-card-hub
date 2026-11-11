/**
 * Field rules and decline codes per gateway, researched from each gateway's official
 * docs on the file's `verifiedAt` date. Each JSON keeps its `sources` and `gaps`
 * (what the docs did not state) so every value can be audited. Never add a value
 * here that is not in the official docs.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const GATEWAY_IDS = Object.freeze([
  'stripe', 'mercado-pago', 'conekta', 'openpay', 'netpay', 'kushki', 'clip', 'payu-latam', 'dlocal', 'adyen',
]);

/** @type {Readonly<Record<string, object>>} */
export const GATEWAY_RESEARCH = Object.freeze(
  Object.fromEntries(GATEWAY_IDS.map((id) => [id, require(`./${id}.json`)])),
);
