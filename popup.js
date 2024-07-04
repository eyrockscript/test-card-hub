document.addEventListener('DOMContentLoaded', function () {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('click', function () {
      const cardNumber = this.getAttribute('data-card-number');
      copyToClipboard(cardNumber);
    });
  });
});

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function() {
    showNotification('Número de tarjeta copiado al portapapeles: ' + text);
  }, function(err) {
    console.error('No se pudo copiar el texto: ', err);
  });
}

function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}
