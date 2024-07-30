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
    .addEventListener("click", importCards);
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
});

function loadEnvironments() {
  const storedEnvironments = localStorage.getItem("creditCardEnvironments");
  if (storedEnvironments) {
    environments = JSON.parse(storedEnvironments);
  } else {
    environments = [
      {
        environment: "development",
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
            cardResponse: "Tarjeta no válida",
          },
          {
            cardNumber: "4349008516656431",
            cardLogo: defaultLogo,
            cardNumberDisplay: "4349 0085 1665 6431",
            cardResponse: "Tarjeta no compatible",
          },
          {
            cardNumber: "4349001210846432",
            cardLogo: defaultLogo,
            cardNumberDisplay: "4349 0012 1084 6432",
            cardResponse: "Tarjeta sin fondos",
          },
          {
            cardNumber: "4349003243371321",
            cardLogo: defaultLogo,
            cardNumberDisplay: "4349 0032 4337 1321",
            cardResponse: "Imposible verificar CVV",
          },
          {
            cardNumber: "4349001386781322",
            cardLogo: defaultLogo,
            cardNumberDisplay: "4349 0013 8678 1322",
            cardResponse: "Tarjeta bloqueada por el banco",
          },
        ],
      },
    ];
    saveEnvironments();
  }

  renderEnvironmentNav();
  if (environments.length > 0) {
    currentEnvironment = environments[0];
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
    button.addEventListener("click", () => {
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
      card.cardLogo || defaultLogo
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

function showImportScreen() {
  document.getElementById("main-container").classList.add("hidden");
  document.getElementById("import-container").classList.remove("hidden");
}

function hideImportScreen() {
  document.getElementById("main-container").classList.remove("hidden");
  document.getElementById("import-container").classList.add("hidden");
  document.getElementById("json-input").value = "";
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
  const editContainer = document.getElementById("edit-container");
  editContainer.innerHTML = "";

  environments.forEach((env, index) => {
    const envDiv = document.createElement("div");
    envDiv.innerHTML = `
      <input type="text" class="env-name" value="${env.environment}" data-index="${index}">
      <button class="edit-json" data-index="${index}">Editar JSON</button>
      <button class="delete-env" data-index="${index}">Eliminar</button>
      <textarea class="json-edit hidden" data-index="${index}">${JSON.stringify(
      env.cards,
      null,
      2
    )}</textarea>
    `;
    editContainer.appendChild(envDiv);
  });

  // Agregar botones de guardar y cancelar
  const buttonsDiv = document.createElement("div");
  buttonsDiv.className = "edit-buttons";
  buttonsDiv.innerHTML = `
    <button id="save-edit-button">Guardar cambios</button>
    <button id="cancel-edit-button">Cancelar</button>
  `;
  editContainer.appendChild(buttonsDiv);

  document.querySelectorAll(".delete-env").forEach((button) => {
    button.addEventListener("click", deleteEnvironment);
  });

  document.querySelectorAll(".edit-json").forEach((button) => {
    button.addEventListener("click", function () {
      const index = this.getAttribute("data-index");
      const textarea = document.querySelector(
        `.json-edit[data-index="${index}"]`
      );
      textarea.classList.toggle("hidden");
    });
  });

  document.getElementById("main-container").classList.add("hidden");
  document.getElementById("import-container").classList.add("hidden");
  editContainer.classList.remove("hidden");

  // Añadir event listeners para los botones de guardar y cancelar
  document
    .getElementById("save-edit-button")
    .addEventListener("click", saveEditedEnvironment);
  document
    .getElementById("cancel-edit-button")
    .addEventListener("click", hideEditScreen);
}

function hideEditScreen() {
  document.getElementById("main-container").classList.remove("hidden");
  document.getElementById("edit-container").classList.add("hidden");
  renderEnvironmentNav(); // Esto actualizará la barra de navegación con los datos no modificados
  if (currentEnvironment) {
    renderCards(currentEnvironment); // Esto mostrará las tarjetas del ambiente actual sin modificaciones
  }
}

function saveEditedEnvironment() {
  const inputs = document.querySelectorAll("#edit-container .env-name");
  const newNames = Array.from(inputs).map((input) => input.value);

  if (new Set(newNames).size !== newNames.length) {
    showNotification("Error: Nombres de ambiente duplicados");
    return;
  }

  inputs.forEach((input, index) => {
    environments[index].environment = input.value;
  });

  const textareas = document.querySelectorAll("#edit-container .json-edit");
  textareas.forEach((textarea, index) => {
    try {
      const newCards = JSON.parse(textarea.value);
      if (Array.isArray(newCards) && newCards.every(isValidCard)) {
        environments[index].cards = newCards;
      } else {
        throw new Error(
          `JSON inválido para el ambiente ${environments[index].environment}`
        );
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`);
      return;
    }
  });

  saveEnvironments();
  renderEnvironmentNav();
  hideEditScreen();
  showNotification("Ambientes actualizados correctamente");
}

function deleteEnvironment(event) {
  const index = event.target.getAttribute("data-index");
  environments.splice(index, 1);
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
