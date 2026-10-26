import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,onAuthStateChanged,signInWithPopup,signInWithRedirect,getRedirectResult,signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDocFromServer,setDoc,serverTimestamp,onSnapshot} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {createExtraProgressSync} from "./extra-progress-sync.js";
const config={apiKey:"AIzaSyAQ8LH6xdtrAESYp-6zyDphhxfAD1NgCR4",authDomain:"wortweg-370.firebaseapp.com",projectId:"wortweg-370",storageBucket:"wortweg-370.firebasestorage.app",messagingSenderId:"991404492771",appId:"1:991404492771:web:673f92ca8f6c077fcd42d6"};
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app),provider=new GoogleAuthProvider();
const panel=document.createElement('div');panel.id='ww-account';panel.className='ww-account';panel.innerHTML='<div class="ww-account-profile"><span id="ww-account-avatar" class="ww-account-avatar" hidden><img id="ww-account-photo" class="ww-account-photo" width="38" height="38" referrerpolicy="no-referrer" decoding="async" alt="" hidden><span id="ww-account-initials" class="ww-account-initials" hidden></span></span><span id="ww-identity">On-device learning</span></div><span id="ww-cloud-status" aria-live="polite"></span><button type="button" id="ww-login" class="ww-account-btn">Sign in with Google</button>';
document.querySelector('header')?.appendChild(panel);
const login=document.getElementById('ww-login'),identity=document.getElementById('ww-identity'),status=document.getElementById('ww-cloud-status');
const avatar=document.getElementById('ww-account-avatar'),photo=document.getElementById('ww-account-photo'),initials=document.getElementById('ww-account-initials');
let avatarVersion=0;
function renderAccount(user){
 const version=++avatarVersion,name=user?(user.displayName||user.email||'Google account'):'On-device learning';
 identity.textContent=name;avatar.hidden=!user;photo.hidden=true;initials.hidden=true;
 photo.onload=photo.onerror=null;photo.removeAttribute('src');photo.alt='';
 if(!user){initials.textContent='';return}
 const parts=(user.displayName||user.email?.split('@')[0]||'Google').trim().split(/\s+/);
 initials.textContent=parts.slice(0,2).map(part=>Array.from(part)[0]||'').join('').toLocaleUpperCase()||'G';
 initials.setAttribute('aria-label','Profile initials for '+name);initials.hidden=false;
 const address=user.photoURL||user.providerData?.find(item=>item.providerId==='google.com')?.photoURL;
 if(!address)return;
 try{const image=new URL(address);if(image.protocol!=='https:')return;
  photo.alt='Google profile picture for '+name;
  photo.onload=()=>{if(version!==avatarVersion)return;photo.hidden=false;initials.hidden=true};
  photo.onerror=()=>{if(version!==avatarVersion)return;photo.hidden=true;initials.hidden=false;photo.removeAttribute('src')};
  photo.src=image.href;
 }catch{}
}
let active=null,ready=false,syncTimer=null,busy=false,applying=false,requestedGoogleLogin=false,generation=0,unsubscribe=null,coreRevision=0;
const setStatus=t=>{status.textContent=t};
const ref=uid=>doc(db,'users',uid,'state','progress');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const valid=p=>p&&Number.isFinite(p.answered)&&Number.isFinite(p.correct)&&p.items&&p.seen&&Array.isArray(p.history);
const blank=()=>({answered:0,correct:0,items:{},seen:{},history:[]});
const pendingKey=uid=>'wortweg370-cloud-pending:'+uid;
function mergeQuiz(local,remote){
 if(!valid(local))return valid(remote)?remote:blank();
 if(!valid(remote))return local;
 const items={...remote.items};
 for(const [id,value] of Object.entries(local.items)){
  const older=items[id];
  if(!older||Number(value?.answered||value?.tries||0)>=Number(older?.answered||older?.tries||0))items[id]=value;
 }
 const histories=[],seen=new Set();
 for(const row of [...remote.history,...local.history]){
  const key=JSON.stringify(row);if(!seen.has(key)){seen.add(key);histories.push(row);}
 }
 return {...remote,...local,answered:Math.max(local.answered,remote.answered),correct:Math.max(local.correct,remote.correct),items,seen:{...remote.seen,...local.seen},history:histories.slice(-1200)};
}
const extra=createExtraProgressSync({
 readCloud:async uid=>(await getDocFromServer(ref(uid))).data()||{},
 writeCloud:(uid,records)=>setDoc(ref(uid),{extraProgress:{version:1,records},extrasUpdatedAt:serverTimestamp()},{merge:true}),
 onStatus:message=>{if(/retry|Storage full/.test(message))setStatus(message);}
});
function queueCore(){
 if(!active||!ready||applying)return;
 const uid=active.uid;coreRevision++;
 try{localStorage.setItem(pendingKey(uid),'1')}catch{}
 clearTimeout(syncTimer);syncTimer=setTimeout(flushCore,850);
}
async function flushCore(){
 if(!active||!ready||busy)return;
 const uid=active.uid,token=generation,savingRevision=coreRevision;
 busy=true;
 try{
  const snapshot=await getDocFromServer(ref(uid));
  if(token!==generation)return;
  const local=window.WortWeg.getProgress(),remote=snapshot.data()?.progress;
  const merged=mergeQuiz(local,remote);
  if(!same(merged,remote))await setDoc(ref(uid),{progress:merged,updatedAt:serverTimestamp()},{merge:true});
  if(token!==generation)return;
  if(!same(local,merged)){applying=true;try{window.WortWeg.setProgress(merged)}finally{applying=false}}
  if(savingRevision===coreRevision)localStorage.removeItem(pendingKey(uid));
  else setTimeout(()=>{if(active?.uid===uid&&ready)queueCore();},0);
  setStatus('Cloud synced');
 }catch{if(token===generation)setStatus('Saved on this device · sync will retry');}
 finally{busy=false;}
}
login.addEventListener('click',async()=>{
 if(active){await signOut(auth);return}
 login.disabled=true;requestedGoogleLogin=true;
 try{await signInWithPopup(auth,provider)}
 catch(e){
  if(['auth/popup-blocked','auth/cancelled-popup-request','auth/operation-not-supported-in-this-environment'].includes(e.code)){
   sessionStorage.setItem('wortweg370-google-redirect-pending','1');await signInWithRedirect(auth,provider);
  }else{requestedGoogleLogin=false;setStatus('Google login failed: '+(e.code||e.message))}
 }finally{login.disabled=false}
});
getRedirectResult(auth).catch(e=>{requestedGoogleLogin=false;sessionStorage.removeItem('wortweg370-google-redirect-pending');setStatus('Login: '+(e.code||e.message))});
onAuthStateChanged(auth,async user=>{
 const token=++generation;ready=false;active=user;clearTimeout(syncTimer);unsubscribe?.();unsubscribe=null;extra.stop();
 login.textContent=user?'Sign out':'Sign in with Google';renderAccount(user);
 const justSignedIn=Boolean(user&&(requestedGoogleLogin||sessionStorage.getItem('wortweg370-google-redirect-pending')==='1'));
 requestedGoogleLogin=false;if(user)sessionStorage.removeItem('wortweg370-google-redirect-pending');
 try{if(user)localStorage.setItem('wortweg370-last-google-uid',user.uid);else localStorage.removeItem('wortweg370-last-google-uid')}catch{}
 window.WortWegAccountSnapshot={uid:user?.uid||null,name:user?.displayName||'',email:user?.email||'',photoURL:user?.photoURL||'',justSignedIn};
 window.dispatchEvent(new CustomEvent('wortweg:account',{detail:window.WortWegAccountSnapshot}));
 if(!window.WortWeg){setStatus('App update needed. Reload this page.');return}
 if(!user){window.WortWeg.switchProfile('guest');setStatus('Saved on this device');ready=true;return}
 window.WortWeg.switchProfile(user.uid);setStatus('Loading your cloud history…');
 try{
  const snapshot=await getDocFromServer(ref(user.uid));
  if(token!==generation)return;
  const local=window.WortWeg.getProgress(),remote=snapshot.data()?.progress,merged=mergeQuiz(local,remote);
  if(!same(local,merged)){applying=true;try{window.WortWeg.setProgress(merged)}finally{applying=false}}
  if(!valid(remote)||!same(merged,remote))localStorage.setItem(pendingKey(user.uid),'1');
  setStatus('Account history loaded');
 }catch{if(token===generation)setStatus('Offline · saved on this device')}
 if(token!==generation)return;
 ready=true;
 extra.start(user.uid);
 unsubscribe=onSnapshot(ref(user.uid),{includeMetadataChanges:true},snapshot=>{
  if(token!==generation||snapshot.metadata.hasPendingWrites||snapshot.metadata.fromCache)return;
  const local=window.WortWeg.getProgress(),remote=snapshot.data()?.progress;
  if(!valid(remote)||same(local,remote))return;
  const merged=mergeQuiz(local,remote);
  if(!same(local,merged)){applying=true;try{window.WortWeg.setProgress(merged)}finally{applying=false}}
  if(!same(merged,remote))queueCore();else setStatus('Cloud synced');
 },()=>{if(token===generation)setStatus('Cloud listener unavailable · retrying')});
 if(localStorage.getItem(pendingKey(user.uid))==='1')queueCore();
});
window.addEventListener('wortweg:changed',queueCore);
window.addEventListener('online',()=>{if(active&&ready){if(localStorage.getItem(pendingKey(active.uid))==='1')queueCore();extra.sync()}});
