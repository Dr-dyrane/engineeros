import { JSDOM } from 'jsdom';
import { pathToFileURL, fileURLToPath } from 'url';
import fs from 'fs';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE = fs.existsSync(ROOT + '/public/index.html') ? ROOT + '/public' : ROOT;
const html = fs.readFileSync(BASE+'/index.html','utf8');
const errors=[]; let downloads=0, copies=0;
process.on('uncaughtException',e=>errors.push('UNCAUGHT: '+(e&&(e.stack||e.message))));

const dom = new JSDOM(html, { runScripts:'outside-only', pretendToBeVisual:true, url:'https://localhost/' });
const { window } = dom;
// ---- globals the ES modules expect ----
globalThis.window = window;
globalThis.document = window.document;
try { globalThis.localStorage = window.localStorage; } catch(e){}
try { globalThis.URL.createObjectURL=()=>{downloads++;return 'blob:x';}; globalThis.URL.revokeObjectURL=()=>{}; } catch(e){}
globalThis.matchMedia = window.matchMedia = (q)=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
window.scrollTo=()=>{}; globalThis.confirm=()=>true; window.confirm=()=>true;
window.HTMLAnchorElement.prototype.click=function(){};
try { Object.defineProperty(globalThis.navigator,'clipboard',{value:{writeText:async()=>{copies++;}},configurable:true}); } catch(e){}
window.addEventListener('error',e=>errors.push('onerror: '+(e.error&&e.error.stack||e.message)));
process.on('unhandledRejection',e=>{ errors.push('REJECT: '+(e&&(e.stack||e.message))); });

const click=el=>{ if(!el){errors.push('missing click target');return;} el.dispatchEvent(new window.MouseEvent('click',{bubbles:true})); };
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const av=()=>{const v=[...document.querySelectorAll('.view')].find(v=>v.classList.contains('is-active'));return v?v.id:'(none)';};
const A=(c,m)=>{ if(!c) errors.push('FAIL: '+m); };

// import the app (runs init())
await import(pathToFileURL(BASE+'/src/main.js').href);
await wait(60);

A(av()==='view-welcome','welcome first ('+av()+')');
click(document.querySelector('[data-action="to-setup"]')); await wait(20);
A(av()==='view-setup','setup ('+av()+')');
document.querySelector('#nameInput').value='Ada';
click(document.querySelector('[data-action="finish-setup"]')); await wait(20);
A(av()==='view-home','home after setup ('+av()+')');
A(document.querySelector('#view-home').textContent.includes('Ada'),'name in greeting');
A(document.querySelectorAll('#view-home .ready').length===4,'4 readiness tiles');
A(document.querySelectorAll('#view-home .home-grid > .stack').length===2,'home dashboard is two columns (2 stack children)');
A(document.querySelectorAll('#view-home .home-grid').length===1,'one home-grid');
A(/gap|great shape/.test(document.querySelector('#view-home').textContent),'home coach nudge present');

for(const v of ['journeys','build','review','resources','home']){ click(document.querySelector('.tab[data-value="'+v+'"]')); await wait(10); A(av()==='view-'+v,'nav '+v+' ('+av()+')'); }

// journey + mission
click(document.querySelector('[data-action="open-journey"][data-value="0"]')); await wait(10);
A(av()==='view-journey','journey opens');
click(document.querySelector('#view-journey [data-action="open-mission"]')); await wait(10);
A(av()==='view-mission','mission opens');
const cb=document.querySelector('[data-check]'); cb.checked=true; cb.dispatchEvent(new window.Event('change',{bubbles:true}));
const rt=document.querySelector('[data-reflect]'); rt.value='I got stuck on the wiring part today'; rt.dispatchEvent(new window.Event('input',{bubbles:true})); await wait(10);
A(document.querySelector('#mission-coach') && document.querySelector('#mission-coach').textContent.length>0,'mission reflection coach replies');
A(document.querySelector('#checkbar').style.width!=='0%','checklist meter moved');
click(document.querySelector('[data-action="complete-mission"]')); await wait(1100);
let st=JSON.parse(localStorage.getItem('engineeros.v1'));
A(Object.keys(st.completed).length>=1,'mission completed');
A(st.streak.count>=1,'streak +1');
A(Object.values(st.missionData)[0].reflection.includes('stuck'),'reflection saved');

// back button works (open mission from home, then back)
click(document.querySelector('.tab[data-value="home"]')); await wait(10);
const todayBtn=document.querySelector('#view-home [data-action="open-mission"]');
if(todayBtn){ click(todayBtn); await wait(10); A(av()==='view-mission','today mission opens from home');
  click(document.querySelector('#backBtn')); await wait(10); A(av()==='view-journeys','chevron back = parent (journeys)'); }

// ---- LinkedIn Studio ----
window.location.hash='#/build/linkedin'; window.dispatchEvent(new window.Event('hashchange')); await wait(25);
A(av()==='view-linkedin','linkedin studio opens');
const setLI=(p,val)=>{ const el=document.querySelector('[data-li="'+p+'"]'); if(!el){errors.push('li field missing: '+p);return;} el.value=val; el.dispatchEvent(new window.Event('input',{bubbles:true})); };
setLI('name','Ada Lovelace'); setLI('headline','Mechanical Engineer becoming an AI and Robotics Engineer with Python and Arduino'); setLI('about','I build embedded and robotics projects and document everything. Seeking an internship to learn fast and ship.'); await wait(25);
A(document.querySelector('#li-preview').textContent.includes('Ada Lovelace'),'linkedin preview reflects name');
A(/[0-9]/.test(document.querySelector('#li-c-headline').textContent),'headline counter shows');
A(/[0-9]/.test(document.querySelector('#li-score').textContent),'linkedin strength renders');
const liH=document.querySelector('[data-li="headline"]'); liH.value=''; liH.dispatchEvent(new window.Event('input',{bubbles:true})); await wait(8); click(document.querySelector('[data-action="li-draft-headline"]')); await wait(15); A(document.querySelector('[data-li="headline"]').value.length>10,'linkedin draft-headline fills the field');
click(document.querySelector('[data-action="li-template"]')); await wait(20);
A(document.querySelector('[data-li="post"]').value.length>0,'post template fills field');
const liCop=copies; click(document.querySelector('[data-action="li-copy"][data-value="headline"]')); await wait(10);
A(copies>=liCop+1,'copy section works');
const liDl=downloads; click(document.querySelector('[data-action="li-export-md"]')); await wait(10);
A(downloads>=liDl+1,'linkedin md export');
click(document.querySelector('[data-action="li-panel"][data-value="preview"]')); await wait(10);
A(document.querySelector('#view-linkedin .studio').dataset.panel==='preview','linkedin panel toggles');
await wait(250); st=JSON.parse(localStorage.getItem('engineeros.v1'));
A(st.builders.linkedin._v===2,'linkedin migrated to v2');
A(st.builders.linkedin.headline.includes('Robotics'),'linkedin headline persisted');

// review
click(document.querySelector('.tab[data-value="review"]')); await wait(8);
document.querySelector('#rv-done').value='Did it'; click(document.querySelector('[data-action="save-review"]')); await wait(20);
st=JSON.parse(localStorage.getItem('engineeros.v1')); A(st.reviews.length>=1,'review saved');

// settings: theme + freenav
click(document.querySelector('[data-action="open-settings"]')); await wait(8);
A(av()==='view-settings','settings opens');
click(document.querySelector('[data-theme-set="dark"]')); await wait(8);
A(document.documentElement.getAttribute('data-theme')==='dark','dark theme');
click(document.querySelector('[data-theme-set="system"]')); await wait(8);
A(!document.documentElement.hasAttribute('data-theme'),'system clears attr');
click(document.querySelector('[data-action="toggle-freenav"]')); await wait(10);
await wait(200); st=JSON.parse(localStorage.getItem('engineeros.v1')); A(st.freeNav===true,'freenav on');

// ---- Feedback + notifications ----
A(document.querySelector('[data-action="toggle-notify"]'),'settings has reminders toggle');
A(document.querySelector('[data-action="send-feedback"]'),'settings has send feedback');
A(document.querySelector('[data-action="suggest-feature"]'),'settings has suggest feature');
A(document.querySelector('#view-settings').textContent.includes('Daily reminder'),'reminders copy present');
let notifs=[];
class FakeNotification{ constructor(t,o){ notifs.push({t,o}); } static permission='granted'; static async requestPermission(){ return 'granted'; } }
globalThis.Notification = window.Notification = FakeNotification;
const fb = await import(pathToFileURL(BASE+'/src/core/feedback.js').href);
const stateMod = await import(pathToFileURL(BASE+'/src/core/state.js').href);
await fb.enableNotifications();
A(stateMod.store.s.flags.notify===true,'notifications opt-in stored');
A(fb.notificationsOn()===true,'notificationsOn true after grant');
fb.notify('Journey complete','You finished it');
A(notifs.length>=1,'system notification fires when enabled');
fb.haptic(10);
// streak banner: broken streak -> welcome back; yesterday -> keep alive
stateMod.store.s.streak.last='2000-01-01';
click(document.querySelector('.tab[data-value="home"]')); await wait(12);
A(/Welcome back/.test(document.querySelector('#view-home').textContent),'broken streak shows welcome-back nudge');
stateMod.store.s.streak.last=stateMod.yesterdayStr();
click(document.querySelector('.tab[data-value="journeys"]')); await wait(8); click(document.querySelector('.tab[data-value="home"]')); await wait(12);
A(/keep it alive/.test(document.querySelector('#view-home').textContent),'at-risk streak shows keep-alive nudge');

// ---- Encrypted sync (UI wiring; crypto+merge covered separately) ----
window.location.hash='#/settings'; window.dispatchEvent(new window.Event('hashchange')); await wait(20);
A(av()==='view-settings','settings open for sync');
A(document.querySelector('#view-settings').textContent.includes('Encrypted sync'),'sync card renders (off state)');
A(document.querySelector('[data-action="sync-enable"]'),'sync-enable control present');
click(document.querySelector('[data-action="sync-enable"]')); await wait(80);
const scfg=JSON.parse(localStorage.getItem('engineeros.sync')||'null');
A(scfg && /^[0-9A-HJKMNP-TV-Z-]+$/.test(scfg.code||''),'enable writes a sync code');
A(scfg && typeof scfg.salt==='string' && scfg.salt.length>0,'enable stores a salt');
A(document.querySelector('#view-settings').textContent.includes('Sync is on'),'settings shows on-state after enable');
const maskedVal=(document.querySelector('#sync-code')||{}).value||'';
click(document.querySelector('[data-action="sync-reveal"]')); await wait(20);
const revealedVal=(document.querySelector('#sync-code')||{}).value||'';
A(maskedVal!==revealedVal && revealedVal===scfg.code,'reveal shows the real code');
click(document.querySelector('[data-action="sync-off"]')); await wait(15);
A(!localStorage.getItem('engineeros.sync'),'turn off clears local sync config');

// ---- In-app helpers ----
A(document.querySelector('#eos-update'),'update bar injected');
A(document.querySelector('#eos-helper'),'helper slot injected');
const helpersMod = await import(pathToFileURL(BASE+'/src/core/helpers.js').href);
const stateH = await import(pathToFileURL(BASE+'/src/core/state.js').href);
stateH.store.s.flags.seenVersion='1.0';           // simulate an existing user on an older version
helpersMod.refreshHelpers();
A(document.querySelector('#eos-helper').textContent.includes('What\u2019s new'),'whats-new card shows for existing user');
A(document.querySelector('#eos-helper [data-action="helper-do"][data-value="whatsnew"]'),'whats-new has a primary action');
click(document.querySelector('#eos-helper [data-action="helper-skip"][data-value="whatsnew"]')); await wait(15);
A(stateH.store.s.flags.seenVersion!=='1.0','dismiss stamps the version as seen');
A(!document.querySelector('#eos-helper').textContent.includes('What\u2019s new'),'whats-new gone after dismiss');

// ---- Career Launchpad ----
window.location.hash='#/launchpad'; window.dispatchEvent(new window.Event('hashchange')); await wait(20);
A(av()==='view-launchpad','launchpad opens');
A(document.querySelector('[data-action="la-add"]'),'launchpad has add-application');
click(document.querySelector('[data-action="la-add"]')); await wait(20);
st=JSON.parse(localStorage.getItem('engineeros.v1'));
A(st.applications.length===1,'application added to tracker');
const compInput=document.querySelector('[data-la-field$=":company"]');
compInput.value='Bosch'; compInput.dispatchEvent(new window.Event('input',{bubbles:true})); await wait(200);
st=JSON.parse(localStorage.getItem('engineeros.v1'));
A(st.applications[0].company==='Bosch','company saved live');
const appId=st.applications[0].id;
click(document.querySelector('[data-action="la-status"][data-value="'+appId+':interview"]')); await wait(15);
st=JSON.parse(localStorage.getItem('engineeros.v1'));
A(st.applications[0].status==='interview','status change persists');
A(document.querySelector('#view-launchpad').textContent.includes('Interviewing'),'app grouped under Interviewing');
click(document.querySelector('[data-action="la-panel"][data-value="interview"]')); await wait(15);
const starField=document.querySelector('[data-la-ans$=":a"]');
A(starField,'STAR action field renders');
starField.value='I wired the sensor and tuned the control loop.'; starField.dispatchEvent(new window.Event('input',{bubbles:true})); await wait(200);
st=JSON.parse(localStorage.getItem('engineeros.v1'));
A(Object.values(st.interview.answers).some(x=>x.a && x.a.includes('sensor')),'STAR answer saved');

// progress
click(document.querySelector('.tab[data-value="home"]')); await wait(6);
click(document.querySelector('[data-action="open-progress"]')); await wait(8);
A(av()==='view-progress','progress opens'); A(document.querySelector('#view-progress .ring'),'ring rendered'); A(/Strongest|getting started|gap/.test(document.querySelector('#view-progress').textContent),'progress insight present');


// ---- Resume Studio ----
window.location.hash='#/build/resume'; window.dispatchEvent(new window.Event('hashchange')); await wait(25);
A(av()==='view-resume','resume studio opens');
const setRS=(p,val)=>{ const el=document.querySelector('[data-rs="'+p+'"]'); if(!el){errors.push('rs field missing: '+p);return;} el.value=val; el.dispatchEvent(new window.Event('input',{bubbles:true})); };
setRS('name','Ada Lovelace'); setRS('email','ada@x.com'); setRS('summary','Mechanical engineer moving into AI and robotics with embedded focus.'); await wait(25);
A(document.querySelector('#rs-paper').textContent.includes('Ada Lovelace'),'paper preview reflects name');
A(/\d/.test(document.querySelector('#rs-score').textContent),'strength score renders');
A(/getting started|Good start|Coming together|Interview-ready/.test(document.querySelector('#rs-score').textContent),'resume score shows encouraging label');
setRS('exp.0.role','Intern'); setRS('exp.0.b.0','Reduced test setup time by 40% by building an Arduino rig'); await wait(25);
A(document.querySelector('#rs-paper').textContent.includes('Reduced test setup time'),'bullet shows in paper');
setRS('targetJD','Seeking a mechanical engineer with SolidWorks, Python and Arduino for robotics.'); await wait(25);
A(/%/.test(document.querySelector('#rs-ats-result').textContent),'ATS match % renders');
const before=document.querySelectorAll('[data-action="rs-del-exp"]').length;
click(document.querySelector('[data-action="rs-add-exp"]')); await wait(20);
A(document.querySelectorAll('[data-action="rs-del-exp"]').length===before+1,'add experience entry works');
const bEl=document.querySelector('[data-rs="exp.0.b.0"]'); bEl.value=''; bEl.dispatchEvent(new window.Event('focusin',{bubbles:true})); bEl.focus();
const vb=document.querySelector('[data-action="rs-verb"]'); if(vb){ click(vb); await wait(15); A(document.querySelector('[data-rs="exp.0.b.0"]').value.length>0,'tapped verb inserts into bullet'); }
const dl0=downloads; click(document.querySelector('[data-action="rs-export-txt"]')); click(document.querySelector('[data-action="rs-export-md"]')); await wait(15);
A(downloads>=dl0+2,'resume txt + md export');
click(document.querySelector('[data-action="rs-print"]')); await wait(10);
click(document.querySelector('[data-action="rs-panel"][data-value="preview"]')); await wait(10);
A(document.querySelector('#view-resume .studio').dataset.panel==='preview','panel toggles to preview');
await wait(250); st=JSON.parse(localStorage.getItem('engineeros.v1'));
A(st.builders.resume._v===2,'resume migrated to v2 schema');
A(st.builders.resume.name==='Ada Lovelace','resume name persisted');


// ---- Resume coach (deterministic agent) ----
A(/Add|Start|number|Education|Skills|action verb/.test(document.querySelector('#rs-score').textContent),'resume coach shows specific guidance');
const sumEl=document.querySelector('[data-rs="summary"]'); sumEl.value=''; sumEl.dispatchEvent(new window.Event('input',{bubbles:true})); await wait(10);
click(document.querySelector('[data-action="rs-draft-summary"]')); await wait(20);
A((document.querySelector('[data-rs="summary"]')||{}).value && document.querySelector('[data-rs="summary"]').value.length>20,'draft-a-starter fills the summary');

// ---- Portfolio Studio ----
window.location.hash='#/build/portfolio'; window.dispatchEvent(new window.Event('hashchange')); await wait(25);
A(av()==='view-portfolio','portfolio studio opens');
const setPF=(p,val)=>{ const el=document.querySelector('[data-pf="'+p+'"]'); if(!el){errors.push('pf field missing: '+p);return;} el.value=val; el.dispatchEvent(new window.Event('input',{bubbles:true})); };
setPF('name','Ada Lovelace'); setPF('about','Mechanical engineer who builds embedded and robotics projects every week.'); await wait(25);
A(document.querySelector('#pf-paper').textContent.includes('Ada Lovelace'),'portfolio paper reflects name');
A(/\d/.test(document.querySelector('#pf-score').textContent),'portfolio strength score renders');
A(/Problem|Result|Add|Skills|Contact|About/.test(document.querySelector('#pf-score').textContent),'portfolio coach shows specific guidance');
click(document.querySelector('[data-action="pf-draft-about"]')); await wait(15); A((document.querySelector('[data-pf="about"]')||{}).value.length>10,'portfolio draft-about fills the field');
setPF('proj.0.title','Line Follower'); setPF('proj.0.problem','Robot drifted off the track.'); setPF('proj.0.approach','Tuned a PID loop on Arduino.'); setPF('proj.0.result','Cut lap errors by 60%.'); await wait(25);
A(document.querySelector('#pf-paper').textContent.includes('Line Follower'),'case study shows in paper');
A(document.querySelector('#pf-paper').textContent.includes('Result:'),'case study Result label renders');
const pfDl=downloads; click(document.querySelector('[data-action="pf-export-html"]')); click(document.querySelector('[data-action="pf-export-md"]')); await wait(15);
A(downloads>=pfDl+2,'portfolio html + md export');
click(document.querySelector('[data-action="pf-print"]')); await wait(10);
click(document.querySelector('[data-action="pf-panel"][data-value="preview"]')); await wait(10);
A(document.querySelector('#view-portfolio .studio').dataset.panel==='preview','portfolio panel toggles to preview');
await wait(250); st=JSON.parse(localStorage.getItem('engineeros.v1'));
A(st.builders.portfolio._v===2,'portfolio migrated to v2 schema');
A(st.builders.portfolio.projects[0].title==='Line Follower','portfolio case study persisted');

// ---- Earn view (money felt) ----
click(document.querySelector('.tab[data-value="home"]')); await wait(12);
const earnCard=document.querySelector('#view-home [data-action="nav"][data-value="earn"]');
A(!!earnCard,'home shows the Earn card');
if(earnCard){ click(earnCard); await wait(15);
  A(av()==='view-earn','earn view opens from home card');
  A(document.querySelectorAll('#view-earn .card.tap').length>=10,'earn lists many opportunities ('+document.querySelectorAll('#view-earn .card.tap').length+')');
  A(document.querySelector('#view-earn').textContent.includes('Never pay'),'earn shows the scam warning');
  A(document.querySelector('#view-earn').textContent.includes('For you'),'earn shows personalized picks'); }
window.location.hash='#/earn'; window.dispatchEvent(new window.Event('hashchange')); await wait(12);
A(av()==='view-earn','deep link #/earn works');

// ---- Resources search + filters ----
click(document.querySelector('.tab[data-value="resources"]')); await wait(14);
A(av()==='view-resources','resources opens');
const allC=document.querySelectorAll('#res-results .res-item').length;
A(allC>=40,'all resources listed ('+allC+')');
click(document.querySelector('[data-action="res-filter"][data-value="ng"]')); await wait(12);
const ngC=document.querySelectorAll('#res-results .res-item').length;
A(ngC>0 && ngC<allC,'Nigeria filter narrows results ('+ngC+')');
A([...document.querySelectorAll('#res-results .res-item')].every(a=>a.textContent.includes('Nigeria')),'filtered items are all Nigeria picks');
click(document.querySelector('[data-action="res-filter"][data-value="all"]')); await wait(8);
const se=document.querySelector('[data-res-search]'); se.value='python'; se.dispatchEvent(new window.Event('input',{bubbles:true})); await wait(12);
const sC=document.querySelectorAll('#res-results .res-item').length;
A(sC>0 && sC<allC,'search narrows results ('+sC+')');
se.value='zzzqqxnope'; se.dispatchEvent(new window.Event('input',{bubbles:true})); await wait(12);
A(document.querySelector('#res-results').textContent.includes('Nothing matches'),'no-match shows friendly empty state');
se.value=''; se.dispatchEvent(new window.Event('input',{bubbles:true})); await wait(8);

// open EVERY mission (freeNav), no render throws
click(document.querySelector('.tab[data-value="journeys"]')); await wait(8);
A(document.querySelectorAll('[data-action="open-journey"]').length===8,'8 journeys');
let total=0;
for(let i=0;i<8;i++){
  click(document.querySelector('[data-action="open-journey"][data-value="'+i+'"]')); await wait(4);
  const ms=[...document.querySelectorAll('#view-journey [data-action="open-mission"]')];
  for(const mm of ms){ click(mm); await wait(2); if(av()!=='view-mission') errors.push('mission render fail j'+i); total++; click(document.querySelector('.tab[data-value="journeys"]')); await wait(2); }
}
console.log('Missions opened:', total);
console.log('Resource links:', document.querySelectorAll('#view-resources .res-item').length || '(render needed)');


// ---- hash routing / deep links / titles ----
window.location.hash='#/mission/j7m3'; window.dispatchEvent(new window.Event('hashchange')); await wait(12);
A(av()==='view-mission','deep link #/mission/j7m3 renders mission');
A(document.querySelector('#view-mission').textContent.includes('Blink'),'deep-linked mission content correct');
A(/Mission/.test(document.title),'document.title updates per view ('+document.title+')');
window.location.hash='#/build/resume'; window.dispatchEvent(new window.Event('hashchange')); await wait(12);
A(av()==='view-resume','deep link #/build/resume renders builder');
window.location.hash='#/resources'; window.dispatchEvent(new window.Event('hashchange')); await wait(12);
A(av()==='view-resources','hash route to resources');
A(window.location.hash==='#/resources','url hash reflects view');

// ---- escape-by-default render layer (html`` tag) ----
// user input must render inert even where a template does not call esc()
window.location.hash='#/build/resume'; window.dispatchEvent(new window.Event('hashchange')); await wait(15);
const XSS='<img src=x onerror="window.__xss=1"><scr'+'ipt>window.__xss=2</scr'+'ipt>';
const nameEl=document.querySelector('[data-rs="name"]');
nameEl.value=XSS; nameEl.dispatchEvent(new window.Event('input',{bubbles:true})); await wait(25);
A(!document.querySelector('#rs-paper img'),'injected <img> does not become an element');
A(!document.querySelector('#rs-paper script'),'injected <script> does not become an element');
A(window.__xss===undefined,'no injected handler ran');
A(document.querySelector('#rs-paper').textContent.includes('<img'),'payload renders as literal text');
nameEl.value='Ada & Bob <QA>'; nameEl.dispatchEvent(new window.Event('input',{bubbles:true})); await wait(25);
A(document.querySelector('#rs-paper').textContent.includes('Ada & Bob <QA>'),'& and <> render once (no double escape)');
A(!document.body.innerHTML.includes('&amp;amp;') && !document.body.innerHTML.includes('&amp;lt;'),'no double-escaped entities anywhere in the DOM');
nameEl.value='Ada Lovelace'; nameEl.dispatchEvent(new window.Event('input',{bubbles:true})); await wait(25);

console.log('\n==== RESULT ====');
if(errors.length){ console.log('❌ '+errors.length+' issue(s):'); [...new Set(errors)].forEach(e=>console.log(' - '+e)); process.exit(1); }
else console.log('✅ ALL MODULAR TESTS PASSED, missions:'+total);
