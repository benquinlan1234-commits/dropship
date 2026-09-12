import { chromium } from 'playwright';
import fs from 'fs';

// Crop a studio packshot in to its own content, keeping the white ground and the
// shadow exactly as shot. Nothing is made transparent — the product simply fills
// more of the frame, so the white margin around it shrinks.
const src = process.argv[2], out = process.argv[3];
const margin = Number(process.argv[4] || 0.05);   // breathing room, as a share of the content box

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage();
const dataUrl = 'data:image/webp;base64,' + fs.readFileSync(src).toString('base64');

const res = await p.evaluate(async ({ dataUrl, margin }) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, W, H).data;
  const i4 = (n) => n << 2;

  // The PRODUCT, not the content. A cast shadow is neutral grey and mid-toned,
  // so it fails both tests below and never widens the box — which matters here
  // because the shadow runs all the way to the edge of the frame and cropping
  // to it would gain nothing at all.
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = i4(y * W + x);
    const R = px[i], G = px[i + 1], B = px[i + 2];
    const chroma = Math.max(R, G, B) - Math.min(R, G, B);
    const lum = (R + G + B) / 3;
    if (chroma >= 8 || lum < 170) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }

  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const side = Math.round(Math.max(cw, ch) * (1 + margin * 2));
  const o = document.createElement('canvas'); o.width = side; o.height = side;
  const octx = o.getContext('2d');
  octx.fillStyle = '#ffffff';
  octx.fillRect(0, 0, side, side);
  octx.drawImage(c, x0, y0, cw, ch, Math.round((side - cw) / 2), Math.round((side - ch) / 2), cw, ch);

  return { url: o.toDataURL('image/webp', 0.92), content: [x0, y0, x1, y1], cw, ch, side,
           before: (Math.max(cw, ch) / W * 100).toFixed(1), after: (Math.max(cw, ch) / side * 100).toFixed(1) };
}, { dataUrl, margin });

fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
console.log(`content box ${res.content.join(',')}  (${res.cw}x${res.ch})`);
console.log(`frame 1000 -> ${res.side};  content fills ${res.before}% -> ${res.after}% of the frame`);
console.log(`${out}  ${fs.statSync(out).size} bytes`);
await b.close();
