import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
await mkdir('assets', {recursive:true});
await sharp('../icon.svg').resize(1024,1024).flatten({background:'#073e72'}).png().toFile('assets/icon-only.png');
const mark=await sharp('../icon.svg').resize(640,640).png().toBuffer();
await sharp({create:{width:1024,height:1024,channels:4,background:'#073e72'}}).png().toFile('assets/icon-background.png');
await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite([{input:mark,gravity:'centre'}]).png().toFile('assets/icon-foreground.png');
await sharp({create:{width:2732,height:2732,channels:4,background:'#073e72'}}).composite([{input:mark,gravity:'centre'}]).png().toFile('assets/splash.png');
