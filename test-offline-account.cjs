// Offline account bootstrap must preserve a previously signed-in user's local work.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const settings=fs.readFileSync('settings.js','utf8');
const index=settings.lastIndexOf('// Restore the previously authenticated profile');
assert(index>=0,'Offline profile bootstrap missing');
const code=settings.slice(index);
function launch(savedUid,online=false,native=false){
 let switched='',snapshot=null;
 const listeners={};
 const w={WortWegNative:native?{}:undefined,WortWeg:{switchProfile:uid=>switched=uid},
   addEventListener:(name,handler)=>{listeners[name]=handler},
   dispatchEvent:event=>{if(event.type==='wortweg:account')snapshot=event.detail}};
 const store={getItem:key=>key==='wortweg370-last-google-uid'?savedUid:null};
 const sandbox={window:w,navigator:{onLine:online},localStorage:store,
   document:{readyState:'complete',addEventListener:()=>{}},
   CustomEvent:class{constructor(type,args){this.type=type;this.detail=args.detail}}};
 vm.runInNewContext(code,sandbox,{filename:'offline-bootstrap.js'});
 return {switched,snapshot,listeners,window:w};
}
const restored=launch('member-123');
assert.equal(restored.switched,'member-123');
assert.equal(restored.snapshot.uid,'member-123');
assert.equal(restored.snapshot.offline,true);
assert.equal(typeof restored.listeners.online,'function','Reconnection is automatic');
assert.equal(launch(null).switched,'','Guest cannot inherit a signed-in profile');
assert.equal(launch('member-123',true).switched,'','Online Firebase login remains authoritative');
assert.equal(launch('member-123',false,true).switched,'','Native Firebase login remains authoritative');
console.log('PASS: offline PWA reopens last signed-in profile safely and auto reconnects when online');
