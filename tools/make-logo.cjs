const opentype = require('opentype.js');
const fs = require('fs');
const path = require('path');
// Needs: npm i opentype.js@1 vazirmatn  (TTF dir via VAZIR_TTF)
const FONT = process.env.VAZIR_TTF || path.join(__dirname, 'node_modules', 'vazirmatn', 'fonts', 'ttf');
const OUT = process.argv[2];

const black = opentype.loadSync(path.join(FONT, 'Vazirmatn-Black.ttf'));
const medium = opentype.loadSync(path.join(FONT, 'Vazirmatn-Medium.ttf'));

function shaped(font, text, size) {
  const p = font.getPath(text, 0, 0, size, { features: { liga: true, rlig: true } });
  const bb = p.getBoundingBox();
  return { d: p.toPathData(2), bb };
}

function build({ fg, dim, teal, sub, withSub, file, bg }) {
  const size = 200;
  const main = shaped(black, 'ادامه دارد', size);
  const w = main.bb.x2 - main.bb.x1;
  const h = main.bb.y2 - main.bb.y1;
  const pad = 40;
  const dotR = 17, gap = 22;
  const dotsW = 3 * dotR * 2 + 2 * gap;
  // Dots sit on the left (end of the RTL line), on the baseline.
  const dotsX0 = pad;
  const textX = pad + dotsW + 34 - main.bb.x1;
  const baseY = pad - main.bb.y1;
  const dotCy = baseY - dotR; // sit on baseline
  // Order in reading direction (right→left): first dot is rightmost (dim), last is leftmost (lit).
  const cx = i => dotsX0 + dotR + i * (2 * dotR + gap);
  let subSvg = '', totalH = pad * 2 + h;
  if (withSub) {
    const s = shaped(medium, 'اینترنت ممکنه قطع بشه، مسیرت نه', 50);
    const sw = s.bb.x2 - s.bb.x1;
    const totalW = dotsW + 34 + w;
    const sx = pad + totalW - sw - s.bb.x1;
    const sy = pad + h + 70 - s.bb.y1;
    subSvg = `<path fill="${sub}" transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})" d="${s.d}"/>`;
    totalH = sy + s.bb.y2 + pad;
  }
  const W = pad * 2 + dotsW + 34 + w;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(0)} ${totalH.toFixed(0)}" width="${W.toFixed(0)}" height="${totalH.toFixed(0)}" role="img" aria-label="ادامه دارد…">
${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}
<defs><filter id="g" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="9"/></filter></defs>
<path fill="${fg}" transform="translate(${textX.toFixed(1)} ${baseY.toFixed(1)})" d="${main.d}"/>
<line x1="${cx(0)}" y1="${dotCy}" x2="${cx(2)}" y2="${dotCy}" stroke="${dim}" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round"/>
<circle cx="${cx(2)}" cy="${dotCy}" r="${dotR}" fill="${dim}"/>
<circle cx="${cx(1)}" cy="${dotCy}" r="${dotR}" fill="${dim}"/>
<circle cx="${cx(0)}" cy="${dotCy}" r="${dotR + 6}" fill="${teal}" opacity=".55" filter="url(#g)"/>
<circle cx="${cx(0)}" cy="${dotCy}" r="${dotR}" fill="${teal}"/>
${subSvg}
</svg>`;
  fs.writeFileSync(path.join(OUT, file), svg);
}

build({ fg: '#F4F7FB', dim: '#3A4A70', teal: '#13B8A6', sub: '#8A97B5', withSub: false, file: 'logo-dark.svg' });
build({ fg: '#141D35', dim: '#C5CEDF', teal: '#13B8A6', sub: '#5A6785', withSub: false, file: 'logo-light.svg' });
build({ fg: '#F4F7FB', dim: '#3A4A70', teal: '#13B8A6', sub: '#8A97B5', withSub: true, file: 'logo-lockup-dark.svg', bg: '#141D35' });
console.log('ok');
