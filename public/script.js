const TELEGRAM_BOT_URL = 'https://t.me/FitAdmin2_bot';
const GITHUB_URL = 'https://github.com/marina-zhuk/tg-bookingbot';
const CONTACT_URL = 'https://t.me/prssfff';

function applyLinks(selector, url) {
  document.querySelectorAll(selector).forEach((link) => {
    link.href = url;
    link.target = '_blank';
    link.rel = 'noreferrer';
  });
}

applyLinks('.js-telegram-link', TELEGRAM_BOT_URL);
applyLinks('.js-github-link', GITHUB_URL);
applyLinks('.js-contact-link', CONTACT_URL);

document.querySelectorAll('.screenshot-card img').forEach((image) => {
  image.addEventListener('error', () => {
    const card = image.closest('.screenshot-card');
    if (!card) return;
    card.classList.add('missing');
    image.remove();
  });
});
