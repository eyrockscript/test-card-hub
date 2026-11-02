# Ficha de Chrome Web Store (español)

## Nombre (máx. 75 caracteres)

Tarjetas de Crédito de Prueba

## Resumen (máx. 132 caracteres)

Copia números de tarjeta de prueba por ambiente con un clic. Paquetes de Stripe, Mercado Pago, Conekta y más.

(109 caracteres. La descripción actual del manifest es similar; esta versión puede sustituirla.)

## Descripción detallada (texto plano)

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

## Categoría

Herramientas para desarrolladores (Developer Tools)

## Declaración de propósito único

Guardar y copiar números de tarjeta de prueba de sandboxes de pasarelas de pago, organizados por ambiente, para que desarrolladores y testers llenen formularios de pago en entornos de prueba.

## Justificación del permiso: storage

La extensión guarda los ambientes y las tarjetas de prueba del usuario (además del idioma elegido, el último ambiente seleccionado y contadores locales para la invitación a calificar) en chrome.storage.local para que persistan entre sesiones. No se solicita ningún otro permiso: sin permisos de host, sin tabs, sin portapapeles, sin código remoto. El copiado ocurre con un clic del usuario dentro de la ventana.

## Pestaña Prácticas de privacidad

Declaración de uso de datos (qué marcar):
• Información de identificación personal: no se recopila
• Información de salud: no se recopila
• Información financiera y de pago: no se recopila (ver nota abajo)
• Información de autenticación: no se recopila
• Comunicaciones personales: no se recopila
• Ubicación: no se recopila
• Historial web: no se recopila
• Actividad del usuario: no se recopila
• Contenido del sitio web: no se recopila

Nota sobre el campo financiero: la extensión solo guarda números de tarjeta de prueba que el usuario escribe, pega o importa, y nunca salen del dispositivo (chrome.storage.local, sin acceso a red, connect-src 'none' en la CSP). Como el desarrollador no recibe nada, deja la casilla sin marcar. Si el formulario de revisión lo pide, responde: "Los números de prueba se guardan solo de forma local en el dispositivo del usuario. No se recopilan, transmiten ni comparten. La extensión indica a los usuarios que no guarden tarjetas reales."

Certificaciones (marcar las tres):
• No vendo ni transfiero datos de usuario a terceros, salvo en los casos de uso aprobados
• No uso ni transfiero datos de usuario para fines ajenos al propósito único del producto
• No uso ni transfiero datos de usuario para determinar solvencia crediticia ni para préstamos

Código remoto: No, no uso código remoto.

URL de la política de privacidad: https://github.com/eyrockscript/test-card-hub/blob/main/privacy-policy.md

## Novedades de la 3.0.0

• Diseño nuevo con tema claro y oscuro que sigue a tu sistema.
• Copia una tarjeta con las teclas 1 a 9, busca con "/" y copia vencimiento, CVV y código postal con un clic.
• Agrega tarjetas con un formulario que detecta la marca, valida el dígito Luhn y avisa si el número no es de prueba conocido.
• Paquetes listos de tarjetas de sandbox de pasarelas de pago populares.
• Renombra y elimina ambientes y tarjetas, con deshacer. Edita el JSON. Exporta e importa un archivo de respaldo.
• Interfaz en español e inglés, con selector de idioma en la ventana.
• Ábrela con Alt+Shift+K.
• Más seguridad: solo el permiso "storage", CSP estricta y ninguna petición de red.
• Tus datos de la versión 2 se migran automáticamente.
