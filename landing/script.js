const TELEGRAM_BOT_URL = 'https://t.me/FitAdmin2_bot';
const GITHUB_URL = 'https://github.com/marina-zhuk/tg-bookingbot-gravity';

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
applyLinks('.js-github-link', GITHUB_URL);

document.querySelectorAll('.screenshot-card img').forEach((image) => {
  image.addEventListener('error', () => {
    image.closest('.screenshot-card')?.classList.add('missing');
  });
});
