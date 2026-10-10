const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');

const html='<!doctype html><html><head></head><body class="ww-game-interface"><main>'
 +'<section id="dashboard" class="section active"><div class="ww-main-menu"></div></section>'
 +'<section id="stats" class="section"><button class="ww-menu-back">Main menu</button><h2>Your learning progress</h2><div id="summary"><div class="smalltitle">Recent sessions</div></div></section>'
 +'<section id="review" class="section"><h2>Wrong Answer Review</h2><button id="reviewNow">Review due</button><button id="reviewAll">Practice all mistakes</button><p>No mistakes yet. Start a quiz to build your review list.</p></section>'
 +'</main></body></html>';
const dom=new JSDOM(html,{url:'https://example.org/',runScripts:'outside-only'});
const w=dom.window;
let progress={answered:0,correct:0,history:[]};
w.WortWeg={getProgress:()=>progress};
const js=fs.readFileSync('ios-polish.js','utf8');
new (require('node:vm').Script)(js,{filename:'ios-polish.js'});
w.eval(js);
const $=id=>w.document.getElementById(id);
assert.ok($('ww-ios-progress-overview'),'Progress summary is generated from the existing progress API');
assert.equal($('ww-ios-ring-value').textContent,'—','Unanswered quizzes show no misleading accuracy');
assert.ok($('ww-ios-empty-sessions'),'History has a useful empty state');
assert.equal($('reviewNow').disabled,true,'Empty review cannot launch a nonexistent quiz');
assert.equal($('reviewAll').disabled,true,'All-mistakes action is unavailable when no mistakes exist');
progress={answered:12,correct:9,history:[{date:'2026-10-08',score:9}]};
w.dispatchEvent(new w.Event('wortweg:changed'));
assert.equal($('ww-ios-ring-value').textContent,'75%','Accuracy uses current account history');
assert.equal($('ww-ios-empty-sessions'),null,'Empty state disappears with recent sessions');
w.document.querySelector('#review p').textContent='Your mistake list is ready.';
Promise.resolve().then(()=>{
 assert.equal($('reviewNow').disabled,false,'Review action is restored when list is no longer empty');
 assert.equal($('reviewAll').disabled,false,'All mistakes action is restored after new mistakes');
 const css=fs.readFileSync('ios-polish.css','utf8');
 const settings=fs.readFileSync('settings.js','utf8');
 const packaging=fs.readFileSync('mobile/scripts/prepare.mjs','utf8');
 assert.ok(css.includes('prefers-reduced-motion'),'Reduced-motion accessibility remains supported');
 assert.ok(css.includes('data-mode=dark'),'Dark mode has visual overrides');
 assert.ok(settings.includes('ios-polish.js')&&settings.includes('ios-polish.css'),'Web loads the enhancements');
 assert.ok(packaging.includes('ios-polish.js')&&packaging.includes('ios-polish.css'),'Android bundles both files offline');
 dom.window.close();
 console.log('PASS: iOS polish, accuracy, empty states, review controls, dark mode and offline packaging.');
}).catch(e=>{dom.window.close();console.error(e);process.exitCode=1});