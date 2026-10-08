const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const code = fs.readFileSync('audio.js', 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
async function until(check) {
  for (let i = 0; i < 300; i++) { if (check()) return; await tick(); }
  throw Error('Timed out waiting for speech state');
}
function cacheStorage() {
  const stores = new Map();
  return {stores, async open(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const map = stores.get(name);
    return {async match(key) { return map.get(key)?.clone(); },
      async put(key, response) { map.set(key, response.clone()); }};
  }};
}
function launch(options = {}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    url: 'https://eric9435.github.io/wortweg-370/', runScripts: 'outside-only'
  });
  const w = dom.window, blobs = new Map(), requests = [], notifications = [], native = [], decoded = [];
  let plays = 0, online = !options.offline, failOnce = options.failOnce;
  const voices = options.voices || [];
  const cache = options.cache || cacheStorage();
  w.Blob = Blob; w.Response = Response; w.caches = cache;
  w.matchMedia = () => ({matches: Boolean(options.installed)});
  w.speechSynthesis = {getVoices: () => voices, cancel() {}, addEventListener() {}, speak(u) {
    native.push(u); options.nativeError ? u.onerror({error: 'language-unavailable'}) : u.onstart();
  }};
  w.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  w.Notification = {permission: 'granted'};
  Object.defineProperty(w.navigator, 'serviceWorker', {value: {getRegistration: async () => ({
    showNotification: async (title, data) => notifications.push({title, data})
  })}});
  if (options.notifications) w.localStorage.setItem('wortweg370-settings-v1', '{"notifications":true}');
  w.fetch = async address => {
    const path = new URL(address).pathname.replace('/wortweg-370/', '');
    requests.push(path);
    if (!online || (failOnce && path.endsWith('de.json'))) { failOnce = false; throw Error('Offline'); }
    return new Response(fs.readFileSync(path));
  };
  w.URL.createObjectURL = blob => { const key = 'blob:wortweg-' + blobs.size; blobs.set(key, blob); return key; };
  w.URL.revokeObjectURL = key => blobs.delete(key);
  w.XMLHttpRequest = class {
    open(method, address) { this.address = address; }
    send() {
      blobs.get(this.address).text().then(text => {
        this.status = 200; this.readyState = 4; this.responseText = text; this.onreadystatechange();
      });
    }
  };
  const append = w.document.head.append.bind(w.document.head);
  w.document.head.append = element => {
    append(element);
    if (element.tagName === 'SCRIPT') blobs.get(element.src).text().then(text => {
      try { w.eval(text); element.onload(); } catch (error) { console.error(error); element.onerror(); }
    });
  };
  w.AudioContext = class {
    constructor() { this.state = 'running'; this.destination = {}; }
    async resume() { this.state = 'running'; }
    async decodeAudioData(bytes) {
      const wav = Buffer.from(bytes);
      assert.equal(wav.subarray(0, 4).toString(), 'RIFF', 'Fallback must generate a real WAV');
      assert.equal(wav.subarray(8, 12).toString(), 'WAVE');
      assert(wav.length > 1000, 'German speech must contain audio samples');
      assert(wav.subarray(44).some(value => value !== 0), 'Speech must not be silent');
      decoded.push(wav);
      return {duration: wav.length / 44100};
    }
    createBufferSource() { return {connect() {}, stop() {}, start() { plays++; }}; }
  };
  const timeout = w.setTimeout.bind(w);
  w.setTimeout = (fn, ms, ...args) => timeout(fn, ms === 1200 ? 20 : ms, ...args);
  w.eval(code);
  return {dom, w, cache, requests, notifications, native, decoded,
    plays: () => plays, setOnline: value => { online = value; }, close: () => w.close()};
}
(async () => {
  const missing = launch();
  await until(() => missing.w.WortWegAudio.getStatus().state === 'ready');
  assert.equal(missing.requests.length, 3, 'Missing German voice triggers one complete download');
  assert.equal(missing.notifications.length, 0, 'Disabled phone notifications must be respected');
  assert.match(missing.w.document.querySelector('.audio-banner-message').textContent, /ready for offline/);
  missing.w.WortWegAudio.speak('das Heimatland');
  await until(() => missing.plays() === 1);
  assert.equal(missing.native.length, 0, 'A missing German voice must never fall back to an English voice');
  const saved = missing.cache;
  missing.close();

  const offline = launch({cache: saved, offline: true});
  await until(() => offline.w.WortWegAudio.getStatus().state === 'ready');
  offline.w.WortWegAudio.speak('die Anschrift');
  await until(() => offline.plays() === 1);
  assert.equal(offline.requests.length, 0, 'A downloaded pack must play after a restart without network access');
  offline.close();

  const broken = launch({failOnce: true});
  await assert.rejects(broken.w.WortWegAudio.download());
  assert.equal(broken.w.WortWegAudio.getStatus().state, 'error', 'A partial download must not claim completion');
  assert.equal(broken.w.document.querySelector('.audio-banner-retry').hidden, false);
  await broken.w.WortWegAudio.download();
  assert.equal(broken.w.WortWegAudio.getStatus().state, 'ready');
  assert.equal(broken.requests.filter(path => path.endsWith('mespeak.js')).length, 1, 'Retry reuses complete saved files');
  assert.equal(broken.requests.filter(path => path.endsWith('de.json')).length, 2);
  broken.close();

  const phone = launch({voices: [{lang: 'en-US', localService: true}, {lang: 'de-DE', localService: true}]});
  phone.w.WortWegAudio.speak('Guten Morgen');
  assert.equal(phone.native[0].voice.lang, 'de-DE', 'An existing German phone voice stays preferred');
  await tick();
  assert.equal(phone.requests.length, 0, 'An uninstalled app with a German voice does not force a download');
  phone.w.localStorage.setItem('wortweg370-settings-v1', '{"notifications":true}');
  phone.w.dispatchEvent(new phone.w.Event('appinstalled'));
  await until(() => phone.w.WortWegAudio.getStatus().state === 'ready');
  await until(() => phone.notifications.length === 1);
  assert.equal(phone.notifications[0].data.tag, 'wortweg-audio');
  phone.close();

  const failedVoice = launch({voices: [{lang: 'de-DE', localService: true}], nativeError: true});
  failedVoice.w.WortWegAudio.speak('Willkommen');
  await until(() => failedVoice.plays() === 1);
  assert.equal(failedVoice.native.length, 1, 'A failed native German voice falls back to local synthesis');
  failedVoice.close();

  const installed = launch({installed: true, voices: [{lang: 'de-DE', localService: true}]});
  await until(() => installed.w.WortWegAudio.getStatus().state === 'ready');
  assert.equal(installed.requests.length, 3, 'The first installed launch downloads an offline speech pack');
  installed.close();

  const handlers = {}, deleted = [];
  vm.runInNewContext(fs.readFileSync('sw.js', 'utf8'), {
    self: {addEventListener: (name, fn) => { handlers[name] = fn; }, clients: {claim: async () => {}}},
    caches: {keys: async () => ['wortweg370-v12', 'wortweg370-v13', 'wortweg370-v14', 'wortweg370-v15', 'wortweg370-v16', 'wortweg370-voice-v1', 'other-app'],
      delete: async key => { deleted.push(key); }}
  });
  let activation;
  handlers.activate({waitUntil: promise => { activation = promise; }});
  await activation;
  assert.deepEqual(deleted, ['wortweg370-v12', 'wortweg370-v13', 'wortweg370-v14', 'wortweg370-v15'], 'App updates purge old app caches, but retain the current app, downloaded speech and unrelated caches');
  console.log('PASS: automatic download, real German WAV synthesis, offline restart, retry, native fallback, notifications, and update persistence');
})().catch(error => { console.error(error); process.exit(1); });
