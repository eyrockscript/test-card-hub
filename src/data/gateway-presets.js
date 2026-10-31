// Gateway sandbox test card presets.
// Every number below was copied from the gateway's official documentation page
// on the verifiedAt date. See docs/gateway-sources.md for URLs and exclusions.
// Never add a number here without citing the official page in that file.

/**
 * @typedef {'approved'|'declined'|'insufficient'|'review'|'other'} Outcome
 * @typedef {Object} PresetCard
 * @property {string} cardNumber digits only
 * @property {string} cardResponse short Spanish description
 * @property {string} cardResponseEn short English description
 * @property {Outcome} outcome
 * @property {string} [note] Spanish note with gateway-specific conditions
 * @property {string} [noteEn] English translation of the note
 */

/**
 * Build a preset card entry.
 * @param {string} cardNumber
 * @param {string} cardResponse
 * @param {string} cardResponseEn
 * @param {Outcome} outcome
 * @param {string} [note]
 * @param {string} [noteEn]
 * @returns {PresetCard}
 */
const card = (cardNumber, cardResponse, cardResponseEn, outcome, note, noteEn) =>
  note
    ? { cardNumber, cardResponse, cardResponseEn, outcome, note, noteEn }
    : { cardNumber, cardResponse, cardResponseEn, outcome };

export const GATEWAY_PRESETS = [
  {
    id: 'stripe',
    name: 'Stripe',
    docsUrl: 'https://docs.stripe.com/testing',
    verifiedAt: '2026-10-29',
    hint: 'Usa cualquier fecha futura (p. ej. 12/34) y cualquier CVC de 3 dígitos (4 en American Express). Cualquier valor en los demás campos. Solo con llaves de prueba.',
    hintEn: 'Use any future expiry date (e.g. 12/34) and any 3-digit CVC (4 for American Express). Any value in other fields. Test API keys only.',
    cards: [
      card('4242424242424242', 'Aprobada (Visa)', 'Approved (Visa)', 'approved'),
      card('4000004840008001', 'Aprobada (Visa emitida en México)', 'Approved (Visa issued in Mexico)', 'approved'),
      card('4000000000000002', 'Rechazada: rechazo genérico', 'Declined: generic decline', 'declined', 'Código de rechazo: generic_decline.', 'Decline code: generic_decline.'),
      card('4000000000009995', 'Rechazada: fondos insuficientes', 'Declined: insufficient funds', 'insufficient', 'Código de rechazo: insufficient_funds.', 'Decline code: insufficient_funds.'),
      card('4000000000000069', 'Rechazada: tarjeta vencida', 'Declined: expired card', 'declined', 'Código de error: expired_card.', 'Error code: expired_card.'),
      card('4000000000000127', 'Rechazada: CVC incorrecto', 'Declined: incorrect CVC', 'other', 'Debes enviar un CVC de 3 dígitos; si no se envía, Stripe omite la verificación. Código: incorrect_cvc.', 'You must send a 3-digit CVC; if omitted, Stripe skips the check. Code: incorrect_cvc.'),
      card('4000002760003184', 'Requiere autenticación 3D Secure', '3D Secure authentication required', 'review', 'Exige autenticación 3DS en todas las transacciones.', 'Requires 3DS authentication on every transaction.'),
      card('4100000000000019', 'Bloqueada por fraude (Radar)', 'Blocked as fraud (Radar)', 'declined', 'Nivel de riesgo más alto; Radar siempre la bloquea.', 'Highest risk level; Radar always blocks it.'),
    ],
  },
  {
    id: 'mercado-pago',
    name: 'Mercado Pago (México)',
    docsUrl: 'https://www.mercadopago.com.mx/developers/es/docs/your-integrations/test/cards',
    verifiedAt: '2026-10-29',
    hint: 'Vencimiento 11/30, CVV 123 (1234 en American Express). El resultado NO depende de la tarjeta sino del nombre del titular: APRO aprueba, FUND = fondos insuficientes, OTHE = error general, SECU = CVV inválido, CALL = requiere autorización, CONT = pendiente.',
    hintEn: 'Expiry 11/30, CVV 123 (1234 for American Express). The outcome does NOT depend on the card but on the cardholder name: APRO approves, FUND = insufficient funds, OTHE = general error, SECU = invalid CVV, CALL = call to authorize, CONT = pending.',
    cards: [
      card('5474925432670366', 'Aprobada (Mastercard crédito)', 'Approved (Mastercard credit)', 'approved', 'Nombre del titular: APRO.', 'Cardholder name: APRO.'),
      card('4075595716483764', 'Aprobada (Visa crédito)', 'Approved (Visa credit)', 'approved', 'Nombre del titular: APRO.', 'Cardholder name: APRO.'),
      card('4189141221267633', 'Rechazada: fondos insuficientes', 'Declined: insufficient funds', 'insufficient', 'Nombre del titular: FUND (Visa débito).', 'Cardholder name: FUND (Visa debit).'),
      card('5579053461482647', 'Rechazada: error general', 'Declined: general error', 'declined', 'Nombre del titular: OTHE (Mastercard débito).', 'Cardholder name: OTHE (Mastercard debit).'),
      card('371180303257522', 'Rechazada: requiere validación para autorizar', 'Declined: call for authorization', 'other', 'Nombre del titular: CALL. American Express, CVV de 4 dígitos (1234).', 'Cardholder name: CALL. American Express, 4-digit CVV (1234).'),
      card('4075595716483764', 'Rechazada: código de seguridad inválido', 'Declined: invalid security code', 'other', 'Nombre del titular: SECU.', 'Cardholder name: SECU.'),
      card('5474925432670366', 'Pendiente de pago', 'Pending payment', 'review', 'Nombre del titular: CONT.', 'Cardholder name: CONT.'),
      card('4189141221267633', 'Rechazada: problema con fecha de vencimiento', 'Declined: expiry date issue', 'other', 'Nombre del titular: EXPI.', 'Cardholder name: EXPI.'),
    ],
  },
  {
    id: 'conekta',
    name: 'Conekta',
    docsUrl: 'https://developers.conekta.com/docs/pruebas-tarjetas',
    verifiedAt: '2026-10-29',
    hint: 'Nombre y CVC al azar; vigencia cualquier fecha futura. Usa las llaves de prueba (sandbox). Las tarjetas de error son de crédito.',
    hintEn: 'Random name and CVC; any future expiry date. Use sandbox API keys. Error cards are credit cards.',
    cards: [
      card('4242424242424242', 'Aprobada (Visa crédito)', 'Approved (Visa credit)', 'approved', 'Token de prueba: tok_test_visa_4242. Válida para MSI.', 'Test token: tok_test_visa_4242. Valid for installments (MSI).'),
      card('5555555555554444', 'Aprobada (Mastercard crédito)', 'Approved (Mastercard credit)', 'approved', 'Token de prueba: tok_test_mastercard_4444. Válida para MSI.', 'Test token: tok_test_mastercard_4444. Valid for installments (MSI).'),
      card('4000000000000127', 'Rechazada: fondos insuficientes', 'Declined: insufficient funds', 'insufficient', 'Error: insufficient_funds.', 'Error: insufficient_funds.'),
      card('4000000000000002', 'Rechazada: motivo desconocido', 'Declined: unknown reason', 'declined', 'Error: card_declined.', 'Error: card_declined.'),
      card('4765881487764268', 'Rechazada: tarjeta vencida', 'Declined: expired card', 'declined', 'Error: invalid_expiration_date.', 'Error: invalid_expiration_date.'),
      card('4000000000000085', 'Rechazada: CVC inválido', 'Declined: invalid CVC', 'other', 'Error: invalid_cvc. En modo prueba el CVC no se valida al tokenizar.', 'Error: invalid_cvc. In test mode the CVC is not validated when tokenizing.'),
      card('4000000000004954', 'Rechazada: prevención de fraude', 'Declined: fraud prevention', 'declined', 'Error: suspicious_behaviour.', 'Error: suspicious_behaviour.'),
      card('4134067352736334', 'Rechazada: contactar al banco emisor', 'Declined: call issuer', 'declined', 'Error: call_issuer.', 'Error: call_issuer.'),
    ],
  },
  {
    id: 'openpay',
    name: 'Openpay (México)',
    docsUrl: 'https://documents.openpay.mx/docs/testing.html',
    verifiedAt: '2026-10-29',
    hint: 'Vigencia posterior al mes actual; cualquier CVV de 3 dígitos (4 en American Express). Cualquier otro número de tarjeta devuelve error en sandbox.',
    hintEn: 'Expiry after the current month; any 3-digit CVV (4 for American Express). Any other card number returns an error in sandbox.',
    cards: [
      card('4111111111111111', 'Aprobada (Visa)', 'Approved (Visa)', 'approved'),
      card('5555555555554444', 'Aprobada (Mastercard)', 'Approved (Mastercard)', 'approved', 'Acepta pago con puntos.', 'Accepts payment with points.'),
      card('4222222222222220', 'Rechazada (error 3001)', 'Declined (error 3001)', 'declined'),
      card('4444444444444448', 'Rechazada: fondos insuficientes (error 3003)', 'Declined: insufficient funds (error 3003)', 'insufficient'),
      card('4000000000000069', 'Rechazada: tarjeta expirada (error 3002)', 'Declined: expired card (error 3002)', 'declined'),
      card('4000000000000119', 'Rechazada: tarjeta robada (error 3004)', 'Declined: stolen card (error 3004)', 'declined'),
      card('4000000000000044', 'Rechazada por antifraude (error 3005)', 'Declined by antifraud (error 3005)', 'declined'),
      card('5454545454545454', 'Autenticación selectiva: aprobada solo con 3D Secure', 'Selective authentication: approved only with 3D Secure', 'review', 'En cualquier otra modalidad la rechaza el antifraude (error 3005).', 'In any other mode the antifraud declines it (error 3005).'),
    ],
  },
  {
    id: 'netpay',
    name: 'NetPay (México)',
    docsUrl: 'https://docs.netpay.com.mx/reference/matriz-de-pruebas-2',
    verifiedAt: '2026-10-29',
    hint: 'El resultado depende del correo del cliente más la tarjeta: accept@netpay.com.mx (aprobar), reject@netpay.com.mx (rechazar), review@netpay.com.mx (flujos 3DS).',
    hintEn: 'Outcome depends on the customer email plus the card: accept@netpay.com.mx (approve), reject@netpay.com.mx (reject), review@netpay.com.mx (3DS flows).',
    cards: [
      card('4000000000000002', 'Aprobada (Visa)', 'Approved (Visa)', 'approved', 'Correo: accept@netpay.com.mx.', 'Email: accept@netpay.com.mx.'),
      card('5200000000000007', 'Aprobada (Mastercard)', 'Approved (Mastercard)', 'approved', 'Correo: accept@netpay.com.mx.', 'Email: accept@netpay.com.mx.'),
      card('340000000003961', 'Aprobada (American Express)', 'Approved (American Express)', 'approved', 'Correo: accept@netpay.com.mx.', 'Email: accept@netpay.com.mx.'),
      card('4000000000000002', 'Rechazada (Visa)', 'Declined (Visa)', 'declined', 'Misma tarjeta que la aprobada; usa el correo reject@netpay.com.mx.', 'Same card as the approved one; use the email reject@netpay.com.mx.'),
      card('4000000000001000', 'Aprobada con 3DS frictionless (Visa)', 'Approved with frictionless 3DS (Visa)', 'review', 'Correo: review@netpay.com.mx.', 'Email: review@netpay.com.mx.'),
      card('4000000000001091', 'Aprobada con 3DS (Visa)', 'Approved with 3DS (Visa)', 'review', 'Correo: review@netpay.com.mx.', 'Email: review@netpay.com.mx.'),
      card('4000000000001018', 'Rechazada en 3DS frictionless (Visa)', 'Declined in frictionless 3DS (Visa)', 'declined', 'Correo: review@netpay.com.mx.', 'Email: review@netpay.com.mx.'),
      card('4000000000001109', 'Rechazada en 3DS (Visa)', 'Declined in 3DS (Visa)', 'declined', 'Correo: review@netpay.com.mx.', 'Email: review@netpay.com.mx.'),
    ],
  },
  {
    id: 'kushki',
    name: 'Kushki (México)',
    docsUrl: 'https://docs.kushki.com/mx/getting-started/testing-your-integration/',
    verifiedAt: '2026-10-29',
    hint: 'CVV y código postal cualquiera; fecha de expiración cualquier fecha futura. Usa el ambiente UAT con credenciales de prueba.',
    hintEn: 'Any CVV and postal code; any future expiry date. Use the UAT environment with test credentials.',
    cards: [
      card('5451951574925480', 'Aprobada (000)', 'Approved (000)', 'approved'),
      card('4349001210846432', 'Rechazada: tarjeta sin fondos (021)', 'Declined: insufficient funds (021)', 'insufficient'),
      card('4349003000047015', 'Rechazada en el cobro: tarjeta no válida (017)', 'Declined at charge: invalid card (017)', 'declined'),
      card('4574441215190335', 'Declinada en la solicitud de token (017)', 'Declined at token request (017)', 'declined'),
      card('4349008516656431', 'Rechazada: tarjeta no compatible (019)', 'Declined: unsupported card (019)', 'other'),
      card('4349003243371321', 'Rechazada: imposible verificar CVV (022)', 'Declined: unable to verify CVV (022)', 'other'),
      card('4349001386781322', 'Rechazada: tarjeta bloqueada por el banco (023)', 'Declined: card blocked by the bank (023)', 'declined'),
    ],
  },
  {
    id: 'clip',
    name: 'Clip (Checkout Transparente)',
    docsUrl: 'https://developer.clip.mx/reference/pruebas',
    verifiedAt: '2026-10-29',
    hint: 'Requiere credenciales de prueba de Clip. CVV cualquiera; fecha de expiración posterior al día en curso. Solo aplica a Checkout Transparente y Reembolsos; tarjetas internacionales requieren verificar identidad (KYC).',
    hintEn: 'Requires Clip test credentials. Any CVV; expiry date after today. Only applies to Transparent Checkout and Refunds APIs; international cards require identity verification (KYC).',
    cards: [
      card('4555128482797669', 'Aprobada (Visa crédito BBVA)', 'Approved (Visa credit BBVA)', 'approved'),
      card('5177136199824515', 'Aprobada (Mastercard crédito Santander)', 'Approved (Mastercard credit Santander)', 'approved'),
      card('379907880667372', 'Aprobada (American Express crédito)', 'Approved (American Express credit)', 'approved', 'CVV de 4 dígitos en American Express.', '4-digit CVV on American Express.'),
      card('4555126387272952', 'Rechazada: fondos insuficientes', 'Declined: not sufficient funds', 'insufficient'),
      card('5177134282349839', 'Rechazada: fondos insuficientes (Mastercard)', 'Declined: not sufficient funds (Mastercard)', 'insufficient'),
      card('4555124951976546', 'Rechazada: no honrar (Do not honor)', 'Declined: do not honor', 'declined'),
      card('4555126464792591', 'Rechazada: tarjeta restringida', 'Declined: restricted card', 'declined'),
      card('4555127277126233', 'Rechazada: excede límite de monto', 'Declined: exceeds withdrawal amount limit', 'other'),
    ],
  },
  {
    id: 'payu-latam',
    name: 'PayU Latam (México)',
    docsUrl: 'https://developers.payulatam.com/latam/en/docs/getting-started/test-your-solution.html',
    verifiedAt: '2026-10-29',
    hint: 'El resultado depende del nombre del titular. Aprobar: nombre APPROVED, CVV 777 (7777 en Amex), mes de vencimiento menor a 6. Rechazar: nombre REJECTED, CVV 666 (6666 en Amex), mes mayor a 6. Montos de al menos 1 USD equivalente.',
    hintEn: 'Outcome depends on the cardholder name. Approve: name APPROVED, CVV 777 (7777 for Amex), expiry month below 6. Decline: name REJECTED, CVV 666 (6666 for Amex), month above 6. Amounts of at least 1 USD equivalent.',
    cards: [
      card('4268070000000002', 'Aprobada (Visa crédito)', 'Approved (Visa credit)', 'approved', 'Titular APPROVED, CVV 777, mes < 6.', 'Holder APPROVED, CVV 777, month < 6.'),
      card('5491380000000001', 'Aprobada (Mastercard crédito)', 'Approved (Mastercard credit)', 'approved', 'Titular APPROVED, CVV 777, mes < 6.', 'Holder APPROVED, CVV 777, month < 6.'),
      card('376675000000005', 'Aprobada (American Express crédito)', 'Approved (American Express credit)', 'approved', 'Titular APPROVED, CVV 7777, mes < 6.', 'Holder APPROVED, CVV 7777, month < 6.'),
      card('4415490000000004', 'Aprobada (Visa débito)', 'Approved (Visa debit)', 'approved', 'Titular APPROVED, CVV 777, mes < 6.', 'Holder APPROVED, CVV 777, month < 6.'),
      card('5256780000000007', 'Aprobada (Mastercard débito)', 'Approved (Mastercard debit)', 'approved', 'Titular APPROVED, CVV 777, mes < 6.', 'Holder APPROVED, CVV 777, month < 6.'),
      card('4268070000000002', 'Rechazada (Visa crédito)', 'Declined (Visa credit)', 'declined', 'Titular REJECTED, CVV 666, mes > 6.', 'Holder REJECTED, CVV 666, month > 6.'),
      card('5204740000002745', 'Rechazada (Mastercard crédito)', 'Declined (Mastercard credit)', 'declined', 'Titular REJECTED, CVV 666, mes > 6.', 'Holder REJECTED, CVV 666, month > 6.'),
    ],
  },
  {
    id: 'dlocal',
    name: 'dLocal',
    docsUrl: 'https://docs.dlocal.com/docs/make-a-test-payment',
    verifiedAt: '2026-10-29',
    hint: 'En sandbox el resultado se controla con el campo description de la solicitud: "200" = aprobado, "300" = rechazo genérico, "302" = fondos insuficientes. Para 3DS envía three_dsecure.force = true. Fecha futura y CVV válido de sandbox.',
    hintEn: 'In sandbox the result is controlled by the request description field: "200" = approved, "300" = generic rejection, "302" = insufficient funds. For 3DS send three_dsecure.force = true. Future expiry and a valid sandbox CVV.',
    cards: [
      card('4111111111111111', 'Aprobada', 'Approved', 'approved', 'Tarjeta del ejemplo oficial; description = "200".', 'Card from the official example; description = "200".'),
      card('4111111111111111', 'Rechazo genérico', 'Generic rejection', 'declined', 'description = "300".', 'description = "300".'),
      card('4111111111111111', 'Rechazada: fondos insuficientes', 'Declined: insufficient funds', 'insufficient', 'description = "302".', 'description = "302".'),
      card('4556557955726624', 'Autenticación 3DS aprobada (Visa)', '3DS authentication approved (Visa)', 'review', 'Requiere three_dsecure.force = true.', 'Requires three_dsecure.force = true.'),
      card('4556104160382032', 'Autenticación 3DS rechazada (Visa)', '3DS authentication rejected (Visa)', 'declined', 'Requiere three_dsecure.force = true.', 'Requires three_dsecure.force = true.'),
      card('5333259155643223', 'Autenticación 3DS aprobada (Mastercard)', '3DS authentication approved (Mastercard)', 'review', 'Requiere three_dsecure.force = true.', 'Requires three_dsecure.force = true.'),
      card('5328720384582224', 'Autenticación 3DS rechazada (Mastercard)', '3DS authentication rejected (Mastercard)', 'declined', 'Requiere three_dsecure.force = true.', 'Requires three_dsecure.force = true.'),
      card('4916994064252017', 'Reto 3DS en navegador (Visa)', '3DS browser challenge (Visa)', 'review', 'OTP 7777 para ECI 05, o 1221 para ECI 02.', 'OTP 7777 for ECI 05, or 1221 for ECI 02.'),
    ],
  },
  {
    id: 'adyen',
    name: 'Adyen',
    docsUrl: 'https://docs.adyen.com/development-resources/test-cards-and-credentials/test-card-numbers',
    verifiedAt: '2026-10-29',
    hint: 'Vencimiento 03/2030 y CVC 737. Para forzar un rechazo con la tarjeta aprobada, envía el valor indicado en holderName (p. ej. DECLINED, NOT_ENOUGH_BALANCE, CARD_EXPIRED, FRAUD). Solo funciona en la plataforma de pruebas de Adyen.',
    hintEn: 'Expiry 03/2030 and CVC 737. To force a refusal with the approved card, send the indicated value as holderName (e.g. DECLINED, NOT_ENOUGH_BALANCE, CARD_EXPIRED, FRAUD). Works on Adyen test platform only.',
    cards: [
      card('4111111111111111', 'Aprobada (Visa)', 'Approved (Visa)', 'approved'),
      card('5555444433331111', 'Aprobada (Mastercard)', 'Approved (Mastercard)', 'approved'),
      card('4111111111111111', 'Rechazada: rechazo genérico', 'Declined: generic refusal', 'declined', 'holderName: DECLINED.', 'holderName: DECLINED.'),
      card('4111111111111111', 'Rechazada: saldo insuficiente', 'Declined: not enough balance', 'insufficient', 'holderName: NOT_ENOUGH_BALANCE.', 'holderName: NOT_ENOUGH_BALANCE.'),
      card('4111111111111111', 'Rechazada: tarjeta vencida', 'Declined: expired card', 'declined', 'holderName: CARD_EXPIRED.', 'holderName: CARD_EXPIRED.'),
      card('4111111111111111', 'Rechazada: fraude', 'Declined: fraud', 'declined', 'holderName: FRAUD.', 'holderName: FRAUD.'),
      card('5201281505129736', 'Flujo frictionless 3D Secure 2 (Mastercard)', '3D Secure 2 frictionless flow (Mastercard)', 'review'),
    ],
  },
];
