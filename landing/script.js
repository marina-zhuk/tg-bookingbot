const TELEGRAM_BOT_URL = 'https://t.me/FitAdmin2_bot';
const CONTACT_URL = 'https://t.me/prssfff';

function applyLinks(selector, url) {
  document.querySelectorAll(selector).forEach((link) => {
    link.href = url;
    if (url === '#') {
      link.setAttribute('aria-disabled', 'true');
      link.addEventListener('click', (event) => event.preventDefault());
    } else {
      link.target = '_blank';
      link.rel = 'noreferrer';
    }
  });
}

applyLinks('.js-telegram-link', TELEGRAM_BOT_URL);
applyLinks('.js-contact-link', CONTACT_URL);

document.querySelectorAll('.screenshot-card img').forEach((image) => {
  image.addEventListener('error', () => {
    image.closest('.screenshot-card')?.classList.add('missing');
  });
});
