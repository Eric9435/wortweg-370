// Release gate: unified navigation, accessibility and offline packaging of the premium UI.
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=name=>fs.readFileSync(name,'utf8');
const html=read('index.html'),nav=read('page-navigation.js'),css=read('premium-ui.css');
const sw=read('sw.js'),native=read('mobile/scripts/prepare.mjs'),settings=read('settings.js');
assert(html.includes('href="./premium-ui.css?v=1"'),'Website installs premium UI');
assert(sw.includes("'./premium-ui.css'"),'Offline PWA caches premium UI');
assert(native.includes("'premium-ui.css'"),'Offline Android/iOS package includes premium UI');
assert(!html.includes('id="ww-enterprise-router"'),'Obsolete second router removed');
assert(!html.includes('id="backToSetup"'),'Quiz contains no duplicate Back button');
assert(!settings.includes("view.prepend(back)"),'Main-menu script does not inject competing Back controls');
assert(nav.includes("if(source==='main')"),'Main screens use one canonical navbar');
assert(nav.includes("else bar.append(back,label,close)"),'Overlays retain explicit Close controls');
assert(nav.includes("if(active?.id==='quiz'){navigate('study');return;}"),'Quiz Back returns to setup');
assert(nav.includes("tools.addEventListener('click',openAnnotation)"),'Pen tool remains available from header');
assert(html.includes('aria-valuenow'),'Quiz progress is exposed to screen readers');
assert(html.includes("setAttribute('aria-pressed','true')"),'Selected choice is accessible');
for(const key of ['#quiz #answerButtons .choice','#quiz #submitAnswer','prefers-reduced-motion','data-mode="dark"','@media(max-width:600px)',':focus-visible']){
 assert(css.includes(key),'Premium UI supports '+key);
}
const mainNav=html.match(/<section id="quiz"[\s\S]*?<section id="topics"/)?.[0]||'';
assert(mainNav.includes('id="quizCard"'),'Quiz is its own page');
assert(!mainNav.includes('id="startQuiz"'),'Quiz screen does not repeat settings');
console.log('PASS: premium UI routing, responsive layout, accessible quiz and offline-native/PWA packaging');
