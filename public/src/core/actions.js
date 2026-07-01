// @ts-check
/* EngineerOS · Action + input registries.
   Views register their own handlers next to registerView, so main.js stays a
   thin shell and never grows a case per feature.

   - registerActions('rs-', fn)  -> clicks on [data-action^="rs-"] call fn(action, value, el)
   - registerAction('save-x', fn) -> exact-name click handler, fn(value, el)
   - registerInput('data-rs', fn) -> input events on [data-rs] call fn(pathAttr, el.value, el)
   - registerChange('data-rs-check', fn) -> change events, fn(pathAttr, el.checked, el) */

/** @typedef {(action:string, value:string, el:Element)=>void} PrefixHandler */
/** @typedef {(value:string, el:Element)=>void} ExactHandler */
/** @typedef {(path:string, value:any, el:Element)=>void} FieldHandler */

/** @type {{prefix:string, fn:PrefixHandler}[]} */ const prefixes = [];
/** @type {Record<string, ExactHandler>} */ const exact = {};
/** @type {{attr:string, fn:FieldHandler}[]} */ const inputs = [];
/** @type {{attr:string, fn:FieldHandler}[]} */ const changes = [];

/** @param {string} prefix @param {PrefixHandler} fn */
export function registerActions(prefix, fn) { prefixes.push({ prefix, fn }); }
/** @param {string} name @param {ExactHandler} fn */
export function registerAction(name, fn) { exact[name] = fn; }
/** @param {string} attr @param {FieldHandler} fn */
export function registerInput(attr, fn) { inputs.push({ attr, fn }); }
/** @param {string} attr @param {FieldHandler} fn */
export function registerChange(attr, fn) { changes.push({ attr, fn }); }

/** @param {string} action @param {string} value @param {Element} el @returns {boolean} */
export function dispatchAction(action, value, el) {
  if (exact[action]) { exact[action](value, el); return true; }
  for (const h of prefixes) if (action.indexOf(h.prefix) === 0) { h.fn(action, value, el); return true; }
  return false;
}
/** @param {{attr:string, fn:FieldHandler}[]} list @param {Event} e @param {string} prop @returns {boolean} */
function dispatchOn(list, e, prop) {
  const target = /** @type {Element|null} */ (e.target);
  if (!target || !target.closest) return false;
  for (const h of list) {
    const el = target.closest('[' + h.attr + ']');
    if (el) { h.fn(el.getAttribute(h.attr) || '', /** @type {any} */ (el)[prop], el); return true; }
  }
  return false;
}
export const dispatchInput = (e) => dispatchOn(inputs, e, 'value');
export const dispatchChange = (e) => dispatchOn(changes, e, 'checked');
