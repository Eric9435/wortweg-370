// WortWeg 370: update metadata only. Never run downloaded code or silently install.
export const UPDATE_MANIFEST_URL='https://eric9435.github.io/wortweg-370/updates/android.json';
export const EXPECTED_PACKAGE='com.innovatex.wortweg370.preview';
const DOWNLOAD=/^https:\/\/github\.com\/Eric9435\/wortweg-370\/releases\/download\/mobile-preview-[1-9]\d*\/WortWeg-370-Android-preview\.apk$/;
const RELEASE=/^https:\/\/github\.com\/Eric9435\/wortweg-370\/releases\/tag\/mobile-preview-[1-9]\d*$/;
const MAX_RESPONSE_CHARS=8192;
export function validateManifest(data,installedCode,installedPackage=EXPECTED_PACKAGE){
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 if(data.schema!==1||data.packageName!==EXPECTED_PACKAGE||data.packageName!==installedPackage)return null;
 if(!Number.isSafeInteger(data.versionCode)||data.versionCode<1||data.versionCode>2147483647)return null;
 if(!Number.isSafeInteger(installedCode)||installedCode<1)return null;
 if(typeof data.versionName!=='string'||data.versionName.length>60||!data.versionName.trim())return null;
 if(typeof data.downloadUrl!=='string'||!DOWNLOAD.test(data.downloadUrl))return null;
 if(typeof data.releasePage!=='string'||!RELEASE.test(data.releasePage))return null;
 const releaseTag=data.releasePage.split('/').pop();
 if(!data.downloadUrl.includes('/'+releaseTag+'/'))return null;
 if(typeof data.notes!=='string'||data.notes.length>400)return null;
 if(data.versionCode<=installedCode)return {available:false,latestVersionCode:data.versionCode};
 return {
  available:true,
  versionCode:data.versionCode,
  versionName:data.versionName,
  notes:data.notes,
  downloadUrl:data.downloadUrl,
  releasePage:data.releasePage
 };
}
export async function getAvailableUpdate({fetcher=fetch,installedCode,installedPackage=EXPECTED_PACKAGE,signal}){
 const response=await fetcher(UPDATE_MANIFEST_URL,{
  method:'GET',credentials:'omit',cache:'no-store',redirect:'follow',signal,
  headers:{Accept:'application/json'}
 });
 if(!response.ok)throw Error('Update service unavailable');
 const length=Number(response.headers?.get?.('content-length')||0);
 if(length>MAX_RESPONSE_CHARS)throw Error('Update response too large');
 const text=await response.text();
 if(text.length>MAX_RESPONSE_CHARS)throw Error('Update response too large');
 let parsed;
 try{parsed=JSON.parse(text)}catch{throw Error('Invalid update response')}
 const manifest=validateManifest(parsed,installedCode,installedPackage);
 if(!manifest)throw Error('Untrusted update information');
 return manifest;
}
