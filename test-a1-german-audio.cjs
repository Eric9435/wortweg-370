'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('a1-complete-reader.html','utf8');
const extract=html.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/);
assert.ok(extract,'Standalone A1 reader script must exist');
new vm.Script(extract[1],{filename:'a1-complete-reader.html'});
const chapterMatch=extract[1].match(/const chapters=(\[[\s\S]*?\]);\s*const \$=id/);
assert.ok(chapterMatch,'Author-controlled German source chapters exist');
const chapters=JSON.parse(chapterMatch[1]);
assert.equal(chapters.length,12);
const dom=new JSDOM(html,{url:'https://example.test/a1-complete-reader.html',runScripts:'outside-only'});
const w=dom.window;
const calls=[],counts={cancel:0,pause:0,resume:0};
const germanVoice={lang:'de-DE',name:'German voice',localService:true};
const englishVoice={lang:'en-US',name:'English voice',localService:true};
const synth={
 getVoices:()=>[englishVoice,germanVoice],
 speak(utterance){calls.push(utterance);},
 cancel(){counts.cancel++;},
 pause(){counts.pause++;},
 resume(){counts.resume++;}
};
Object.defineProperty(w,'speechSynthesis',{configurable:true,value:synth});
w.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
// The separate full-word inventory is tested by test-a1-complete-reader.cjs.
// This speech-only test keeps its asynchronous fetch pending until DOM cleanup.
w.fetch=()=>new Promise(()=>{});
w.eval(extract[1]);
const all=selector=>[...w.document.querySelectorAll(selector)];
const play=all('.speech-play');
const stop=all('.speech-stop');
const rates=all('.speech-rate');
assert.equal(play.length,12,'One German speech play/pause control per chapter');
assert.equal(stop.length,12,'One German stop button per chapter');
assert.equal(rates.length,12,'One adjustable reading speed per chapter');
assert.equal(calls.length,0,'Never autoplay speech');
assert.equal(play[0].disabled,false);
assert.equal(stop[0].disabled,true);
assert.equal(w.document.querySelectorAll('#storyContent .german-col[lang="de"] p.german').length,12);
assert.equal(w.document.querySelectorAll('#storyContent .english-col[lang="en"] p.english').length,12);
play[0].click();
assert.equal(calls.length,1,'The first click starts German narration');
assert.equal(calls[0].lang,'de-DE','Always use German audio locale');
assert.equal(calls[0].voice,germanVoice,'Select German voice instead of English default');
assert.match(calls[0].text,/Mein Name ist Min/,'Read the original German, not the English translation');
assert.ok(!calls[0].text.startsWith('My name is Min'),'Do not read English');
assert.equal(calls[0].rate,.85,'Learning-friendly default speed');
assert.equal(stop[0].disabled,false,'Stop becomes available during playback');
assert.equal(stop[1].disabled,true,'Other chapters have no active stop button');
calls[0].onstart();
assert.match(play[0].textContent,/Pause/,'Pause control when audio starts');
play[0].click();
assert.equal(counts.pause,1);
assert.match(play[0].textContent,/Resume/);
play[0].click();
assert.equal(counts.resume,1);
rates[0].value='1.2';
const firstChunks=[];
for(let i=0;i<40&&calls.length;i++){
 const last=calls[calls.length-1];
 if(firstChunks.includes(last))break;
 firstChunks.push(last);
 last.onend();
 if(stop[0].disabled)break;
}
assert.ok(firstChunks.length>=2,'Long German passages must be chunked for reliable mobile speech');
assert.ok(firstChunks.some(c=>c.rate===1.2),'Reading speed change takes effect at next sentence chunk');
assert.ok(firstChunks.map(c=>c.text).join(' ').includes('Ich lerne gern Deutsch.'),
 'The audio reads the final sentence, not only the beginning');
assert.equal(stop[0].disabled,true,'Narration finishes and clears active controls');
const previousCount=calls.length;
play[0].click();
const old=calls[calls.length-1];
play[1].click();
assert.equal(calls.length,previousCount+2,'Playing a new chapter stops the first and starts the next');
assert.ok(counts.cancel>=2,'Old speech is cancelled when switching passages');
assert.match(calls[calls.length-1].text,/Am Montag stehe ich/,'Second chapter reads second German source');
const newCount=calls.length;
old.onend();
assert.equal(calls.length,newCount,'Late end from cancelled chapter cannot advance stale audio');
stop[1].click();
assert.equal(stop[1].disabled,true,'Stop cancels current narration');
play[2].click();
assert.equal(stop[2].disabled,false);
const tab=all('button.tab').find(x=>x.dataset.panel==='all');
tab.click();
assert.equal(stop[2].disabled,true,'Leaving reader stops speaking');
assert.equal(w.document.querySelectorAll('#storyContent .english-col').length,12,
 'English translations survive all speech controls');
assert.equal(w.document.querySelectorAll('#storyContent .german-col').length,12,
 'German paragraphs survive all speech controls');
assert.match(fs.readFileSync('sw.js','utf8'),/wortweg370-v82/,'Audio version is offline cached');
assert.match(fs.readFileSync('sw.js','utf8'),/a1-complete-reader\.html/);
dom.window.close();
const noVoice=new JSDOM(html,{url:'https://example.test/a1-complete-reader.html',runScripts:'outside-only'});
// The unsupported-speech test does not need the separate asynchronous vocabulary fetch.
// Keep its response pending so jsdom is not closed during an init() rejection.
noVoice.window.fetch=()=>new Promise(()=>{});
noVoice.window.eval(extract[1]);
assert.equal(noVoice.window.document.querySelectorAll('.speech-play').length,12);
assert.ok([...noVoice.window.document.querySelectorAll('.speech-play')].every(b=>b.disabled),
 'Without Web Speech API, narration buttons are visibly disabled');
assert.match(noVoice.window.document.querySelector('.speech-status').textContent,/not supported/,
 'Explain unsupported browser speech, do not pretend playback works');
noVoice.window.close();
console.log('A1_GERMAN_AUDIO='+JSON.stringify({chapters:chapters.length,firstChapterChunks:firstChunks.length,locale:calls[0].lang}));
console.log('PASS: 12 German read-aloud controls, one active chapter, pause/resume/stop, full passage, German-only audio, speed, no autoplay and unsupported browsers.');
