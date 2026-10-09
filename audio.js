/* WortWeg's device-local German speech pack. Native German voices remain preferred. */
(() => {
  'use strict';
  const CACHE = 'wortweg370-voice-v1';
  const ASSETS = [
    {path: './vendor/mespeak/mespeak.js', bytes: 2464329, type: 'text/javascript'},
    {path: './vendor/mespeak/mespeak_config.json', bytes: 570487, type: 'application/json'},
    {path: './vendor/mespeak/de.json', bytes: 27996, type: 'application/json'}
  ];
  const TOTAL = ASSETS.reduce((sum, item) => sum + item.bytes, 0);
  const url = path => new URL(path, document.baseURI).href;
  let state = {state: 'checking', message: 'Checking German speech…', progress: 0};
  let downloadPromise, enginePromise, context, source, speechId = 0, bannerTimer;
  let automaticDownload = false;
  // Speech volume follows the existing device-local settings without changing
  // its key or coupling German audio to authentication or the network.
  function voiceVolume() {
    try {
      const settings = JSON.parse(localStorage.getItem('wortweg370-settings-v1') || '{}');
      const raw = Number(settings.voiceVolume);
      return Number.isFinite(raw) && settings.voiceVolume !== undefined && settings.voiceVolume !== null
        ? Math.max(0, Math.min(100, raw)) / 100 : .5;
    } catch { return .5; }
  }

  function germanVoice() {
    try {
      return window.speechSynthesis?.getVoices()
        .filter(v => /^de(?:[-_]|$)/i.test(v.lang))
        .sort((a, b) => Number(b.localService) - Number(a.localService) ||
          Number(/^de[-_]de$/i.test(b.lang)) - Number(/^de[-_]de$/i.test(a.lang)))[0];
    } catch { return undefined; }
  }
  function getStatus() { return {...state, nativeAvailable: Boolean(germanVoice())}; }
  function setState(next) {
    state = {...state, ...next};
    window.dispatchEvent(new CustomEvent('wortweg:audio-status', {detail: getStatus()}));
    updateBanner();
  }
  const banner = document.createElement('aside');
  banner.className = 'audio-download-banner';
  banner.id = 'audio-download-banner';
  banner.hidden = true;
  banner.innerHTML = '<div class="audio-banner-heading"><span>German pronunciation</span><button class="audio-banner-close" type="button" aria-label="Dismiss speech download message">×</button></div><p class="audio-banner-message" role="status" aria-live="polite"></p><progress max="100" value="0" aria-label="German speech download progress" hidden></progress><button type="button" class="btn small audio-banner-retry" hidden>Retry download</button>';
  document.body.append(banner);
  banner.querySelector('.audio-banner-close').onclick = () => { banner.hidden = true; };
  banner.querySelector('.audio-banner-retry').onclick = () => download({show: true}).catch(() => {});
  function updateBanner() {
    banner.querySelector('.audio-banner-message').textContent = state.message;
    const bar = banner.querySelector('progress');
    bar.value = state.progress;
    bar.hidden = state.state !== 'downloading';
    banner.querySelector('.audio-banner-retry').hidden = state.state !== 'error';
  }
  function showBanner() {
    clearTimeout(bannerTimer);
    banner.hidden = false;
    if (state.state === 'ready') bannerTimer = setTimeout(() => { banner.hidden = true; }, 8000);
  }
  async function cachedAsset(cache, asset) {
    const response = await cache.match(url(asset.path));
    if (!response || !response.ok) return null;
    const blob = await response.blob();
    return blob.size === asset.bytes ? blob : null;
  }
  async function packPresent() {
    if (!('caches' in window)) return false;
    try {
      const cache = await caches.open(CACHE);
      for (const asset of ASSETS) if (!await cachedAsset(cache, asset)) return false;
      return true;
    } catch { return false; }
  }
  async function completedNotification() {
    try {
      const settings = JSON.parse(localStorage.getItem('wortweg370-settings-v1') || '{}');
      if (!settings.notifications || !('Notification' in window) || Notification.permission !== 'granted') return;
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration) await registration.showNotification('German speech download complete', {
        body: 'German pronunciation is ready for offline use in WortWeg 370.',
        icon: './icon.svg?v=11', tag: 'wortweg-audio', data: {page: 'settings'}
      });
    } catch { /* The in-app completion message is always available. */ }
  }
  async function download(options = {}) {
    if (downloadPromise) { if (options.show) showBanner(); return downloadPromise; }
    downloadPromise = (async () => {
      if (!('caches' in window)) throw new Error('Offline speech storage is unavailable in this browser.');
      const cache = await caches.open(CACHE);
      let saved = 0, fetched = false;
      const existing = new Map();
      for (const asset of ASSETS) {
        const blob = await cachedAsset(cache, asset);
        if (blob) { saved += blob.size; existing.set(asset.path, true); }
      }
      if (saved === TOTAL) {
        setState({state: 'ready', message: 'German speech ready for offline use.', progress: 100});
        if (options.show) showBanner();
        return true;
      }
      setState({state: 'downloading', message: 'Downloading German speech… ' + Math.floor(saved / TOTAL * 100) + '%', progress: Math.floor(saved / TOTAL * 100)});
      showBanner();
      for (const asset of ASSETS) {
        if (existing.has(asset.path)) continue;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 90000);
        let blob;
        try {
          const response = await fetch(url(asset.path), {signal: controller.signal});
          if (!response.ok) throw new Error('Speech file unavailable.');
          if (response.body?.getReader) {
            const reader = response.body.getReader(), chunks = [];
            let received = 0;
            while (true) {
              const {done, value} = await reader.read();
              if (done) break;
              chunks.push(value);
              received += value.byteLength;
              const progress = Math.min(99, Math.floor((saved + received) / TOTAL * 100));
              setState({state: 'downloading', message: 'Downloading German speech… ' + progress + '%', progress});
            }
            blob = new Blob(chunks, {type: asset.type});
          } else blob = await response.blob();
          if (blob.size !== asset.bytes) throw new Error('Speech download incomplete.');
          await cache.put(url(asset.path), new Response(blob, {headers: {'Content-Type': asset.type}}));
          fetched = true;
          saved += blob.size;
        } finally { clearTimeout(timeout); }
      }
      if (!await packPresent()) throw new Error('Speech pack could not be saved.');
      setState({state: 'ready', message: 'German speech ready for offline use.', progress: 100});
      showBanner();
      if (fetched) completedNotification();
      return true;
    })().catch(error => {
      const message = !('caches' in window) ? error.message :
        error.name === 'QuotaExceededError' ? 'Not enough storage for German speech. Free some space, then retry.' :
        'German speech download paused. Check your connection and tap Retry.';
      setState({state: 'error', message});
      showBanner();
      throw error;
    }).finally(() => { downloadPromise = undefined; });
    return downloadPromise;
  }
  async function engine() {
    if (enginePromise) return enginePromise;
    enginePromise = (async () => {
      await download();
      const cache = await caches.open(CACHE);
      const blobs = [];
      for (const asset of ASSETS) {
        const blob = await cachedAsset(cache, asset);
        if (!blob) throw new Error('German speech needs to be downloaded again.');
        blobs.push(blob);
      }
      if (!window.meSpeak) {
        const scriptUrl = URL.createObjectURL(blobs[0]);
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const timer = setTimeout(() => { script.remove(); reject(new Error('Speech engine could not start.')); }, 20000);
            script.onload = () => { clearTimeout(timer); script.remove(); resolve(); };
            script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Speech engine could not load.')); };
            script.src = scriptUrl;
            document.head.append(script);
          });
        } finally { URL.revokeObjectURL(scriptUrl); }
      }
      const configUrl = URL.createObjectURL(blobs[1]), voiceUrl = URL.createObjectURL(blobs[2]);
      try {
        window.meSpeak.loadConfig(configUrl);
        await new Promise((resolve, reject) => {
          const start = Date.now();
          function check() {
            if (window.meSpeak.isConfigLoaded()) resolve();
            else if (Date.now() - start > 10000) reject(new Error('Speech configuration could not load.'));
            else setTimeout(check, 50);
          }
          check();
        });
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('German speech could not load.')), 10000);
          window.meSpeak.loadVoice(voiceUrl, ok => { clearTimeout(timer); ok ? resolve() : reject(new Error('German speech could not load.')); });
        });
        if (!window.meSpeak.isVoiceLoaded('de')) throw new Error('German voice unavailable.');
      } finally { URL.revokeObjectURL(configUrl); URL.revokeObjectURL(voiceUrl); }
      return window.meSpeak;
    })().catch(error => { enginePromise = undefined; throw error; });
    return enginePromise;
  }
  function unlockAudio() {
    const Constructor = window.AudioContext || window.webkitAudioContext;
    if (!Constructor) return;
    if (!context || context.state === 'closed') context = new Constructor();
    if (context.state === 'suspended') context.resume().catch(() => {});
  }
  async function offlineSpeak(text, id) {
    try {
      if (!context) throw new Error('Audio playback is unavailable in this browser.');
      const synthesizer = await engine();
      if (id !== speechId) return;
      const wav = synthesizer.speak(text, {voice: 'de', speed: 145, rawdata: 'array'});
      if (!wav?.length) throw new Error('German pronunciation could not be generated.');
      const buffer = await context.decodeAudioData(new Uint8Array(wav).buffer);
      if (id !== speechId) return;
      if (context.state === 'suspended') await context.resume();
      if (context.state !== 'running') throw new Error('Tap the speaker again to enable audio.');
      source = context.createBufferSource();
      source.buffer = buffer;
      const voiceGain = context.createGain?.();
      if (voiceGain) {
        voiceGain.gain.setValueAtTime(voiceVolume(), context.currentTime);
        source.connect(voiceGain);
        voiceGain.connect(context.destination);
      } else source.connect(context.destination);
      source.start();
    } catch (error) {
      if (id !== speechId) return;
      if (state.state !== 'error') setState({...state, message: error.message});
      showBanner();
    }
  }
  function speak(text) {
    text = String(text || '').trim();
    if (!text) return;
    const id = ++speechId;
    try { source?.stop(); } catch {}
    source = undefined;
    try { unlockAudio(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
    const voice = germanVoice();
    if (voice && 'SpeechSynthesisUtterance' in window) {
      let timer, switched = false;
      const fallback = () => {
        clearTimeout(timer);
        if (id !== speechId || switched) return;
        switched = true;
        try { window.speechSynthesis.cancel(); } catch {}
        offlineSpeak(text, id);
      };
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.lang = voice.lang;
        utterance.rate = .78;
        utterance.pitch = 1;
        utterance.volume = voiceVolume();
        utterance.onstart = utterance.onend = () => clearTimeout(timer);
        utterance.onerror = event => {
          if (!['canceled', 'interrupted'].includes(event.error)) fallback();
        };
        timer = setTimeout(fallback, 2500);
        window.speechSynthesis.speak(utterance);
        return;
      } catch { fallback(); return; }
    }
    offlineSpeak(text, id);
  }
  function installed() {
    return Boolean(navigator.standalone || window.matchMedia?.('(display-mode: standalone)').matches);
  }
  async function automatic() {
    if (automaticDownload) return;
    if (installed() || !germanVoice()) {
      automaticDownload = true;
      try { await download(); } catch {}
    }
  }
  window.WortWegAudio = {speak, download: () => download({show: true}), getStatus,
    test: () => speak('Guten Tag. Willkommen bei WortWeg.'), hasGermanVoice: () => Boolean(germanVoice())};
  window.addEventListener('appinstalled', () => download({show: true}).catch(() => {}));
  window.addEventListener('online', () => {
    if (state.state === 'error' && (installed() || !germanVoice())) download().catch(() => {});
  });
  window.speechSynthesis?.addEventListener?.('voiceschanged', () => {
    if (!['ready', 'downloading', 'error'].includes(state.state)) {
      setState({state: germanVoice() ? 'native' : 'missing', message: germanVoice() ?
        'German phone voice available. You can also download offline speech for this app.' : 'German speech will download for this app.'});
    } else setState({});
  });
  (async () => {
    if (await packPresent()) setState({state: 'ready', message: 'German speech ready for offline use.', progress: 100});
    else {
      setState({state: germanVoice() ? 'native' : 'missing', message: germanVoice() ?
        'German phone voice available. You can also download offline speech for this app.' : 'German speech will download for this app.'});
      setTimeout(automatic, 1200);
    }
  })();
})();
