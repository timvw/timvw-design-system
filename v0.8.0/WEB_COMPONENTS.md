# One import per component

Import a component once, then use its tag as often as needed. Each entry registers
its native custom element and supplies its template, styles and behavior.
No separate CSS link, template registration, `init()`, framework or build step is required.

```html
<script type="module" src="./components/dialog.js"></script>

<tvw-dialog open-label="Open project">
  <h2 slot="heading">Project Atlas</h2>
  <p>Your project details.</p>
</tvw-dialog>
```

Copy `components/` from the runtime ZIP, preserving relative paths, plus the
license and notices. Serve it over HTTP. `dialog.js` loads only `shared.js` and
`tokens.js`; `card.js` uses the same two shared modules. HTML and CSS are included
in these JavaScript modules. Styles are installed synchronously in the shadow
root before the tag becomes interactive, using shared constructed stylesheets.
There are no stylesheet fetches or unrelated feature imports.

See the [working demonstration](examples/packaged-components.html). Its page
layout and authored form controls have their own CSS; the component frames,
default buttons and modal need none of that page CSS.

## Available tags

| Entry | Tag | Slots |
| --- | --- | --- |
| `components/dialog.js` | `<tvw-dialog>` | `trigger`, `heading`, default content, `actions` |
| `components/card.js` | `<tvw-card>` | `heading`, default content, `actions` |

These two packaged components are opt-in. Importing `js/timvw.js` does not register
them. Other components continue to use the [full or selective entries](MODULES.md).
All instances share their definition. Tags already in the document upgrade when
the module loads; tags inserted later work automatically.

```html
<script type="module" src="./components/card.js"></script>
<tvw-card>
  <h2 slot="heading">Project Atlas</h2>
  <p>A short description of this workspace.</p>
  <a slot="actions" href="/projects/atlas">View project</a>
</tvw-card>
```

## Slots are native HTML

The component owns a shadow tree containing real `<slot>` elements. You put
ordinary HTML directly inside the tag; a `slot` attribute selects its position.
Unmarked children go into the default slot. Named slot assignments belong on
direct children of the host. You can put arbitrary nested markup inside them.

The browser projects the original nodes. It does not clone them or parse template
expressions. Your references, listeners, field values and application bindings
survive opening, heading edits and reconnection. Update or replace slotted content
with ordinary DOM APIs. Choose an appropriate heading level and give every form
control a visible label. IDs in your authored content still need to be unique in
the document; the internal shadow IDs are isolated per instance.

This follows the platform's [slot model](https://html.spec.whatwg.org/multipage/scripting.html#the-slot-element)
and [custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html).
The existing `registerTemplate()` helper stays in light DOM and keeps its text
attribute bindings; it does not gain implicit slot projection.

## Dialog API

The host contains a native modal `<dialog>`. The browser supplies the top layer,
background inertness and Escape behavior. Its accessible name comes from a shadow
wrapper around the heading slot, so rich headings and later text edits work
without cross-tree ID references. Always supply a meaningful heading.

| Attribute | Meaning |
| --- | --- |
| `heading` | Fallback heading when no `heading` slot is supplied; default `Dialog` |
| `open-label` | Default trigger text; default `Open dialog` |
| `close-label` | Built-in close button text; default `Close` |
| `disabled` | Disables the default trigger and ignores custom trigger activation |

Use these attributes for localized button labels. A custom trigger must be a native
`<button type="button" slot="trigger" aria-haspopup="dialog">`; it keeps normal
keyboard activation. If you supply it, maintain its own `disabled` attribute as
well so its visible and announced disabled state agrees with the host.
The built-in close button remains available even when you supply footer actions.

```js
await customElements.whenDefined('tvw-dialog');
const dialog = document.getElementById('project');
dialog.showModal();              // Repeated calls while open are harmless.
dialog.close('saved');           // Optional return value, always a string.
console.log(dialog.open);        // Read-only boolean.
console.log(dialog.returnValue); // Resets to '' on the next opening.

dialog.addEventListener('tvw-close', event => {
  console.log(event.detail.returnValue);
});
dialog.addEventListener('tvw-cancel', event => {
  if (mustKeepEditing()) event.preventDefault();
});
```

`tvw-close` and the cancelable `tvw-cancel` bubble across shadow boundaries.
Escape raises `tvw-cancel`; explicit close actions raise only `tvw-close`.
Listen for `tvw-close` before reacting to completed dismissal. There is no writable
`open` attribute: use the methods so modal behavior remains correct. Programmatic
`showModal()` requires a connected host and can open a disabled host intentionally.
Focus returns to the connected opener. An authored visible, enabled `autofocus`
element receives initial focus; otherwise the native dialog chooses initial focus.
Removing or moving a host closes its modal; reconnecting retains authored state.
Moving between documents/iframes is outside the supported lifecycle.

## Forms and actions inside a slot

Slotting changes rendering, not DOM parentage: an authored form is not a DOM
descendant of the internal dialog. This component therefore explicitly handles
slotted `method="dialog"` submissions after native validation succeeds. A submitter's
`formmethod="dialog"` is supported too, and its `value` becomes the return value.

```html
<tvw-dialog id="project" open-label="Edit project">
  <h2 slot="heading">Edit Atlas</h2>
  <form method="dialog">
    <label for="project-name">Project name</label>
    <input id="project-name" name="name" required autofocus>
    <button value="saved">Save</button>
  </form>
  <button slot="actions" type="button" data-tvw-close value="cancelled">Cancel</button>
</tvw-dialog>
```

`data-tvw-close` on a button closes without validating fields. Keep cancel buttons
`type="button"`. For asynchronous saves, prevent submission in a listener on the
authored form, await your application request, then call `close('saved')` after
success. Failed requests should leave the modal and draft open. The component does
not persist data. Ordinary GET/POST forms retain their normal submission behavior.
Use `requestSubmit()` for programmatic validation/submission; `form.submit()` bypasses
submit events and cannot use this bridge. Do not nest forms. Native field names,
labels and form ownership still belong to your application.

## Styling and themes

Packaged tags provide their own QuantumBlack-derived defaults and follow system
light/dark appearance. Set `data-tvw-theme="light"`, `"dark"` or `"system"` on the
host or an ancestor, including `<html>`, to select a preference. Changes are observed;
removing the preference restores inheritance/system behavior. No storage is written.

Existing public `--tvw-*` tokens inherit into the shadow tree and take priority over
the defaults. This also integrates the tags with the full library's theme picker.
Set page themes at the page level when using global tokens; a local theme preference
does not replace explicitly inherited color tokens.

```css
tvw-dialog { --tvw-radius: .75rem; }
tvw-dialog::part(dialog) { width: min(42rem, calc(100% - 2rem)); }
tvw-card::part(surface) { padding: 2rem; }
```

Dialog parts: `trigger`, `dialog`, `heading`, `body`, `actions`, `close`.
Card parts: `surface`, `actions`. Global `.tvw-*` selectors cannot reach the internal
shadow markup. Use custom properties and `::part()` rather than internal selectors.
Slotted content remains yours to style: document CSS still reaches it, including
nested form controls. A slot rule can style its directly assigned elements but cannot
style all of their descendants. The component supplies basic direct heading, paragraph,
link and button styling; load the normal form CSS only if your authored forms need it.

The entries require native custom elements, Shadow DOM, constructed stylesheets,
CSS `light-dark()` and the existing modern CSS/browser features. No polyfills are
included. Keep essential content available without JavaScript. Before registration,
custom tags display their authored children; optionally use an application-owned
`:not(:defined)` loading style, paired with an appropriate no-JavaScript fallback.

## Package your own tag the same way

An ES module can own HTML, CSS and JavaScript together. Here is a complete independent
`components/project-message.js`; only its module path is needed in the consuming page:

```js
const template = document.createElement('template');
template.innerHTML = '<aside part="surface"><slot name="heading"></slot><slot></slot></aside>';
const styles = new CSSStyleSheet();
styles.replaceSync(`
  :host { display: block; }
  aside { padding: 1.5rem; border: 1px solid currentColor; border-radius: .5rem; }
`);

class ProjectMessage extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.adoptedStyleSheets = [styles];
    root.append(template.content.cloneNode(true));
    // Add component behavior here. Keep external listeners in the connection
    // lifecycle and remove them in disconnectedCallback().
  }
}
if (!customElements.get('project-message')) {
  customElements.define('project-message', ProjectMessage);
}
```

```html
<script type="module" src="./components/project-message.js"></script>
<project-message>
  <h2 slot="heading">Ready to review</h2>
  <p>The workspace is available.</p>
</project-message>
```

Templates and stylesheet strings are trusted component source, never user input.
Use text nodes or authored DOM for dynamic data. Keep application component names
under your own prefix and import one library version per document: the native
registry cannot replace an already registered tag with another version. Separate
versioned demo pages can continue to coexist. `shared.js` and `tokens.js` are internal
dependencies, not a public component-authoring API.
