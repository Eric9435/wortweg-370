// Stage a distributable WEBSITE ONLY. This script does not push or deploy.
import {cp, copyFile, mkdir, rm, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=join(root,'.migration-preview','website');
export const publicFiles=[
 'index.html','manifest.webmanifest','icon.svg','sw.js',
 'cloud.js','account.css','audio.js','audio.css',
 'settings.js','settings.css','enterprise.js','enterprise.css'
];
await rm(target,{recursive:true,force:true});
await mkdir(target,{recursive:true});
for(const name of publicFiles){
 await copyFile(join(root,name),join(target,name));
}
await mkdir(join(target,'vendor'),{recursive:true});
await cp(join(root,'vendor','mespeak'),join(target,'vendor','mespeak'),{recursive:true});
await writeFile(join(target,'.nojekyll'),'');
console.log('Prepared public website assets in .migration-preview/website');
console.log('No repository settings, GitHub releases, production files or Firebase settings were changed.');
