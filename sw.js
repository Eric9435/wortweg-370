const CACHE='wortweg370-v23';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg?v=11','./cloud.js?v=14','./account.css?v=14','./settings.js','./settings.css','./audio.js','./audio.css','./enterprise.css','./enterprise.js','./settings-navigation.js','./settings-navigation.css','./ios-polish.js','./ios-polish.css','./seen-words.js','./seen-words.css','./grammar.js','./grammar.css','./topic-lessons.js','./topic-lessons.css','./live-content.js','./live-content.css','./content/v1/pack.json'];
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
    event.respondWith(fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));}
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  // Network-first app UI updates: the old cache-first policy could keep
  // settings.js permanently stale, preventing new Home/menu features from loading
  // even when Pages had deployed them. Offline users still get the cached copy.
  const root=self.registration.scope;
  const freshUI=['settings.js','settings.css','settings-navigation.js','settings-navigation.css',
    'ios-polish.js','ios-polish.css','seen-words.js','seen-words.css','grammar.js','grammar.css','topic-lessons.js','topic-lessons.css',
    'live-content.js','live-content.css','enterprise.js','enterprise.css'];
  const requested=new URL(event.request.url);
  if(requested.href.startsWith(root)&&freshUI.includes(requested.pathname.slice(new URL(root).pathname.length))){
    event.respondWith(fetch(event.request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      }
      return response;
    }).catch(()=>caches.match(event.request)));
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
