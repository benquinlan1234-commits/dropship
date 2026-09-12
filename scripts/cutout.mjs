import { chromium } from 'playwright';
import fs from 'fs';

const src = process.argv[2], out = process.argv[3];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage();
const dataUrl = 'data:image/webp;base64,' + fs.readFileSync(src).toString('base64');

const res = await p.evaluate(async ({ dataUrl }) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, W, H), px = d.data;
  const i4 = (n) => n << 2;

  const corners = [[0,0],[W-1,0],[0,H-1],[W-1,H-1]].map(([x,y]) => { const i = i4(y*W+x); return [px[i],px[i+1],px[i+2]]; });
  const bg = [0,1,2].map(k => Math.round(corners.reduce((s,v)=>s+v[k],0)/corners.length));
  const delta = (n) => { const i = i4(n); return Math.abs(px[i]-bg[0])+Math.abs(px[i+1]-bg[1])+Math.abs(px[i+2]-bg[2]); };
  const chroma = (n) => { const i = i4(n); const R=px[i],G=px[i+1],B=px[i+2];
    return Math.max(R,G,B) - Math.min(R,G,B); };
  const lum = (n) => { const i = i4(n); return (px[i]+px[i+1]+px[i+2])/3; };

  // Where the product itself actually is: pixels that are either coloured or
  // genuinely dark. A studio shadow is neutral grey and mid-toned, so it fails
  // both tests and never widens this box.
  let px0=W, py0=H, px1=0, py1=0;
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    const n = y*W+x;
    if (chroma(n) >= 8 || lum(n) < 170) {
      if (x<px0)px0=x; if (x>px1)px1=x; if (y<py0)py0=y; if (y>py1)py1=y;
    }
  }

  // 1. Strict flood fill from the edges clears the flat ground.
  const outside = new Uint8Array(W*H); const st = [];
  for (let x=0;x<W;x++) st.push(x,0,x,H-1);
  for (let y=0;y<H;y++) st.push(0,y,W-1,y);
  while (st.length) {
    const y = st.pop(), x = st.pop();
    if (x<0||y<0||x>=W||y>=H) continue;
    const n = y*W+x;
    if (outside[n] || delta(n) > 26) continue;
    outside[n] = 1; st.push(x+1,y,x-1,y,x,y+1,x,y-1);
  }
  const a0 = new Float32Array(W*H);
  for (let n=0;n<W*H;n++) a0[n] = outside[n] ? 0 : 1;

  // 2. Soften that boundary.
  const r = 2, a1 = new Float32Array(W*H);
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    let s=0,k=0;
    for (let dy=-r;dy<=r;dy++) for (let dx=-r;dx<=r;dx++) {
      const nx=x+dx, ny=y+dy; if (nx<0||ny<0||nx>=W||ny>=H) continue;
      s += a0[ny*W+nx]; k++;
    }
    a1[y*W+x] = s/k;
  }

  // 3. Fade everything OUTSIDE the product's own box. The shadow survives the
  //    flood fill and runs straight off the frame, and that cut is the line
  //    that reads as a border. Ramping from the product outward removes it and
  //    leaves the shadow as a halo that dies away instead of stopping.
  const pad = 22, reach = 88;
  const ramp = (t) => t<=0 ? 0 : t>=1 ? 1 : t*t*(3-2*t);
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    const n = y*W+x;
    if (a1[n] === 0) continue;
    const ox = Math.max(0, px0 - pad - x, x - (px1 + pad));
    const oy = Math.max(0, py0 - pad - y, y - (py1 + pad));
    const dist = Math.hypot(ox, oy);
    if (dist > 0) a1[n] *= 1 - ramp(Math.min(1, dist / reach));
  }

  for (let n=0;n<W*H;n++) px[i4(n)+3] = Math.round(Math.min(1, a1[n]) * 255);
  ctx.putImageData(d, 0, 0);

  // 4. Trim the dead transparent margin so the product fills the frame. Same
  //    displayed box, bigger product, no layout change.
  let tx0=W, ty0=H, tx1=0, ty1=0;
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (px[i4(y*W+x)+3] > 6) {
    if(x<tx0)tx0=x; if(x>tx1)tx1=x; if(y<ty0)ty0=y; if(y>ty1)ty1=y; }
  const tw = tx1-tx0+1, th = ty1-ty0+1;
  const side = Math.max(tw, th);
  const o = document.createElement('canvas'); o.width = side; o.height = side;
  const octx = o.getContext('2d');
  octx.drawImage(c, tx0, ty0, tw, th, Math.round((side-tw)/2), Math.round((side-th)/2), tw, th);

  return { url: o.toDataURL('image/webp', 0.92), bg, product:[px0,py0,px1,py1],
           trimmed:[tx0,ty0,tx1,ty1], from:`${W}x${H}`, to:`${side}x${side}`,
           gained: ((side ? (Math.max(tw,th)/W) : 1)).toFixed(3) };
}, { dataUrl });

fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
console.log(`product box ${res.product.join(',')}`);
console.log(`trimmed to  ${res.trimmed.join(',')}   canvas ${res.from} -> ${res.to}`);
console.log(`${out}  ${fs.statSync(out).size} bytes`);
await b.close();
