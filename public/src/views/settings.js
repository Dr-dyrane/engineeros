/* EngineerOS · Settings */

import { store } from '../core/state.js';
import { qs, esc, icon } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { pageHeader } from '../ui/components.js';
import { syncStatus } from '../core/sync.js';

let codeRevealed = false;
export function toggleCodeReveal() { codeRevealed = !codeRevealed; }
function timeAgo(ts) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return m + (m === 1 ? ' minute ago' : ' minutes ago');
  const h = Math.round(m / 60); if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
  const d = Math.round(h / 24); return d + (d === 1 ? ' day ago' : ' days ago');
}

export function renderSettings() {
  qs('#view-settings').innerHTML = `<div class="stagger">
    ${pageHeader('Settings', 'Your system')}

    <div class="card">
      <div class="field"><label>Your name</label>
        <input class="input" id="set-name" value="${esc(store.s.user.name)}" placeholder="Your name" /></div>
      <div class="field" style="margin-bottom:0"><label>Appearance</label>
        <div class="segmented" id="set-theme">
          <button data-theme-set="system" class="${store.s.theme==='system'?'is-on':''}">System</button>
          <button data-theme-set="light" class="${store.s.theme==='light'?'is-on':''}">Light</button>
          <button data-theme-set="dark" class="${store.s.theme==='dark'?'is-on':''}">Dark</button>
        </div></div>
    </div>

    <div class="card">
      <div class="row between">
        <div class="grow"><div class="fw-semibold">Free navigation</div>
          <div class="t-foot text-3">Unlock every journey and mission now, instead of one step at a time.</div></div>
        <button class="switch ${store.s.freeNav ? 'is-on' : ''}" data-action="toggle-freenav" aria-label="Toggle free navigation">
          <span class="knob"></span>
        </button>
      </div>
    </div>

    <h3 class="section-label mt-5">Reminders</h3>
    <div class="card">
      <div class="row between">
        <div class="grow"><div class="fw-semibold">Daily reminder</div>
          <div class="t-foot text-3">A gentle nudge once a day, plus a note when you finish a journey or keep a streak alive. Turn it off anytime.</div></div>
        <button class="switch ${store.s.flags.notify ? 'is-on' : ''}" data-action="toggle-notify" aria-label="Toggle reminders">
          <span class="knob"></span>
        </button>
      </div>
      <p class="t-foot text-3 mt-3">Works even when the app is closed. To send it, we store only an anonymous reminder token. Your name, progress, and notes never leave this device.</p>
    </div>

    <h3 class="section-label mt-5">Feedback</h3>
    <div class="card">
      <button class="btn btn-ghost" data-action="send-feedback">${icon('message-circle')} Send feedback</button>
      <button class="btn btn-ghost mt-3" data-action="suggest-feature">${icon('lightbulb')} Suggest a feature</button>
      <p class="t-foot text-3 mt-3">This opens your email app. Tell us what would make EngineerOS more useful.</p>
    </div>

    <h3 class="section-label mt-5">Your data</h3>
    <div class="card">
      <button class="btn btn-ghost" data-action="export-json">${icon('download')} Export progress (JSON)</button>
      <button class="btn btn-ghost mt-3" data-action="import-json">${icon('upload')} Import progress (JSON)</button>
      <button class="btn btn-ghost mt-3" data-action="reset" style="color:var(--red)">${icon('trash-2')} Reset everything</button>
      <p class="t-foot text-3 mt-3">Your progress lives only on this device. Export a backup before switching phones or browsers.</p>
    </div>

    <h3 class="section-label mt-5">Sync across devices</h3>
    ${(() => {
      const s = syncStatus();
      if (!s.on) return `
    <div class="card">
      <div class="row between">
        <div class="grow"><div class="fw-semibold">Encrypted sync</div>
          <div class="t-foot text-3">Carry your progress to another device with a secret code. Everything is encrypted on this device, so we only ever store unreadable text and cannot read your progress or notes.</div></div>
        <button class="switch" data-action="sync-enable" aria-label="Turn on sync"><span class="knob"></span></button>
      </div>
      <details class="mt-3"><summary class="t-foot text-3" style="cursor:pointer">+ I already have a sync code</summary>
        <div class="field mt-2" style="margin-bottom:0">
          <input class="input" id="sync-code-input" placeholder="Paste your sync code" autocapitalize="characters" autocomplete="off" spellcheck="false" />
          <button class="btn btn-ghost mt-2" data-action="sync-link">${icon('refresh-cw')} Link this device</button>
        </div>
      </details>
    </div>`;
      const masked = s.code.replace(/[^-]/g, '•');
      return `
    <div class="card">
      <div class="row between">
        <div class="grow"><div class="fw-semibold">Sync is on</div>
          <div class="t-foot text-3">Encrypted end to end. Last synced ${esc(s.last ? timeAgo(s.last) : 'just now')}.</div></div>
        <button class="switch is-on" data-action="sync-off" aria-label="Turn off sync"><span class="knob"></span></button>
      </div>
      <div class="field mt-3" style="margin-bottom:0"><label>Your sync code</label>
        <div class="row" style="gap:8px; align-items:center">
          <input class="input" id="sync-code" value="${esc(codeRevealed ? s.code : masked)}" readonly style="letter-spacing:.08em" />
          <button class="btn btn-ghost btn-sm" data-action="sync-reveal" aria-label="Reveal code">${icon(codeRevealed ? 'eye-off' : 'eye')}</button>
          <button class="btn btn-ghost btn-sm" data-action="sync-copy" aria-label="Copy code">${icon('copy')}</button>
        </div>
        <p class="t-foot text-3 mt-2">On another device, open Settings, tap “I already have a sync code,” and enter this. Save it somewhere safe: without it, the synced copy cannot be recovered.</p>
      </div>
    </div>`;
    })()}

    <p class="t-foot text-3 center mt-5">EngineerOS v1.0 · Dyrane Academy<br>One mission at a time.</p>
  </div>`;
}
registerView('settings', renderSettings);
