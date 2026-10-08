import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const config=JSON.parse(readFileSync('android/app/google-services.json','utf8'));
const app=JSON.parse(readFileSync('capacitor.config.json','utf8'));
const client=config.client.find(c=>c.client_info.android_client_info?.package_name===app.appId);
assert(client,'Firebase package must match the app');
assert(client.oauth_client.some(c=>c.client_type===3),'Google web client ID is required');
const android=client.oauth_client.filter(c=>c.client_type===1&&c.android_info?.package_name===app.appId);
assert(android.length,'Registered Android OAuth client is required');
if(process.argv[2]){
 const report=readFileSync(process.argv[2],'utf8');
 const sha=report.match(/SHA1:\s*([A-Fa-f0-9:]+)/)?.[1].replaceAll(':','').toLowerCase();
 assert(sha&&android.some(c=>c.android_info.certificate_hash.toLowerCase()===sha),'APK signing certificate does not match Firebase OAuth; stop before releasing');
}
console.log('Firebase package and Android/web OAuth configuration verified'+(process.argv[2]?' against actual signing certificate.':'.'));
