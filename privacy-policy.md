# Política de privacidad de Tarjetas de Crédito de Prueba (test-card-hub)

Última actualización: 29/10/2026

## Español

### 1. Qué datos recopilamos

Ninguno. La extensión no recopila, no envía y no comparte datos personales ni de uso. No tiene analítica, cuentas de usuario, cookies ni servidores propios.

### 2. Qué datos guarda la extensión en tu dispositivo

La extensión guarda en tu navegador, y solo ahí, lo que tú mismo creas o importas:

- Tus ambientes y las tarjetas de prueba de cada ambiente (número, descripción, resultado esperado y una nota opcional).
- Tus preferencias: idioma y último ambiente seleccionado.
- Datos locales para decidir cuándo mostrar, como máximo dos veces, la invitación a calificar la extensión: la fecha en que abriste el popup por primera vez, cuántas veces copiaste un valor y si ya calificaste o cerraste la invitación (con su fecha). No se envían a ningún lado.
- Si alguna vez los datos guardados se dañan, una copia de seguridad local (`corruptBackup`) para no perderlos.

Al actualizar desde la versión 2, la extensión lee una sola vez los datos que esa versión guardaba en el `localStorage` del navegador para migrarlos; esa copia antigua no se modifica.

Estos datos se almacenan con `chrome.storage.local`. No salen de tu dispositivo. La extensión no hace ninguna petición de red: su política de seguridad de contenido (CSP) bloquea las conexiones y las tipografías están incluidas en el paquete.

La extensión es solo para entornos de prueba (sandbox). No guardes tarjetas de pago reales.

### 3. Para qué sirve el permiso "storage"

Es el único permiso que solicita la extensión. Permite guardar tus ambientes, tarjetas y preferencias en `chrome.storage.local` para que sigan ahí al cerrar y volver a abrir el navegador. No da acceso a las páginas que visitas, a tus pestañas, ni a tu historial; no pide permiso de portapapeles.

### 4. Uso de la información

Los datos guardados se usan únicamente para mostrarte tus tarjetas de prueba y copiarlas cuando tú lo pides. No se usan para ningún otro fin.

### 5. Compartición con terceros

No compartimos ni vendemos datos, porque no los recibimos.

### 6. Cómo eliminar tus datos

- Elimina tarjetas o ambientes desde la propia extensión.
- O desinstala la extensión desde `chrome://extensions`: Chrome borra todos los datos que guardó.

Si exportas un archivo de respaldo, ese archivo queda en tu equipo bajo tu control; bórralo tú cuando quieras.

### 7. Enlaces externos

La extensión no incluye enlaces de pago ni de donación. Hay enlaces para calificar la extensión en la Chrome Web Store, reportar un problema en GitHub y consultar la documentación oficial de cada pasarela; todos se abren en una pestaña nueva y se rigen por la política de cada sitio. La extensión no envía ningún dato a esas páginas.

### 8. Cambios en esta política

Si esta política cambia, publicaremos la versión actualizada en esta misma página con una nueva fecha.

### 9. Contacto

dev.eliud.trejo@gmail.com

---

## English

### 1. Data we collect

None. The extension does not collect, send or share personal or usage data. It has no analytics, user accounts, cookies or servers of its own.

### 2. Data the extension stores on your device

The extension stores, in your browser only, what you create or import:

- Your environments and the test cards in each one (number, description, expected outcome and an optional note).
- Your preferences: language and last selected environment.
- Local data used to decide when to show the invitation to rate the extension (at most twice): the date you first opened the popup, how many times you copied a value, and whether you rated or dismissed the invitation (with its date). It is never sent anywhere.
- If stored data ever becomes damaged, a local backup copy (`corruptBackup`) so it is not lost.

When updating from version 2, the extension reads once the data that version kept in the browser's `localStorage` to migrate it; that old copy is not modified.

This data is stored with `chrome.storage.local`. It never leaves your device. The extension makes no network requests: its Content Security Policy (CSP) blocks connections, and the fonts are bundled in the package.

The extension is for test (sandbox) environments only. Do not store real payment cards.

### 3. What the "storage" permission does

It is the only permission the extension requests. It lets the extension save your environments, cards and preferences in `chrome.storage.local` so they are still there after you close and reopen the browser. It gives no access to the pages you visit, your tabs, or your history, and it asks for no clipboard permission.

### 4. How the information is used

Stored data is used only to show your test cards and copy them when you ask. It is used for nothing else.

### 5. Sharing with third parties

We do not share or sell data, because we do not receive it.

### 6. How to delete your data

- Delete cards or environments inside the extension.
- Or uninstall the extension from `chrome://extensions`: Chrome removes all the data it stored.

If you export a backup file, that file stays on your computer under your control; delete it whenever you want.

### 7. External links

The extension contains no payment or donation links. There are links to rate the extension on the Chrome Web Store, report a problem on GitHub and read each gateway's official documentation; they all open in a new tab and are governed by each site's policy. The extension sends no data to those pages.

### 8. Changes to this policy

If this policy changes, we will publish the updated version on this page with a new date.

### 9. Contact

dev.eliud.trejo@gmail.com
