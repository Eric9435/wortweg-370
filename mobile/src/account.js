import {FirebaseAuthentication} from '@capacitor-firebase/authentication';
import {initializeApp} from 'firebase/app';
import {initializeAuth,browserLocalPersistence,onAuthStateChanged,GoogleAuthProvider,signInWithCredential,signOut} from 'firebase/auth';
import {initializeFirestore,persistentLocalCache,persistentSingleTabManager,doc,getDocFromServer,setDoc,serverTimestamp,onSnapshot} from 'firebase/firestore';
import config from './firebase-config.json';

// Native Google account chooser returns a credential; Firebase JS authenticates
// the same UID used by the website and persists it on this phone.
export function initNativeAccount(){
 const app=initializeApp(config);
 const auth=initializeAuth(app,{persistence:browserLocalPersistence});
 const db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentSingleTabManager()})});
 const panel=document.createElement('div');panel.id='ww-account';panel.className='ww-account';
 panel.innerHTML='<div class="ww-account-profile"><span id="ww-account-avatar" class="ww-account-avatar" hidden><img id="ww-account-photo" class="ww-account-photo" width="38" height="38" referrerpolicy="no-referrer" decoding="async" alt="" hidden><span id="ww-account-initials" class="ww-account-initials" hidden></span></span><span id="ww-identity">On-device learning</span></div><span id="ww-cloud-status" aria-live="polite"></span><button type="button" id="ww-login" class="ww-account-btn">Sign in with Google</button>';
 document.querySelector('header').append(panel);
 const retry=document.createElement('button');retry.type='button';retry.id='ww-google-retry';retry.className='ww-account-btn';retry.textContent='Try Google sign-in again';retry.hidden=true;panel.append(retry);
 let alternate=false;
 const $=id=>document.getElementById(id),login=$('ww-login'),photo=$('ww-account-photo'),initials=$('ww-account-initials');
 const info=document.createElement('p');info.className='mobile-note muted';info.hidden=true;document.querySelector('main').prepend(info);
 const welcome=document.createElement('div');welcome.id='ww-welcome';welcome.className='ww-welcome';welcome.hidden=true;
 welcome.innerHTML='<div class="ww-welcome-content"><img src="./icon.svg" alt="" class="ww-welcome-logo"><h1>WortWeg <span>370</span></h1><div class="ww-welcome-actions"><button type="button" id="ww-welcome-google" class="ww-welcome-google"><svg class="ww-login-icon" aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.24c0-.71-.06-1.39-.18-2.05H12v3.87h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.15c1.84-1.7 2.9-4.2 2.9-7.21Z"/><path fill="#34A853" d="M12 21.76c2.62 0 4.82-.87 6.43-2.31l-3.15-2.45c-.87.59-1.99.94-3.28.94a5.9 5.9 0 0 1-5.55-4.09H3.19v2.52A9.75 9.75 0 0 0 12 21.76Z"/><path fill="#FBBC05" d="M6.45 13.85a5.86 5.86 0 0 1 0-3.7V7.63H3.19a9.76 9.76 0 0 0 0 8.74l3.26-2.52Z"/><path fill="#EA4335" d="M12 6.06c1.43 0 2.72.49 3.73 1.47l2.8-2.8A9.28 9.28 0 0 0 12 2.24a9.75 9.75 0 0 0-8.81 5.39l3.26 2.52A5.89 5.89 0 0 1 12 6.06Z"/></svg><span>Login with Google</span></button><button type="button" id="ww-welcome-guest" class="ww-welcome-guest"><svg class="ww-login-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg><span>Continue as Guest</span></button></div><p id="ww-welcome-status" role="status" aria-live="polite" hidden></p></div>';
 document.body.append(welcome);
 const guestPreference='wortweg370-guest-entered';
 welcome.querySelector('#ww-welcome-google').addEventListener('click',()=>login.click());
 welcome.querySelector('#ww-welcome-guest').addEventListener('click',()=>{sessionStorage.setItem(guestPreference,'1');welcome.hidden=true;});
 const conflict=document.createElement('div');conflict.className='card';conflict.id='ww-history-conflict';conflict.hidden=true;
 conflict.innerHTML='<h3>Choose your learning history</h3><p>This phone has unsynced answers and your account has different cloud history. Both copies are kept until you choose which one to continue with.</p><div class="flex"><button type="button" class="btn" id="ww-use-cloud">Use cloud history</button><button type="button" class="btn" id="ww-use-phone">Use this phone’s history</button></div>';
 info.after(conflict);
 let user=null,ready=false,applying=false,version=0,avatarVersion=0,timer=null,unsubscribe=null,revision=0,writing=null,cloudChoice=null,requestedGoogleLogin=false;
 const status=t=>{ $('ww-cloud-status').textContent=t;const notice=$('ww-welcome-status');if(notice){const visible=/failed|did not finish|SHA-1|try again|Opening Google/i.test(t);notice.textContent=visible?t:'';notice.hidden=!visible;} };
 const dirtyKey=uid=>'wortweg370-cloud-pending:'+uid;
 const dirty=uid=>localStorage.getItem(dirtyKey(uid))==='1';
 const mark=uid=>localStorage.setItem(dirtyKey(uid),'1');
 const clear=uid=>localStorage.removeItem(dirtyKey(uid));
 const ref=uid=>doc(db,'users',uid,'state','progress');
 const stable=v=>v&&typeof v==='object'?Array.isArray(v)?v.map(stable):Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
 const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
 const baseKey=uid=>'wortweg370-cloud-base:'+uid;
 const remember=(uid,p)=>localStorage.setItem(baseKey(uid),JSON.stringify(stable(p)));
 const valid=p=>p&&Number.isFinite(p.answered)&&Number.isFinite(p.correct)&&p.items&&p.seen&&Array.isArray(p.history);
 function renderAccount(account){
  const current=++avatarVersion,name=account?(account.displayName||account.email||'Google account'):'On-device learning';
  $('ww-identity').textContent=name;$('ww-account-avatar').hidden=!account;photo.hidden=true;initials.hidden=true;photo.onload=photo.onerror=null;photo.removeAttribute('src');
  login.textContent=account?'Sign out':'Sign in with Google';retry.hidden=true;
  if(!account)return;
  initials.textContent=(account.displayName||account.email?.split('@')[0]||'Google').trim().split(/\s+/).slice(0,2).map(p=>Array.from(p)[0]||'').join('').toUpperCase();initials.hidden=false;
  try{const address=new URL(account.photoURL);if(address.protocol!=='https:')return;photo.alt='Google profile picture for '+name;photo.onload=()=>{if(current!==avatarVersion)return;photo.hidden=false;initials.hidden=true};photo.onerror=()=>{if(current!==avatarVersion)return;photo.hidden=true;initials.hidden=false;photo.removeAttribute('src')};photo.src=address.href;}catch{}
 }
 function apply(p){applying=true;try{window.WortWeg.setProgress(p);}finally{applying=false;}}
 function choose(p){cloudChoice=p;conflict.hidden=false;status('Choose phone or cloud history before syncing.');}
 function queueSave(){clearTimeout(timer);timer=setTimeout(flush,900);}
 async function flush(){
  if(!user||!ready||cloudChoice||!dirty(user.uid))return;
  if(writing===version){queueSave();return;}
  const uid=user.uid,current=version;writing=current;
  status('Saved on phone · syncing…');
  let timeout;
  try{
   const snapshot=await Promise.race([getDocFromServer(ref(uid)),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('offline')),8000);})]);
   if(current!==version||user?.uid!==uid)return;
   const remote=snapshot.data()?.progress,progress=window.WortWeg.getProgress(),savedRevision=revision;
   if(valid(remote)){
    const base=localStorage.getItem(baseKey(uid));
    if(!same(remote,progress)&&(!base||base!==JSON.stringify(stable(remote)))){choose(remote);return;}
    if(same(remote,progress)){clear(uid);remember(uid,remote);status('Cloud synced');return;}
   }
   await setDoc(ref(uid),{progress,updatedAt:serverTimestamp()},{merge:true});
   if(current!==version||user?.uid!==uid)return;
   remember(uid,progress);
   if(savedRevision===revision){clear(uid);status('Cloud synced');}else queueSave();
  }catch{if(current===version)status('Saved on phone · sync will retry when online');}
  finally{clearTimeout(timeout);if(writing===current)writing=null;}
 }
 $('ww-use-cloud').onclick=()=>{if(!user||!cloudChoice)return;const uid=user.uid;localStorage.setItem('wortweg370-cloud-backup:'+uid,JSON.stringify(window.WortWeg.getProgress()));apply(cloudChoice);remember(uid,cloudChoice);clear(uid);cloudChoice=null;conflict.hidden=true;status('Cloud history loaded');};
 $('ww-use-phone').onclick=()=>{if(!user||!cloudChoice)return;localStorage.setItem('wortweg370-cloud-backup:'+user.uid,JSON.stringify(cloudChoice));remember(user.uid,cloudChoice);cloudChoice=null;conflict.hidden=true;mark(user.uid);queueSave();};
 login.onclick=async()=>{
  login.disabled=true;welcome.querySelector('#ww-welcome-google').disabled=true;retry.disabled=true;retry.hidden=true;let stage='Google';
  try{
   if(user){await signOut(auth);await FirebaseAuthentication.signOut().catch(()=>{});return;}
   requestedGoogleLogin=true;
   status('Opening Google account chooser…');
   const result=await FirebaseAuthentication.signInWithGoogle({skipNativeAuth:true,useCredentialManager:!alternate});
   if(!result.credential?.idToken)throw Error('Google did not return an identity token.');
   stage='Firebase';
   await signInWithCredential(auth,GoogleAuthProvider.credential(result.credential.idToken,result.credential.accessToken));
  }catch(error){
   requestedGoogleLogin=false;
   const message=String(error.message||error.code||error);
   const code=String(error.code||'').replace(/[^a-zA-Z0-9_./-]/g,'').slice(0,80);
   if(stage==='Google'&&/12501|cancel/i.test(message))status('Google sign-in did not finish. If you selected an account, try sign-in again.');
   else if(/\b10\b|DEVELOPER_ERROR/i.test(message))status('Google sign-in setup needs this APK’s SHA-1 fingerprint in Firebase.');
   else status(stage+' sign-in failed'+(code?' ('+code+')':'')+'. Check your connection and try again.');
   retry.hidden=Boolean(user)||stage!=='Google';
  }finally{login.disabled=false;welcome.querySelector('#ww-welcome-google').disabled=false;retry.disabled=false;alternate=false;}
 };
 retry.onclick=()=>{alternate=true;return login.onclick();};
 onAuthStateChanged(auth,async account=>{
  const current=++version;ready=false;clearTimeout(timer);unsubscribe?.();unsubscribe=null;cloudChoice=null;conflict.hidden=true;user=account;welcome.hidden=!!account||sessionStorage.getItem(guestPreference)==='1';renderAccount(account);window.WortWeg.switchProfile(account?.uid||'guest');window.WortWegNative.accountReady=true;
  const justSignedIn=Boolean(account&&requestedGoogleLogin);requestedGoogleLogin=false;
  window.WortWegAccountSnapshot={uid:account?.uid||null,name:account?.displayName||'',email:account?.email||'',photoURL:account?.photoURL||'',justSignedIn};window.dispatchEvent(new CustomEvent('wortweg:account',{detail:window.WortWegAccountSnapshot}));
  if(!account){status('Saved on this phone');ready=true;return;}
  const uid=account.uid;status('Loading your cloud history…');let timeout;
  try{
   const snapshot=await Promise.race([getDocFromServer(ref(uid)),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('offline')),8000);})]);
   if(current!==version)return;
   const remote=snapshot.data()?.progress;
   if(valid(remote)){
    if(dirty(uid)&&!same(remote,window.WortWeg.getProgress()))choose(remote);
    else{apply(remote);remember(uid,remote);clear(uid);status('Cloud history loaded');}
   }else status('Account ready · saved on this phone');
  }catch{if(current===version)status('Offline · saved on this phone');}
  finally{clearTimeout(timeout);}
  if(current!==version)return;ready=true;
  unsubscribe=onSnapshot(ref(uid),{includeMetadataChanges:true},snapshot=>{
   if(current!==version||snapshot.metadata.hasPendingWrites||snapshot.metadata.fromCache)return;
   const remote=snapshot.data()?.progress;if(!valid(remote)||same(remote,window.WortWeg.getProgress()))return;
   if(dirty(uid))choose(remote);else{apply(remote);remember(uid,remote);status('Cloud synced');}
  },()=>{if(current===version)status('Saved on phone · cloud unavailable');});
  if(dirty(uid)&&!cloudChoice)queueSave();
 });
 window.addEventListener('wortweg:changed',()=>{
  if(applying||!user)return;revision++;mark(user.uid);status('Saved on phone');if(ready&&!cloudChoice)queueSave();
 });
 window.addEventListener('online',()=>{if(user&&ready&&!cloudChoice)queueSave();});
 setInterval(()=>{if(user&&ready&&dirty(user.uid)&&!cloudChoice)queueSave();},30000);
}
