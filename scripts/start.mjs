import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
const version=Number(process.versions.node.split('.')[0]);
if(version<22){console.error('Instala Node.js 22.12 o superior y vuelve a ejecutar.');process.exit(1);}
const npm=process.platform==='win32'?'npm.cmd':'npm';
const run=(args)=>new Promise((resolve,reject)=>{const p=spawn(npm,args,{stdio:'inherit',shell:process.platform==='win32'});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(new Error('No se pudo ejecutar npm '+args.join(' '))));});
try{if(!existsSync('node_modules')||!existsSync('node_modules/vite'))await run(['ci']);await run(['run','dev']);}catch(e){console.error(e.message);process.exitCode=1;}
