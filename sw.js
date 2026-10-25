const CACHE='wortweg370-v56';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg?v=11','./cloud.js?v=14','./account.css?v=14','./settings.js','./settings.css','./audio.js','./audio.css','./enterprise.css','./enterprise.js','./settings-navigation.js','./settings-navigation.css','./ios-polish.js','./ios-polish.css','./whiteboard.js','./whiteboard.css','./page-navigation.js','./page-navigation.css','./home-premium.css','./home-refresh.js','./home-refresh.css','./special-vocabulary.js','./special-vocabulary.css','./seen-words.js','./seen-words.css','./vocab-writing.js','./vocab-writing.css','./flashcards.js','./flashcards.css','./bank-browser.js','./bank-browser.css','./grammar.js','./grammar-deep.js','./grammar-expanded.js','./grammar-more-a1-a2.js','./grammar-more-b1.js','./grammar-more-b2.js','./grammar-more-c1.js','./grammar.css','./lifetime-grammar.html','./lifetime-grammar.css','./lifetime-grammar.js','./lifetime-grammar-index-1.js','./lifetime-grammar-index-2.js','./lifetime-grammar-examples.js','./lifetime-grammar-rules-1.js','./lifetime-grammar-rules-2.js','./lifetime-grammar-exact-1.js','./lifetime-grammar-exact-2.js','./lifetime-grammar-exact-3.js','./lifetime-grammar-exact-4.js','./lifetime-grammar-verified-matrices.js','./topic-reading-seeds-1.js','./topic-reading-seeds-2.js','./topic-reading-seeds-3.js','./topic-reading-seeds-4.js','./topic-reading-engine.js','./reading-studio-topics-01-12.js','./reading-studio-topics-13-24.js','./reading-sentence-my-01-06.js','./reading-sentence-my-07-12.js','./reading-sentence-my-13-18.js','./reading-sentence-my-19-24.js','./reading-sentence-en-fixes.js','./reading-studio.js','./reading-word-explorer.js','./topic-lessons.js','./topic-lessons.css','./learning-checklist.js','./live-content.js','./live-content.css','./content/v1/pack.json'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  // App updates must keep the separately downloaded speech pack.
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>
    key.startsWith('wortweg370-')&&!key.startsWith('wortweg370-voice-')&&key!==CACHE
  ).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  // New lesson packs must be network-first: a precached JSON file cannot
  // shadow newer versions after the website publishes fresh vocabulary.
  const livePackUrl=new URL('./content/v1/pack.json',self.registration.scope).href;
  if(event.request.url===livePackUrl){
    event.respondWith(fetch(event.request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      }
      return response;
    }).catch(()=>caches.match(event.request)));
    return;
  }
  if(event.request.mode==='navigate'){
    const path=new URL(event.request.url).pathname;
    const lifetimePath=new URL('./lifetime-grammar.html',self.registration.scope).pathname;
    const fallback=path===lifetimePath?'./lifetime-grammar.html':'./index.html';
    event.respondWith(fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(fallback,copy)).catch(()=>{});}
      return response;
    }).catch(()=>caches.match(fallback)));
    return;
  }
  // Network-first app UI updates: the old cache-first policy could keep
  // settings.js permanently stale, preventing new Home/menu features from loading
  // even when Pages had deployed them. Offline users still get the cached copy.
  const root=self.registration.scope;
  const freshUI=['lifetime-grammar.css','lifetime-grammar.js','lifetime-grammar-index-1.js','lifetime-grammar-index-2.js','lifetime-grammar-examples.js','lifetime-grammar-rules-1.js','lifetime-grammar-rules-2.js','lifetime-grammar-exact-1.js','lifetime-grammar-exact-2.js','lifetime-grammar-exact-3.js','lifetime-grammar-exact-4.js','lifetime-grammar-verified-matrices.js','audio.js','settings.js','settings.css','settings-navigation.js','settings-navigation.css',
    'ios-polish.js','ios-polish.css','whiteboard.js','whiteboard.css','page-navigation.js','page-navigation.css','home-premium.css','home-refresh.js','home-refresh.css','special-vocabulary.js','special-vocabulary.css','seen-words.js','seen-words.css','vocab-writing.js','vocab-writing.css','flashcards.js','flashcards.css','bank-browser.js','bank-browser.css','grammar.js','grammar-deep.js','grammar-expanded.js','grammar.css','topic-reading-seeds-1.js','topic-reading-seeds-2.js','topic-reading-seeds-3.js','topic-reading-seeds-4.js','topic-reading-engine.js','reading-studio-topics-01-12.js','reading-studio-topics-13-24.js','reading-sentence-my-01-06.js','reading-sentence-my-07-12.js','reading-sentence-my-13-18.js','reading-sentence-my-19-24.js','reading-sentence-en-fixes.js','reading-studio.js','reading-word-explorer.js','topic-lessons.js','topic-lessons.css','learning-checklist.js',
    'live-content.js','live-content.css','enterprise.js','enterprise.css'];
  const requested=new URL(event.request.url);
  if(requested.href.startsWith(root)&&freshUI.includes(requested.pathname.slice(new URL(root).pathname.length))){
    event.respondWith(fetch(event.request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      }
      return response;
    }).catch(()=>caches.match(event.request,{ignoreSearch:true})));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
self.addEventListener('notificationclick',event=>{
  if(event.notification.tag!=='wortweg-audio')return;
  event.notification.close();
  const target=new URL('./index.html#settings',self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
    const client=clients.find(item=>item.url.startsWith(self.registration.scope));
    if(client){await client.navigate(target);return client.focus();}
    return self.clients.openWindow(target);
  }));
});
