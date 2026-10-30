const CACHE='wortweg370-v87';
const ASSETS=['./','./index.html','./a1-complete-reader.html','./complete-reading.html','./a2-complete-reader.html','./a2-reading-chapters.js','./b1-complete-reader.html','./b1-reading-chapters.js','./b2-complete-reader.html','./b2-reading-chapters.js','./b2-reading-part-02.js','./b2-reading-part-03.js','./b2-reading-part-04.js','./b2-reading-part-05.js','./b2-reading-part-06.js','./b2-reading-part-07.js','./b2-reading-part-08.js','./b2-reading-part-09.js','./b2-reading-part-10.js','./complete-reading-level.html','./dialog.html','./dialog.css','./dialog-situations.js','./dialog-situations-a2.js','./dialog-situations-b1.js','./dialog-situations-b2.js','./dialog.js','./manifest.webmanifest','./icon.svg?v=11','./cloud.js?v=15','./extra-progress-sync.js','./account.css?v=14','./settings.js','./settings.css','./audio.js','./audio.css','./enterprise.css','./enterprise.js','./settings-navigation.js','./settings-navigation.css','./ios-polish.js','./ios-polish.css','./whiteboard.js','./whiteboard.css','./page-navigation.js','./page-navigation.css','./premium-ui.css','./home-premium.css','./home-refresh.js','./home-refresh.css','./vocabulary-atlas.js','./vocabulary-atlas.css','./assets/WortWeg_Complete_11312_German_English_ONE_IMAGE.svg','./special-vocabulary.js','./special-vocabulary.css','./seen-words.js','./seen-words.css','./vocab-writing.js','./vocab-writing.css','./flashcards.js','./flashcards.css','./noun-expansion.js','./articles-quiz.js','./articles-quiz.css','./bank-browser.js','./bank-browser.css','./grammar.js','./grammar-deep.js','./grammar-expanded.js','./grammar-more-a1-a2.js','./grammar-more-b1.js','./grammar-more-b2.js','./grammar-more-c1.js','./grammar.css','./lifetime-grammar.html','./grammar-120.html','./assets/german-grammar-a1-c1-120.svg','./lifetime-grammar.css','./lifetime-grammar.js','./lifetime-grammar-index-1.js','./lifetime-grammar-index-2.js','./lifetime-grammar-examples.js','./lifetime-grammar-rules-1.js','./lifetime-grammar-rules-2.js','./lifetime-grammar-exact-1.js','./lifetime-grammar-exact-2.js','./lifetime-grammar-exact-3.js','./lifetime-grammar-exact-4.js','./lifetime-grammar-verified-matrices.js','./lifetime-grammar-myanmar-1.js','./lifetime-grammar-myanmar-2.js','./lifetime-memorize-1.js','./lifetime-memorize-2.js','./lifetime-memorize.js','./topic-reading-seeds-1.js','./topic-reading-seeds-2.js','./topic-reading-seeds-3.js','./topic-reading-seeds-4.js','./topic-reading-engine.js','./reading-studio-topics-01-12.js','./reading-studio-topics-13-24.js','./reading-sentence-my-01-06.js','./reading-sentence-my-07-12.js','./reading-sentence-my-13-18.js','./reading-sentence-my-19-24.js','./reading-sentence-en-fixes.js','./reading-studio.js','./reading-word-explorer.js','./topic-lessons.js','./topic-lessons.css','./learning-checklist.js','./live-content.js','./live-content.css','./content/v1/pack.json'];
// Large reference images are fetched and cached on first use instead of consuming
// iPhone storage during every app installation.
const LARGE_OPTIONAL_ASSETS=new Set(['./assets/WortWeg_Complete_11312_German_English_ONE_IMAGE.svg','./assets/german-grammar-a1-c1-120.svg']);
const CORE_ASSETS=ASSETS.filter(path=>!LARGE_OPTIONAL_ASSETS.has(path));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  // App updates must keep the separately downloaded speech pack.
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>
    key.startsWith('wortweg370-')&&!key.startsWith('wortweg370-voice-')&&!key.startsWith('wortweg370-emergency-')&&key!==CACHE
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
    const posterPath=new URL('./grammar-120.html',self.registration.scope).pathname;
    const dialogPath=new URL('./dialog.html',self.registration.scope).pathname;
    const readerPaths=['complete-reading.html','a1-complete-reader.html','a2-complete-reader.html','b1-complete-reader.html','b2-complete-reader.html','complete-reading-level.html'];
    const selectedReader=readerPaths.find(name=>path===new URL('./'+name,self.registration.scope).pathname);
    const fallback=selectedReader?'./'+selectedReader:
      path===lifetimePath?'./lifetime-grammar.html':
      path===posterPath?'./grammar-120.html':
      path===dialogPath?'./dialog.html':'./index.html';
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
  const freshUI=['cloud.js','extra-progress-sync.js','grammar-120.html','assets/german-grammar-a1-c1-120.svg','lifetime-grammar.css','lifetime-grammar.js','lifetime-grammar-index-1.js','lifetime-grammar-index-2.js','lifetime-grammar-examples.js','lifetime-grammar-rules-1.js','lifetime-grammar-rules-2.js','lifetime-grammar-exact-1.js','lifetime-grammar-exact-2.js','lifetime-grammar-exact-3.js','lifetime-grammar-exact-4.js','lifetime-grammar-verified-matrices.js','lifetime-grammar-myanmar-1.js','lifetime-grammar-myanmar-2.js','lifetime-memorize-1.js','lifetime-memorize-2.js','lifetime-memorize.js','audio.js','settings.js','settings.css','settings-navigation.js','settings-navigation.css',
    'ios-polish.js','ios-polish.css','whiteboard.js','whiteboard.css','page-navigation.js','page-navigation.css','premium-ui.css','home-premium.css','home-refresh.js','home-refresh.css','vocabulary-atlas.js','vocabulary-atlas.css','assets/WortWeg_Complete_11312_German_English_ONE_IMAGE.svg','special-vocabulary.js','special-vocabulary.css','seen-words.js','seen-words.css','vocab-writing.js','vocab-writing.css','flashcards.js','flashcards.css','articles-quiz.js','articles-quiz.css','bank-browser.js','bank-browser.css','grammar.js','grammar-deep.js','grammar-expanded.js','grammar.css','topic-reading-seeds-1.js','topic-reading-seeds-2.js','topic-reading-seeds-3.js','topic-reading-seeds-4.js','topic-reading-engine.js','reading-studio-topics-01-12.js','reading-studio-topics-13-24.js','reading-sentence-my-01-06.js','reading-sentence-my-07-12.js','reading-sentence-my-13-18.js','reading-sentence-my-19-24.js','reading-sentence-en-fixes.js','reading-studio.js','reading-word-explorer.js','topic-lessons.js','topic-lessons.css','learning-checklist.js',
    'live-content.js','live-content.css','dialog.html','dialog.css','dialog-situations.js','dialog-situations-a2.js','dialog-situations-b1.js','dialog-situations-b2.js','dialog.js','enterprise.js','enterprise.css'];
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
