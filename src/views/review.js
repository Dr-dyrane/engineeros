/* EngineerOS · Weekly Review */

import { store, touchStreak, saveNow } from '../core/state.js';
import { qs, esc, icon } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { celebrate, toast } from '../core/feedback.js';
import { pageHeader, badge, emptyState } from '../ui/components.js';

export function renderReview() {
  const past = (store.s.reviews || []).slice().reverse().map(r => `
    <div class="card">
      <div class="mb-2">${badge(r.date, 'accent')}</div>
      ${r.done ? `<p class="t-callout"><strong>Completed:</strong> ${esc(r.done)}</p>` : ''}
      ${r.learned ? `<p class="t-callout mt-1"><strong>Learned:</strong> ${esc(r.learned)}</p>` : ''}
      ${r.built ? `<p class="t-callout mt-1"><strong>Built:</strong> ${esc(r.built)}</p>` : ''}
      ${r.next ? `<p class="t-callout mt-1"><strong>Next:</strong> ${esc(r.next)}</p>` : ''}
    </div>`).join('');

  qs('#view-review').innerHTML = `<div class="stagger">
    ${pageHeader('Sunday ritual', 'Weekly review', 'Five minutes. Five questions. Then close the laptop.')}
    <div class="card">
      <div class="field"><label>What did I complete?</label><textarea class="textarea" id="rv-done" placeholder="Missions, tasks, applications…"></textarea></div>
      <div class="field"><label>What did I learn?</label><textarea class="textarea" id="rv-learned" placeholder="One or two things."></textarea></div>
      <div class="field"><label>What confused me?</label><textarea class="textarea" id="rv-confused" placeholder="Name it so you can tackle it."></textarea></div>
      <div class="field"><label>What did I build?</label><textarea class="textarea" id="rv-built" placeholder="A script, a doc, a post, a circuit…"></textarea></div>
      <div class="field"><label>What will I do next week?</label><textarea class="textarea" id="rv-next" placeholder="Keep it small and real."></textarea></div>
      <button class="btn btn-primary" data-action="save-review">${icon('check')} Save this week</button>
    </div>
    ${past ? `<h3 class="section-label mt-6">Past reviews</h3>${past}` : emptyState('flag', 'Your saved reviews will appear here.')}
  </div>`;
}
registerView('review', renderReview);

export function saveReview() {
  const g = id => (qs('#rv-' + id) ? qs('#rv-' + id).value.trim() : '');
  const r = { date: new Date().toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }),
    done:g('done'), learned:g('learned'), confused:g('confused'), built:g('built'), next:g('next') };
  if (!r.done && !r.learned && !r.confused && !r.built && !r.next) { toast('Write at least one line first', false); return; }
  store.s.reviews.push(r); touchStreak(); saveNow(); celebrate();
  renderReview();   // refresh in place to show the new entry
}
