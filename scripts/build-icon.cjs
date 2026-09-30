// Deterministic code-drawn icon. No image library or runtime dependency.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const size=256, pixels=Buffer.alloc(size*(size*4+1));
function segment(x,y,ax,ay,bx,by,width) {
  const t=Math.max(0,Math.min(1,((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2)));
  return Math.hypot(x-ax-t*(bx-ax),y-ay-t*(by-ay))<=width;
}
for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
  let color=[15,23,42];
  if(segment(x,y,78,76,42,128,7)||segment(x,y,42,128,78,180,7)||segment(x,y,178,76,214,128,7)||segment(x,y,214,128,178,180,7)) color=[56,189,248];
  if(segment(x,y,112,83,144,128,3)||segment(x,y,144,128,112,173,3)) color=[100,116,139];
  if(Math.hypot(x-112,y-83)<12||Math.hypot(x-144,y-128)<12||Math.hypot(x-112,y-173)<12) color=[94,234,212];
  const i=y*(size*4+1)+1+x*4;
  pixels[i]=color[0];pixels[i+1]=color[1];pixels[i+2]=color[2];pixels[i+3]=255;
}
function crc32(data) { let crc=0xffffffff; for(const byte of data) { crc^=byte;for(let b=0;b<8;b++) crc=(crc>>>1)^((crc&1)?0xedb88320:0); } return (crc^0xffffffff)>>>0; }
function chunk(type,data) { const name=Buffer.from(type), length=Buffer.alloc(4), crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([length,name,data,crc]); }
const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
const target=path.resolve('assets');fs.mkdirSync(target,{recursive:true});
fs.writeFileSync(path.join(target,'icon.png'),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]));
