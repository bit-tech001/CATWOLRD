import * as THREE from 'three';

export interface ProceduralTextureSet {
  tabbyBodyMap: THREE.CanvasTexture;
  tabbyHeadMap: THREE.CanvasTexture;
  catEyeMap: THREE.CanvasTexture;
  asphaltMap: THREE.CanvasTexture;
  sidewalkMap: THREE.CanvasTexture;
  parkPathMap: THREE.CanvasTexture;
  grassMap: THREE.CanvasTexture;
  cardboardMap: THREE.CanvasTexture;
  woodSlatMap: THREE.CanvasTexture;
  metalCanMap: THREE.CanvasTexture;
  brickMap: THREE.CanvasTexture;
  chaiSignMap: THREE.CanvasTexture;
  kiranaSignMap: THREE.CanvasTexture;
  bookSignMap: THREE.CanvasTexture;
  shutterMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function createTabbyBodyTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);

  // Base warm silver-taupe grey coat matching reference tabby photo
  const bg = ctx.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, '#78746f');
  bg.addColorStop(0.45, '#918d87');
  bg.addColorStop(0.75, '#b8b2a8');
  bg.addColorStop(1, '#dfd8cd');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 512);

  // Dark mackerel tabby stripes across flanks & back
  ctx.strokeStyle = 'rgba(54, 51, 49, 0.55)';
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const x = 36 + i * 34;
    ctx.lineWidth = 10 + (i % 3) * 4;
    ctx.beginPath();
    ctx.moveTo(x, 12);
    ctx.bezierCurveTo(x - 16, 130, x + 18, 220, x - 6, 330);
    ctx.stroke();
  }

  // Dorsal spine stripe
  const spineGrad = ctx.createLinearGradient(0, 0, 0, 90);
  spineGrad.addColorStop(0, 'rgba(48, 45, 43, 0.72)');
  spineGrad.addColorStop(1, 'rgba(48, 45, 43, 0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(0, 0, 512, 90);

  // Fine fur hair strokes for tactile plush look
  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const bright = Math.random() > 0.5;
    ctx.strokeStyle = bright
      ? `rgba(230, 224, 214, ${0.07 + Math.random() * 0.12})`
      : `rgba(45, 42, 40, ${0.06 + Math.random() * 0.12})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 4, y + 7 + Math.random() * 6);
    ctx.stroke();
  }

  return finalizeColorTexture(canvas, maxAnisotropy);
}

function createTabbyHeadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);

  // Base warm grey coat
  ctx.fillStyle = '#8b867f';
  ctx.fillRect(0, 0, 512, 512);

  // Crown & forehead subtle darker shading
  const crown = ctx.createRadialGradient(256, 120, 30, 256, 170, 240);
  crown.addColorStop(0, 'rgba(72, 68, 65, 0.45)');
  crown.addColorStop(1, 'rgba(139, 134, 127, 0)');
  ctx.fillStyle = crown;
  ctx.fillRect(0, 0, 512, 512);

  // Signature Tabby "M" on forehead (mapped to front-top of sphere)
  ctx.strokeStyle = 'rgba(50, 46, 44, 0.72)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(212, 175);
  ctx.lineTo(226, 118);
  ctx.lineTo(256, 152);
  ctx.lineTo(286, 118);
  ctx.lineTo(300, 175);
  ctx.stroke();

  // Cheek swirls
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(155, 255);
  ctx.quadraticCurveTo(185, 275, 210, 280);
  ctx.moveTo(357, 255);
  ctx.quadraticCurveTo(327, 275, 302, 280);
  ctx.stroke();

  // Soft fur texture noise
  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.strokeStyle =
      Math.random() > 0.5 ? 'rgba(225,220,210,0.1)' : 'rgba(42,40,38,0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, y + 6);
    ctx.stroke();
  }

  return finalizeColorTexture(canvas, maxAnisotropy);
}

function createCatEyeTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#1b1208';
  ctx.fillRect(0, 0, 256, 256);

  // Rich copper-amber iris matching the reference cat
  const iris = ctx.createRadialGradient(128, 128, 28, 128, 128, 118);
  iris.addColorStop(0, '#f4b342');
  iris.addColorStop(0.45, '#d68222');
  iris.addColorStop(0.82, '#8b4912');
  iris.addColorStop(1, '#20130a');
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.fill();

  // Radial iris striations
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 214, 120, 0.25)' : 'rgba(92, 42, 6, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 44, 128 + Math.sin(a) * 44);
    ctx.lineTo(128 + Math.cos(a) * 108, 128 + Math.sin(a) * 108);
    ctx.stroke();
  }

  // Deep round black pupil (wide curious look from photo)
  ctx.fillStyle = '#070709';
  ctx.beginPath();
  ctx.ellipse(128, 128, 56, 66, 0, 0, Math.PI * 2);
  ctx.fill();

  // Crisp studio catchlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.beginPath();
  ctx.arc(96, 94, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(154, 158, 7, 0, Math.PI * 2);
  ctx.fill();

  return finalizeColorTexture(canvas, maxAnisotropy);
}

function createAsphaltTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#33373d';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 12000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 42 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Subtle asphalt wear streaks
  ctx.fillStyle = 'rgba(20, 22, 26, 0.14)';
  ctx.fillRect(0, 90, 512, 60);
  ctx.fillRect(0, 360, 512, 60);

  return finalizeColorTexture(canvas, maxAnisotropy, 4, 18);
}

function createSidewalkTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#b9b4aa';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle tile variation
  const tileSize = 128;
  for (let gx = 0; gx < 4; gx++) {
    for (let gy = 0; gy < 4; gy++) {
      const shade = 176 + Math.floor(Math.random() * 18);
      ctx.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade - 10})`;
      ctx.fillRect(gx * tileSize + 3, gy * tileSize + 3, tileSize - 6, tileSize - 6);
    }
  }

  // Concrete grain
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(60,55,48,0.08)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Expansion seams
  ctx.strokeStyle = 'rgba(85, 80, 74, 0.55)';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 4; i++) {
    const p = i * tileSize;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(512, p);
    ctx.stroke();
  }

  return finalizeColorTexture(canvas, maxAnisotropy, 16, 16);
}

function createParkPathTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#8e8476';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const cols = 4;
  const w = 512 / cols;
  const h = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (w * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * w + offset;
      const y = r * h;
      const warm = 152 + Math.floor(Math.random() * 26);
      ctx.fillStyle = `rgb(${warm}, ${warm - 10}, ${warm - 24})`;
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, w - 6, h - 6, 8);
      ctx.fill();
    }
  }

  return finalizeColorTexture(canvas, maxAnisotropy, 6, 6);
}

function createGrassTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#557d44';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const g = 105 + Math.floor(Math.random() * 48);
    ctx.fillStyle = `rgb(${Math.floor(g * 0.62)}, ${g}, ${Math.floor(g * 0.48)})`;
    ctx.fillRect(x, y, 2, 5);
  }

  return finalizeColorTexture(canvas, maxAnisotropy, 12, 12);
}

function createCardboardTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#b98d5c';
  ctx.fillRect(0, 0, 512, 512);

  // Corrugated horizontal ribs
  for (let y = 0; y < 512; y += 6) {
    ctx.fillStyle = y % 12 === 0 ? 'rgba(92, 62, 32, 0.08)' : 'rgba(235, 200, 155, 0.08)';
    ctx.fillRect(0, y, 512, 3);
  }

  // Kraft paper flecks
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(80,55,30,0.12)' : 'rgba(240,210,170,0.09)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  // Packing tape stripe
  ctx.fillStyle = 'rgba(218, 190, 146, 0.8)';
  ctx.fillRect(216, 0, 80, 512);

  // Shipping label
  ctx.fillStyle = '#f5f1e8';
  ctx.fillRect(58, 96, 130, 92);
  ctx.fillStyle = '#2c2c2c';
  for (let b = 0; b < 18; b++) {
    ctx.fillRect(70 + b * 6, 144, b % 3 === 0 ? 4 : 2, 30);
  }
  ctx.fillStyle = '#9b3a2e';
  ctx.fillRect(70, 110, 80, 12);

  return finalizeColorTexture(canvas, maxAnisotropy);
}

function createWoodSlatTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#8b5d38';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 3) {
    const delta = Math.sin(y * 0.09) * 14 + (Math.random() - 0.5) * 10;
    const r = Math.min(255, Math.max(0, 140 + delta));
    const g = Math.min(255, Math.max(0, 93 + delta * 0.7));
    const b = Math.min(255, Math.max(0, 56 + delta * 0.5));
    ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
    ctx.fillRect(0, y, 512, 3);
  }

  return finalizeColorTexture(canvas, maxAnisotropy);
}

function createMetalCanTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#8e969e';
  ctx.fillRect(0, 0, 512, 512);

  // Vertical ribbed grooves of classic city trash can
  for (let x = 0; x < 512; x += 24) {
    const grad = ctx.createLinearGradient(x, 0, x + 24, 0);
    grad.addColorStop(0, '#6e757d');
    grad.addColorStop(0.45, '#b2bac2');
    grad.addColorStop(1, '#6e757d');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, 24, 512);
  }

  // Subtle urban wear smudges
  for (let i = 0; i < 1500; i++) {
    ctx.fillStyle = 'rgba(40, 44, 48, 0.08)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 6, 3);
  }

  return finalizeColorTexture(canvas, maxAnisotropy);
}

function createBrickTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#c8bfb2'; // Mortar
  ctx.fillRect(0, 0, 512, 512);

  const rows = 16;
  const cols = 8;
  const bw = 512 / cols;
  const bh = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (bw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const tone = 148 + Math.floor(Math.random() * 32);
      ctx.fillStyle = `rgb(${tone}, ${Math.floor(tone * 0.48)}, ${Math.floor(tone * 0.36)})`;
      ctx.fillRect(c * bw + offset + 2, r * bh + 2, bw - 4, bh - 4);
    }
  }

  return finalizeColorTexture(canvas, maxAnisotropy, 3, 3);
}

function createIndianShopSign(
  maxAnisotropy: number,
  bgColor: string,
  borderColor: string,
  title: string,
  subtitle: string,
  textColor: string,
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 160);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 140);

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(title, 256, 76);

  ctx.font = '600 24px sans-serif';
  ctx.fillStyle = borderColor;
  ctx.fillText(subtitle, 256, 122);

  return finalizeColorTexture(canvas, maxAnisotropy);
}

function createShutterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#5c6670';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 16) {
    const grad = ctx.createLinearGradient(0, y, 0, y + 16);
    grad.addColorStop(0, '#444c54');
    grad.addColorStop(0.5, '#7e8994');
    grad.addColorStop(1, '#3c434a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, 256, 16);
  }
  return finalizeColorTexture(canvas, maxAnisotropy);
}

function createContactShadowTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, 'rgba(10, 14, 22, 0.72)');
  grad.addColorStop(0.5, 'rgba(10, 14, 22, 0.32)');
  grad.addColorStop(1, 'rgba(10, 14, 22, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(renderer: THREE.WebGLRenderer): ProceduralTextureSet {
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const tabbyBodyMap = createTabbyBodyTexture(maxAniso);
  const tabbyHeadMap = createTabbyHeadTexture(maxAniso);
  const catEyeMap = createCatEyeTexture(maxAniso);
  const asphaltMap = createAsphaltTexture(maxAniso);
  const sidewalkMap = createSidewalkTexture(maxAniso);
  const parkPathMap = createParkPathTexture(maxAniso);
  const grassMap = createGrassTexture(maxAniso);
  const cardboardMap = createCardboardTexture(maxAniso);
  const woodSlatMap = createWoodSlatTexture(maxAniso);
  const metalCanMap = createMetalCanTexture(maxAniso);
  const brickMap = createBrickTexture(maxAniso);
  const chaiSignMap = createIndianShopSign(
    maxAniso,
    '#b52b27',
    '#f8c94c',
    'शर्मा चाय & नाश्ता',
    'SHARMA CHAI TAPRI · KULHAD TEA',
    '#fff8eb',
  );
  const kiranaSignMap = createIndianShopSign(
    maxAniso,
    '#145a46',
    '#f6d365',
    'गुप्ता किराना स्टोर',
    'GUPTA KIRANA & GENERAL STORE',
    '#ffffff',
  );
  const bookSignMap = createIndianShopSign(
    maxAniso,
    '#1e3a6d',
    '#f5b041',
    'पुस्तक भंडार',
    'PUSTAK BHANDAR · BOOKS & STATIONERY',
    '#fffdf7',
  );
  const shutterMap = createShutterTexture(maxAniso);
  const contactShadowMap = createContactShadowTexture(maxAniso);

  const all = [
    tabbyBodyMap,
    tabbyHeadMap,
    catEyeMap,
    asphaltMap,
    sidewalkMap,
    parkPathMap,
    grassMap,
    cardboardMap,
    woodSlatMap,
    metalCanMap,
    brickMap,
    chaiSignMap,
    kiranaSignMap,
    bookSignMap,
    shutterMap,
    contactShadowMap,
  ];

  return {
    tabbyBodyMap,
    tabbyHeadMap,
    catEyeMap,
    asphaltMap,
    sidewalkMap,
    parkPathMap,
    grassMap,
    cardboardMap,
    woodSlatMap,
    metalCanMap,
    brickMap,
    chaiSignMap,
    kiranaSignMap,
    bookSignMap,
    shutterMap,
    contactShadowMap,
    dispose: () => {
      all.forEach((t) => t.dispose());
    },
  };
}
