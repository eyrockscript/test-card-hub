# Publicar la v3.0.0 en la Chrome Web Store

Guía campo por campo, con los nombres que muestra el dashboard en español.
Todo lo que está dentro de un bloque gris se copia y pega tal cual.

Carpeta de archivos: `/Users/eyrockscript/Documents/dev/test-card-hub/`
(en Finder: Cmd+Shift+G y pega esa ruta).

---

## 0. Antes de empezar

1. Desactiva el Payment Link de Stripe `cNi00igBN2Ki881b756EU00`.
2. La rama `feat/v3-redesign` debe estar fusionada en `main`; si no, la URL de
   la política de privacidad da 404 y te rechazan.
3. Sube el paquete: menú izquierdo **Paquete → Subir paquete nuevo** →
   `dist/test-card-hub-3.0.0.zip`. Verifica que diga versión **3.0.0**.

   El **Título del paquete** y el **Resumen del paquete** salen del zip, por
   eso aparecen ya llenos y no se pueden editar. Es correcto.

---

## 1. Ficha de Play Store, idioma **inglés – en (predeterminado)**

Arriba, en **Idioma de edición actual**, deja **inglés – en (predeterminado)**.

### Descripción

```
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

New in 3.0.0: new design, gateway packs, keyboard shortcuts, backup export/import, English interface, stricter security.
```

### Categoría (aplica a todos los idiomas)

**Herramientas para desarrolladores**

### Recursos gráficos

| Campo | Archivo |
|---|---|
| Ícono de Chrome Web Store (128×128) | `icon-128.png` |

### Recursos localizados (inglés)

| Campo | Qué hacer |
|---|---|
| Video promocional localizado | Vacío |
| Capturas de pantalla localizadas | Vacío (las universales de abajo ya están en inglés) |

### Recursos universales

Se muestran en cualquier idioma que no tenga capturas propias (por ejemplo,
Japón), por eso van en inglés.

| Campo | Archivo |
|---|---|
| Video promocional universal | Vacío |
| Capturas de pantalla universales | Borra las viejas y sube en este orden: `store/assets/en/screenshot-1.png`, `screenshot-2.png`, `screenshot-3.png`, `screenshot-4.png`, `screenshot-5.png` |
| Imagen promocional pequeña (440×280) | `store/assets/promo-small-440x280.png` |
| Imagen promocional de marquesina (1400×560) | `store/assets/promo-marquee-1400x560.png` (opcional; solo se usa si Google destaca la extensión) |

### Campos adicionales

| Campo | Valor |
|---|---|
| URL oficial | Ninguno |
| URL de la página principal | `https://github.com/eyrockscript/test-card-hub` |
| URL de la asistencia | `https://github.com/eyrockscript/test-card-hub/issues` |
| Contenido adulto | **No** (desactivado) |
| Asistencia para el elemento | Déjalo como está |

Pulsa **Guardar borrador**.

---

## 2. Ficha de Play Store, idioma **español – es**

Arriba, en **Idioma de edición actual → Idioma**, cambia a **español** (si no
aparece, agrégalo).

### Descripción

```
Ten los números de tarjeta de prueba de tus sandboxes de pago a un clic.

Tarjetas de Crédito de Prueba guarda los números que las pasarelas de pago publican para pruebas, agrupados por ambiente (desarrollo, staging, el proyecto de un cliente). Abre la ventana junto a tu checkout, elige el escenario que necesitas (aprobada, rechazada, fondos insuficientes) y copia el número.

Qué puedes hacer:
• Copiar una tarjeta con un clic o con las teclas 1 a 9.
• Buscar con "/".
• Copiar vencimiento, CVV y código postal con un clic.
• Agregar una tarjeta con formulario: detecta la marca, valida el dígito Luhn y avisa si el número no es un número de prueba conocido.
• Importar tarjetas desde un archivo JSON, o añadir un paquete listo de tarjetas de sandbox de pasarelas de pago populares, con números tomados de la documentación oficial de cada una.
• Renombrar ambientes, eliminar tarjetas o ambientes (con deshacer), editar el JSON y exportar o importar un archivo de respaldo.
• Tema claro y oscuro que sigue a tu sistema, y selector entre español e inglés.
• Abrirla con Alt+Shift+K.

Solo para sandbox y ambientes de prueba. No guardes tarjetas reales en esta extensión. No genera números de tarjeta.

Privacidad: todo se queda en tu navegador (chrome.storage.local). La extensión no hace ninguna petición de red, no tiene analítica y pide un único permiso: "storage".

Si usabas la versión 2, tus datos se migran automáticamente.

Novedades de la 3.0.0: diseño nuevo, paquetes de pasarelas, atajos de teclado, exportar e importar respaldo, interfaz en inglés y más seguridad.
```

### Recursos localizados (español)

| Campo | Archivo |
|---|---|
| Capturas de pantalla localizadas | `store/assets/es/screenshot-1.png` a `screenshot-5.png`, en orden |

Lo demás (categoría, ícono, recursos universales, campos adicionales) ya quedó
del paso 1. Pulsa **Guardar borrador**.

---

## 3. Prácticas de privacidad

Menú izquierdo **Prácticas de privacidad**.

### Descripción del propósito único

```
Store and copy payment-gateway sandbox test card numbers, organized by environment, so developers and QA testers can fill checkout forms in test environments.
```

### Justificación del permiso `storage`

```
The extension saves the user's environments and test cards (plus the language choice, the last selected environment and local counters for the rating invitation) in chrome.storage.local so they persist between browser sessions. No other permission is requested: no host permissions, no tabs, no clipboard permissions, no remote code. Copying uses the user's click inside the popup.
```

Si todavía aparecen cajas de justificación para `tabs` o `clipboardWrite`
(permisos de la v2), deben desaparecer al subir el zip nuevo. Si siguen ahí,
déjalas vacías.

### ¿Usas código remoto?

**No, no uso código remoto.**

### Uso de datos

No marques **ninguna** casilla (información de identificación personal, salud,
financiera y de pago, autenticación, comunicaciones, ubicación, historial web,
actividad del usuario, contenido del sitio web).

Las tarjetas de prueba nunca salen del dispositivo, por eso "financiera y de
pago" va sin marcar. Si algún campo de texto pregunta por datos financieros:

```
The extension stores only sandbox test card numbers that the user types, pastes or imports. They stay on the user's device in chrome.storage.local and are never collected, transmitted or shared: the extension makes no network requests (CSP connect-src 'none'). The extension tells users not to store real cards and does not generate card numbers.
```

### Certificaciones

Marca las **tres** casillas (no vendes datos, no los usas para otro fin, no los
usas para crédito).

### URL de la política de privacidad

```
https://github.com/eyrockscript/test-card-hub/blob/main/privacy-policy.md
```

Pulsa **Guardar borrador**.

---

## 4. Instrucciones de prueba (si aparece esa sección)

```
No account or login needed. Click the toolbar icon (or press Alt+Shift+K). Click any card row to copy its number. Use "+" to add a card or open the "Gateways" tab to add a pack of official sandbox test cards. Use the gear icon to rename, delete (with undo) or export a backup. All data stays local.
```

---

## 5. Enviar

1. Revisa que no haya avisos en rojo en ninguna sección.
2. Pulsa **Enviar para revisión**. Con solo el permiso `storage` suele tardar
   de 1 a 3 días.
3. Los usuarios actuales reciben la actualización solos, sin aviso de permisos.
