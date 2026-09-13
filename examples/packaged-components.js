const buttons = document.querySelectorAll('[data-theme]');
for (const button of buttons) button.addEventListener('click', () => {
  document.documentElement.dataset.tvwTheme = button.dataset.theme;
  for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
});
document.getElementById('atlas').addEventListener('tvw-close', event => {
  document.getElementById('dialog-result').textContent = event.detail.returnValue === 'saved' ? 'Atlas note saved in this demo. Reopen it to continue editing.' : 'Atlas closed. Your draft stays in the dialog.';
});
