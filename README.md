# 🃏 Tarjetas de Crédito de Prueba

Una extensión de Chrome moderna y elegante para gestionar números de tarjetas de crédito de prueba. Diseñada para desarrolladores y testers que necesitan simular transacciones con diferentes respuestas de pago de forma rápida y eficiente.

## 🚀 Instalación Rápida

### Desde Chrome Web Store (Recomendado)
[![Instalar desde Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Instalar-blue?style=for-the-badge&logo=google-chrome)](https://chromewebstore.google.com/detail/tarjetas-de-cr%C3%A9dito-de-pr/nkpgepoonipokhghifbocnohiaoigaeg)

**[📥 Instalar directamente desde Chrome Web Store](https://chromewebstore.google.com/detail/tarjetas-de-cr%C3%A9dito-de-pr/nkpgepoonipokhghifbocnohiaoigaeg)**

### ☕ Apoya el Proyecto
Si esta extensión te es útil, considera apoyar su desarrollo:

[![Buy me a coffee](https://img.shields.io/badge/☕-Buy%20me%20a%20coffee-orange?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://buy.stripe.com/cNi00igBN2Ki881b756EU00)

**[☕ Buy me a coffee](https://buy.stripe.com/cNi00igBN2Ki881b756EU00)**

### Instalación Manual (Desarrolladores)
1. Clona este repositorio o descarga el archivo ZIP
2. Ve a `chrome://extensions/` en tu navegador Chrome
3. Activa el "Modo de desarrollador"
4. Haz clic en "Cargar extensión sin empaquetar"
5. Selecciona la carpeta con los archivos de la extensión

## ✨ Características Principales

### 🎨 **Diseño Minimalista Moderno**
- Interfaz elegante con tipografía Inter y colores suaves
- Tarjetas realistas con efectos visuales y animaciones fluidas
- Experiencia de usuario intuitiva y profesional

### 📱 **Gestión Dual de Tarjetas**
- **Formulario Simple**: Agrega tarjetas individuales fácilmente
- **Importación JSON**: Importa múltiples tarjetas y ambientes
- Validación automática de números de tarjeta
- Formateo automático mientras escribes

### 🌍 **Ambientes Múltiples**
- Crea ambientes para diferentes entornos (desarrollo, staging, producción)
- Navegación rápida con indicadores visuales
- Colores únicos para cada ambiente
- Selección automática del ambiente "default"

### 🛠️ **Gestión Avanzada**
- Edita nombres de ambientes y conjuntos de tarjetas
- Elimina ambientes con confirmación segura
- Exporta/importa configuraciones completas
- Almacenamiento local persistente

### 🎯 **Experiencia Optimizada**
- Un clic para copiar números al portapapeles
- Notificaciones elegantes con confirmación
- Navegación fluida entre pantallas
- Sin desbordamientos ni elementos rotos

### ☕ **Apoyo al Desarrollo**
- Botón discreto para apoyar el proyecto
- Enlace directo a página de donaciones

## 💻 Uso

### Tarjetas Incluidas por Defecto
La extensión viene con 3 tarjetas de ejemplo para empezar:

| Número | Respuesta Esperada |
|--------|-------------------|
| `5451 9515 7492 5480` | Transacción aprobada |
| `4574 4412 1519 0335` | Tarjeta no válida |
| `4349 0030 0004 7015` | Tarjeta sin fondos |

### 🔄 Flujo de Trabajo Típico

1. **Abre la extensión** haciendo clic en el ícono de la barra de herramientas
2. **Selecciona un ambiente** de los botones superiores
3. **Copia una tarjeta** haciendo clic en ella
4. **Agrega nuevas tarjetas** con el botón `+`:
   - Usando el formulario simple para tarjetas individuales
   - O importando JSON para múltiples tarjetas
5. **Edita ambientes** con el botón de lápiz ✎

### 📝 Agregar Tarjetas Individuales

```
Ambiente: production
Número: 4111111111111111
Respuesta: Transacción aprobada
```

### 📋 Formato JSON para Importación

```json
{
  "environment": "staging",
  "cards": [
    {
      "cardNumber": "4111111111111111",
      "cardNumberDisplay": "4111 1111 1111 1111",
      "cardResponse": "Transacción aprobada"
    }
  ]
}
```

## 🛡️ Privacidad y Seguridad

- **Sin conexión a internet**: Todos los datos se almacenan localmente
- **Sin tracking**: No recopilamos información personal
- **Solo permisos necesarios**: Clipboard y tabs para funcionalidad básica
- **Código abierto**: Transparencia total del funcionamiento

## 🎯 Casos de Uso

- **Desarrollo de e-commerce**: Prueba diferentes respuestas de pago
- **Testing de APIs**: Simula tarjetas válidas e inválidas
- **Demos y presentaciones**: Números consistentes para mostrar
- **QA y testing**: Escenarios predecibles de transacciones

## 🔄 Versiones

### v2.2 (Actual)
- ✨ Diseño completamente renovado y minimalista
- 🆕 Formulario simple para agregar tarjetas individuales
- 🎨 Tarjetas de crédito realistas con efectos visuales
- 🔧 Navegación mejorada entre pantallas
- 📱 Sin desbordamientos, diseño perfecto
- ☕ Botón de apoyo al desarrollo
- 🏷️ Solo 3 tarjetas de muestra por defecto

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si encuentras algún problema o tienes sugerencias:

1. 🐛 **Reporta bugs** en los issues de GitHub
2. 💡 **Sugiere nuevas funcionalidades**
3. 🔧 **Envía pull requests**
4. ⭐ **Dale una estrella** al repositorio
5. ☕ **Apoya el desarrollo** [aquí](https://buy.stripe.com/cNi00igBN2Ki881b756EU00)

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

Hecho con ❤️ para la comunidad de desarrolladores