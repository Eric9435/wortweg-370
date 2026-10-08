import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,onAuthStateChanged,signInWithPopup,signInWithRedirect,getRedirectResult,signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const config={apiKey:"AIzaSyAQ8LH6xdtrAESYp-6zyDphhxfAD1NgCR4",authDomain:"wortweg-370.firebaseapp.com",projectId:"wortweg-370",storageBucket:"wortweg-370.firebasestorage.app",messagingSenderId:"991404492771",appId:"1:991404492771:web:673f92ca8f6c077fcd42d6"};
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app),provider=new GoogleAuthProvider();
const panel=document.createElement('div');panel.id='ww-account';panel.className='ww-account';panel.innerHTML='<span id="ww-identity">On-device learning</span><span id="ww-cloud-status" aria-live="polite"></span><button type="button" id="ww-login" class="ww-account-btn">Sign in with Google</button>';
document.querySelector('header')?.appendChild(panel);
const login=document.getElementById('ww-login'),identity=document.getElementById('ww-identity'),status=document.getElementById('ww-cloud-status');
let active=null,ready=false,syncTimer=null,busy=false;
const setStatus=t=>{status.textContent=t};
login.addEventListener('click',async()=>{if(active){await signOut(auth);return}login.disabled=true;try{await signInWithPopup(auth,provider)}catch(e){if(['auth/popup-blocked','auth/cancelled-popup-request','auth/operation-not-supported-in-this-environment'].includes(e.code)){await signInWithRedirect(auth,provider)}else{setStatus('Google login failed: '+(e.code||e.message))}}finally{login.disabled=false}});
getRedirectResult(auth).catch(e=>setStatus('Login: '+(e.code||e.message)));
const ref=uid=>doc(db,'users',uid,'state','progress');
onAuthStateChanged(auth,async user=>{ready=false;active=user;clearTimeout(syncTimer);login.textContent=user?'Sign out':'Sign in with Google';identity.textContent=user?(user.displayName||user.email||'Google account'):'On-device learning';if(!window.WortWeg){setStatus('App update needed. Reload this page.');return}if(!user){window.WortWeg.switchProfile('guest');setStatus('Saved on this device');ready=true;return}
window.WortWeg.switchProfile(user.uid);setStatus('Loading your history…');try{const snapshot=await getDoc(ref(user.uid));if(snapshot.exists()&&snapshot.data().progress){window.WortWeg.setProgress(snapshot.data().progress);setStatus('Cloud history loaded')}else{setStatus('New account · no quiz history yet')}}catch(e){setStatus('Cloud unavailable · saving on this device');}ready=true});
window.addEventListener('wortweg:changed',()=>{if(!active||!ready)return;clearTimeout(syncTimer);setStatus('Saving…');syncTimer=setTimeout(async()=>{if(busy)return;busy=true;const uid=active.uid;try{await setDoc(ref(uid),{progress:window.WortWeg.getProgress(),updatedAt:serverTimestamp()});if(active?.uid===uid)setStatus('Cloud synced')}catch(e){setStatus('Saved on device · cloud sync failed')}finally{busy=false}},900)});
window.addEventListener('online',()=>{if(active&&ready)window.dispatchEvent(new Event('wortweg:changed'))});
