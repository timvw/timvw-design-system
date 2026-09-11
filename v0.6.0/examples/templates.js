import { initDialogs } from '../js/dialogs.js?v=0.6.0';
import { instantiateTemplate } from '../js/templates.js?v=0.6.0';
const template = document.getElementById('dialog-template'), container = document.getElementById('instances');
let count = 0;
function add() {
  count++;
  const instance = instantiateTemplate(template, { values: { button: `Open project ${count}`, title: `Project ${count}`, description: 'This dialog was cloned from the same native HTML template. Its label and opener reference only this instance.' } });
  container.append(instance.fragment); initDialogs(container);
}
add(); add(); const button = document.getElementById('add-template'); button.hidden = false; button.addEventListener('click', add);
