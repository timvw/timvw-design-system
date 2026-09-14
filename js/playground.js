import { ready } from '../components/page.js?v=0.9.0';
await ready;
document.getElementById('playground-controls').hidden = false;
const component = document.getElementById('play-component'), label = document.getElementById('play-label'), variant = document.getElementById('play-variant');
const preview = document.getElementById('play-preview'), source = document.getElementById('play-source');
const variants = { button: ['primary', 'secondary', 'quiet', 'danger'], notice: ['info', 'success', 'warning', 'danger'], input: ['text', 'email', 'password'], card: ['default'] };
const parts = { button: 'buttons', notice: 'feedback', input: 'forms', card: 'card' };
function render(changeComponent = false) {
  const type = component.value;
  if (changeComponent) { variant.replaceChildren(...variants[type].map(value => new Option(value, value))); }
  document.getElementById('play-size-field').hidden = type !== 'button';
  document.getElementById('play-disabled-field').hidden = !['button','input'].includes(type);
  document.getElementById('play-invalid-field').hidden = type !== 'input';
  const node = document.createElement(type === 'button' ? 'button' : type === 'notice' ? 'div' : type === 'input' ? 'div' : 'tvw-card');
  if (type === 'button') {
    node.type = 'button'; node.className = 'tvw-button' + (variant.value === 'primary' ? '' : ` tvw-button--${variant.value}`);
    const size = document.getElementById('play-size').value; if (size !== 'default') node.classList.add(`tvw-button--${size}`);
    node.disabled = document.getElementById('play-disabled').checked; node.textContent = label.value;
    node.addEventListener('click', () => { document.getElementById('play-status').textContent = 'Preview button activated.'; });
  } else if (type === 'notice') { node.className = `tvw-notice tvw-notice--${variant.value}`; node.textContent = label.value; }
  else if (type === 'input') {
    node.className = 'tvw-field'; const fieldLabel = document.createElement('label'); fieldLabel.htmlFor = 'preview-field'; fieldLabel.textContent = label.value;
    const input = document.createElement('input'); input.type = variant.value; input.id = 'preview-field'; input.name = 'example'; input.className = 'tvw-input'; input.disabled = document.getElementById('play-disabled').checked;
    node.append(fieldLabel, input);
    if (document.getElementById('play-invalid').checked) { input.setAttribute('aria-invalid','true'); input.setAttribute('aria-describedby','preview-error'); const error = document.createElement('span'); error.id = 'preview-error'; error.className = 'tvw-error'; error.textContent = 'Please review this value.'; node.append(error); }
  } else { const heading = document.createElement('h3'), text = document.createElement('p'); heading.slot = 'heading'; heading.textContent = label.value; text.textContent = 'Supporting content goes here.'; node.append(heading, text); }
  node.dir = document.getElementById('play-rtl').checked ? 'rtl' : 'ltr';
  preview.replaceChildren(node); source.textContent = `<script type="module" src="./components/${parts[type]}.js"></script>\n${node.outerHTML}`; document.getElementById('play-status').textContent = '';
  document.getElementById('play-dependencies').textContent = `One import: components/${parts[type]}.js. Styles and behavior are included automatically.`;
}
component.addEventListener('change', () => render(true));
document.getElementById('playground-controls').addEventListener('input', event => { if (event.target !== component) render(); });
document.getElementById('playground-controls').addEventListener('submit', event => event.preventDefault());
const copy = document.getElementById('play-copy'); copy.hidden = false;
copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(source.textContent); document.getElementById('copy-status').textContent = 'Copied.'; } catch { document.getElementById('copy-status').textContent = 'Select and copy the HTML above.'; } });
render(true);
