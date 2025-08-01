const defaultLogo = "default-logo.png";
let environments = [];
let currentEnvironment = null;

document.addEventListener("DOMContentLoaded", function () {
  loadEnvironments();
  document
    .getElementById("add-environment-button")
    .addEventListener("click", showImportScreen);
  document
    .getElementById("import-button")
    .addEventListener("click", handleImport);
  document
    .getElementById("cancel-import-button")
    .addEventListener("click", hideImportScreen);
  document
    .getElementById("edit-environment-button")
    .addEventListener("click", showEditScreen);
  document
    .getElementById("save-edit-button")
    .addEventListener("click", saveEditedEnvironment);
  document
    .getElementById("cancel-edit-button")
    .addEventListener("click", hideEditScreen);
  
  // Nuevos event listeners para el método selector
  document
    .getElementById("form-method-btn")
    .addEventListener("click", () => switchMethod("form"));
  document
    .getElementById("json-method-btn")
    .addEventListener("click", () => switchMethod("json"));
  
  // Formato automático del número de tarjeta
  document
    .getElementById("card-number")
    .addEventListener("input", formatCardNumber);
  
  // Buy me a coffee button
  document
    .getElementById("support-button")
    .addEventListener("click", openSupportLink);
});

function loadEnvironments() {
  const storedEnvironments = localStorage.getItem("creditCardEnvironments");
  if (storedEnvironments) {
    environments = JSON.parse(storedEnvironments);
  } else {
    environments = [
      {
        environment: "default",
        color: getRandomDarkColor(),
        cards: [
          {
            cardNumber: "5451951574925480",
            cardLogo: defaultLogo,
            cardNumberDisplay: "5451 9515 7492 5480",
            cardResponse: "Transacción aprobada",
          },
          {
            cardNumber: "4574441215190335",
            cardLogo: defaultLogo,
            cardNumberDisplay: "4574 4412 1519 0335",
            cardResponse: "Tarjeta no válida",
          },
          {
            cardNumber: "4349003000047015",
            cardLogo: defaultLogo,
            cardNumberDisplay: "4349 0030 0004 7015",
            cardResponse: "Tarjeta sin fondos",
          },
        ],
      },
    ];
    saveEnvironments();
  }

  renderEnvironmentNav();
  if (environments.length > 0) {
    // Buscar el ambiente "default" y seleccionarlo, o el primero si no existe
    currentEnvironment = environments.find(env => env.environment === "default") || environments[0];
    renderCards(currentEnvironment);
  }
}

function saveEnvironments() {
  localStorage.setItem("creditCardEnvironments", JSON.stringify(environments));
}

function renderEnvironmentNav() {
  const nav = document.getElementById("environment-nav");
  nav.innerHTML = "";
  environments.forEach((env, index) => {
    const button = document.createElement("button");
    button.textContent = env.environment;
    button.style.backgroundColor = env.color;
    
    // Marcar como activo si es el ambiente actual
    if (currentEnvironment && currentEnvironment.environment === env.environment) {
      button.classList.add("active");
    }
    
    button.addEventListener("click", () => {
      // Remover clase active de todos los botones
      nav.querySelectorAll("button").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      
      currentEnvironment = env;
      renderCards(env);
    });
    nav.appendChild(button);
  });

  const addButton = document.createElement("button");
  addButton.textContent = "+";
  addButton.id = "add-environment-button";
  addButton.addEventListener("click", showImportScreen);
  nav.appendChild(addButton);

  const editButton = document.createElement("button");
  editButton.textContent = "✎";
  editButton.id = "edit-environment-button";
  editButton.addEventListener("click", showEditScreen);
  nav.appendChild(editButton);
}

function renderCards(environment) {
  const container = document.getElementById("cards-container");
  container.innerHTML = "";
  environment.cards.forEach((card) => {
    const cardElement = createCardElement(card);
    container.appendChild(cardElement);
  });
}

function createCardElement(card) {
  const cardDiv = document.createElement("div");
  cardDiv.className = "card";
  cardDiv.setAttribute("data-card-number", card.cardNumber);

  cardDiv.innerHTML = `
    <div class="card-chip"></div>
    <img class="card-logo" src="${
      defaultLogo
    }" alt="Card Logo">
    <p class="card-number">${card.cardNumberDisplay}</p>
    <p class="card-response">${card.cardResponse}</p>
  `;

  cardDiv.addEventListener("click", function () {
    copyToClipboard(card.cardNumber);
  });

  return cardDiv;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(
    function () {
      showNotification("Número de tarjeta copiado al portapapeles: " + text);
    },
    function (err) {
      console.error("No se pudo copiar el texto: ", err);
    }
  );
}

function showNotification(message) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

function hideAllScreens() {
  document.getElementById("main-container").classList.add("hidden");
  document.getElementById("import-container").classList.add("hidden");
  document.getElementById("edit-container").classList.add("hidden");
}

function showImportScreen() {
  // Ocultar todas las pantallas primero
  hideAllScreens();
  // Mostrar la pantalla de importar
  document.getElementById("import-container").classList.remove("hidden");
  // Resetear el método selector a formulario por defecto
  switchMethod("form");
}

function hideImportScreen() {
  hideAllScreens();
  document.getElementById("main-container").classList.remove("hidden");
  clearImportForm();
}

function clearImportForm() {
  document.getElementById("json-input").value = "";
  document.getElementById("card-environment").value = "";
  document.getElementById("card-number").value = "";
  document.getElementById("card-response").value = "";
}

function switchMethod(method) {
  const formMethodBtn = document.getElementById("form-method-btn");
  const jsonMethodBtn = document.getElementById("json-method-btn");
  const formMethod = document.getElementById("form-method");
  const jsonMethod = document.getElementById("json-method");
  
  if (method === "form") {
    formMethodBtn.classList.add("active");
    jsonMethodBtn.classList.remove("active");
    formMethod.classList.remove("hidden");
    jsonMethod.classList.add("hidden");
  } else {
    jsonMethodBtn.classList.add("active");
    formMethodBtn.classList.remove("active");
    jsonMethod.classList.remove("hidden");
    formMethod.classList.add("hidden");
  }
}

function formatCardNumber(event) {
  let value = event.target.value.replace(/\D/g, '');
  value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
  event.target.value = value;
}

function handleImport() {
  const formMethodBtn = document.getElementById("form-method-btn");
  
  if (formMethodBtn.classList.contains("active")) {
    addSingleCard();
  } else {
    importCards();
  }
}

function addSingleCard() {
  const environment = document.getElementById("card-environment").value.trim();
  const cardNumber = document.getElementById("card-number").value.replace(/\s/g, '');
  const cardResponse = document.getElementById("card-response").value.trim();
  
  if (!environment || !cardNumber || !cardResponse) {
    showNotification("Por favor completa todos los campos");
    return;
  }
  
  if (!/^\d{13,19}$/.test(cardNumber)) {
    showNotification("Número de tarjeta inválido (13-19 dígitos)");
    return;
  }
  
  const cardNumberDisplay = cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  
  const newCard = {
    cardNumber: cardNumber,
    cardLogo: defaultLogo,
    cardNumberDisplay: cardNumberDisplay,
    cardResponse: cardResponse
  };
  
  // Buscar si el ambiente ya existe
  let targetEnvironment = environments.find(env => env.environment === environment);
  
  if (targetEnvironment) {
    // Verificar si la tarjeta ya existe
    if (targetEnvironment.cards.some(card => card.cardNumber === cardNumber)) {
      showNotification("Esta tarjeta ya existe en el ambiente");
      return;
    }
    targetEnvironment.cards.push(newCard);
    showNotification(`Tarjeta agregada al ambiente "${environment}"`);
  } else {
    // Crear nuevo ambiente
    targetEnvironment = {
      environment: environment,
      color: getRandomDarkColor(),
      cards: [newCard]
    };
    environments.push(targetEnvironment);
    showNotification(`Nuevo ambiente "${environment}" creado con la tarjeta`);
  }
  
  saveEnvironments();
  renderEnvironmentNav();
  currentEnvironment = targetEnvironment;
  renderCards(targetEnvironment);
  hideImportScreen();
}

function importCards() {
  const jsonInput = document.getElementById("json-input");
  try {
    const newEnvironment = JSON.parse(jsonInput.value);
    if (isValidEnvironment(newEnvironment)) {
      if (
        environments.some(
          (env) => env.environment === newEnvironment.environment
        )
      ) {
        throw new Error("Ya existe un ambiente con este nombre");
      }
      newEnvironment.color = getRandomDarkColor();
      newEnvironment.cardLogo= defaultLogo;
      environments.push(newEnvironment);
      saveEnvironments();
      renderEnvironmentNav();
      currentEnvironment = newEnvironment;
      renderCards(newEnvironment);
      jsonInput.value = "";
      showNotification("Nuevo ambiente importado correctamente");
      hideImportScreen();
    } else {
      throw new Error("Formato JSON inválido");
    }
  } catch (error) {
    showNotification("Error al importar ambiente: " + error.message);
  }
}

function isValidEnvironment(env) {
  return (
    env.environment && Array.isArray(env.cards) && env.cards.every(isValidCard)
  );
}

function isValidCard(card) {
  return card.cardNumber && card.cardNumberDisplay && card.cardResponse;
}

function getRandomDarkColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 40 + Math.random() * 20; // 40-60%
  const lightness = 10 + Math.random() * 10; // 10-20%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function showEditScreen() {
  // Ocultar todas las pantallas primero
  hideAllScreens();
  
  const environmentsList = document.getElementById("environments-list");
  environmentsList.innerHTML = "";

  environments.forEach((env, index) => {
    const envDiv = document.createElement("div");
    envDiv.className = "environment-item";
    envDiv.innerHTML = `
      <div class="environment-header">
        <div class="env-name-row">
          <input type="text" class="env-name" value="${env.environment}" data-index="${index}" placeholder="Nombre del ambiente">
        </div>
        <div class="env-buttons-row">
          <button class="edit-json" data-index="${index}">JSON</button>
          <button class="delete-env" data-index="${index}">Eliminar</button>
        </div>
      </div>
      <textarea class="json-edit hidden" data-index="${index}" placeholder="JSON de las tarjetas...">${JSON.stringify(
      env.cards,
      null,
      2
    )}</textarea>
    `;
    environmentsList.appendChild(envDiv);
  });

  document.querySelectorAll(".delete-env").forEach((button) => {
    button.addEventListener("click", deleteEnvironment);
  });

  document.querySelectorAll(".edit-json").forEach((button) => {
    button.addEventListener("click", function () {
      const index = this.getAttribute("data-index");
      const textarea = document.querySelector(
        `.json-edit[data-index="${index}"]`
      );
      const isHidden = textarea.classList.contains("hidden");
      textarea.classList.toggle("hidden");
      
      // Cambiar texto del botón
      this.textContent = isHidden ? "Ocultar" : "JSON";
    });
  });

  // Mostrar la pantalla de edición
  document.getElementById("edit-container").classList.remove("hidden");
}

function hideEditScreen() {
  hideAllScreens();
  document.getElementById("main-container").classList.remove("hidden");
  renderEnvironmentNav(); // Esto actualizará la barra de navegación con los datos no modificados
  if (currentEnvironment) {
    renderCards(currentEnvironment); // Esto mostrará las tarjetas del ambiente actual sin modificaciones
  }
}

function saveEditedEnvironment() {
  const inputs = document.querySelectorAll("#environments-list .env-name");
  const newNames = Array.from(inputs).map((input) => input.value.trim());

  // Validar nombres vacíos
  if (newNames.some(name => !name)) {
    showNotification("Error: Los nombres de ambiente no pueden estar vacíos");
    return;
  }

  // Validar nombres duplicados
  if (new Set(newNames).size !== newNames.length) {
    showNotification("Error: Nombres de ambiente duplicados");
    return;
  }

  // Actualizar nombres de ambientes
  inputs.forEach((input, index) => {
    if (environments[index]) {
      environments[index].environment = input.value.trim();
    }
  });

  // Actualizar JSON de tarjetas
  const textareas = document.querySelectorAll("#environments-list .json-edit");
  let hasError = false;
  
  textareas.forEach((textarea, index) => {
    if (hasError) return; // Si ya hay error, no continuar
    
    try {
      const newCards = JSON.parse(textarea.value);
      if (Array.isArray(newCards) && newCards.every(isValidCard)) {
        if (environments[index]) {
          environments[index].cards = newCards;
        }
      } else {
        throw new Error(
          `JSON inválido para el ambiente "${environments[index]?.environment || 'desconocido'}"`
        );
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`);
      hasError = true;
      return;
    }
  });

  if (hasError) return;

  saveEnvironments();
  renderEnvironmentNav();
  hideEditScreen();
  showNotification("Ambientes actualizados correctamente");
}

function deleteEnvironment(event) {
  const index = parseInt(event.target.getAttribute("data-index"));
  const deletedEnv = environments[index];
  
  environments.splice(index, 1);
  
  // Si se eliminó el ambiente actual, cambiar al "default" o al primero disponible
  if (currentEnvironment && currentEnvironment.environment === deletedEnv.environment) {
    currentEnvironment = environments.length > 0 ? 
      (environments.find(env => env.environment === "default") || environments[0]) : null;
  }
  
  saveEnvironments();
  showEditScreen(); // Refresh the edit screen
  showNotification("Ambiente eliminado correctamente");
}

function updateEnvironmentJSON(index, jsonString) {
  try {
    const newCards = JSON.parse(jsonString);
    if (Array.isArray(newCards) && newCards.every(isValidCard)) {
      environments[index].cards = newCards;
      saveEnvironments();
      showNotification("JSON de tarjetas actualizado correctamente");
    } else {
      throw new Error("Formato JSON inválido");
    }
  } catch (error) {
    showNotification("Error al actualizar JSON: " + error.message);
  }
}

function openSupportLink() {
  chrome.tabs.create({
    url: "https://buy.stripe.com/cNi00igBN2Ki881b756EU00"
  });
}
