// CRT-screen faces drawn to canvas textures — dark screen, orange/cream
// features, phosphor glow, scanlines. Brilliant is delighted; Boring is
// aggressively unimpressed.

import * as THREE from 'three';

const SIZE = 256;
const S = SIZE / 128; // face features are authored in 128-space

function makeCanvas(draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d')!;

  // screen background: deep charcoal with a soft phosphor bloom center
  ctx.fillStyle = '#100e0c';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const bloom = ctx.createRadialGradient(SIZE / 2, SIZE / 2, SIZE * 0.1, SIZE / 2, SIZE / 2, SIZE * 0.75);
  bloom.addColorStop(0, 'rgba(255,154,60,0.10)');
  bloom.addColorStop(0.55, 'rgba(255,154,60,0.03)');
  bloom.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, SIZE, SIZE);
  // glass sheen from the top
  const sheen = ctx.createLinearGradient(0, 0, 0, SIZE);
  sheen.addColorStop(0, 'rgba(255,255,255,0.10)');
  sheen.addColorStop(0.35, 'rgba(255,255,255,0.02)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.save();
  ctx.scale(S, S);
  draw(ctx);
  ctx.restore();

  // scanlines over everything
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#000';
  for (let y = 0; y < SIZE; y += 4) ctx.fillRect(0, y, SIZE, 1.5);
  ctx.globalAlpha = 1;
  // corner vignette so the screen reads curved
  const vin = ctx.createRadialGradient(SIZE / 2, SIZE / 2, SIZE * 0.42, SIZE / 2, SIZE / 2, SIZE * 0.78);
  vin.addColorStop(0, 'rgba(0,0,0,0)');
  vin.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vin;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function glowOn(ctx: CanvasRenderingContext2D, color: string, blur = 14): void {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function glowOff(ctx: CanvasRenderingContext2D): void {
  ctx.shadowBlur = 0;
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const rad = i % 2 === 0 ? r : r * 0.38;
    ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffb040';
  glowOn(ctx, '#ff9a3c', 12);
  ctx.fill();
  // hot white core
  glowOff(ctx);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const rad = (i % 2 === 0 ? r : r * 0.38) * 0.45;
    ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = '#fff2dc';
  ctx.fill();
  ctx.restore();
}

/** Brilliant idle: starburst eyes + huge open smile. */
export function faceBrilliant(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    star(ctx, 40, 46, 17);
    star(ctx, 88, 46, 17);
    glowOn(ctx, '#ff9a3c', 10);
    ctx.beginPath();
    ctx.arc(64, 76, 26, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#ff9a3c';
    ctx.fill();
    glowOff(ctx);
    ctx.fillStyle = '#e8632c';
    ctx.beginPath();
    ctx.ellipse(64, 96, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // cheek blush ticks
    ctx.strokeStyle = 'rgba(255,154,60,0.5)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(18, 66); ctx.lineTo(26, 64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(110, 66); ctx.lineTo(102, 64); ctx.stroke();
  });
}

/** Brilliant firing: determined grin, angled brows, focused stars. */
export function faceBrilliantAttack(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    ctx.strokeStyle = '#ffb040';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    glowOn(ctx, '#ff9a3c', 8);
    ctx.beginPath(); ctx.moveTo(28, 36); ctx.lineTo(52, 46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(100, 36); ctx.lineTo(76, 46); ctx.stroke();
    glowOff(ctx);
    star(ctx, 40, 58, 13);
    star(ctx, 88, 58, 13);
    glowOn(ctx, '#ff9a3c', 10);
    ctx.beginPath();
    ctx.arc(64, 82, 20, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#ff9a3c';
    ctx.fill();
    glowOff(ctx);
  });
}

/** Brilliant hurt: dizzy spiral eyes, wobbly frown. */
export function faceBrilliantHurt(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    ctx.strokeStyle = '#ffb040';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    glowOn(ctx, '#ff9a3c', 8);
    const spiral = (cx: number, cy: number) => {
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 3.2; a += 0.2) {
        const r = 3 + a * 2.4;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    spiral(40, 48);
    spiral(88, 48);
    ctx.beginPath();
    ctx.moveTo(46, 92); ctx.quadraticCurveTo(55, 84, 64, 92);
    ctx.quadraticCurveTo(73, 100, 82, 92);
    ctx.stroke();
    glowOff(ctx);
    // sweat drop
    ctx.fillStyle = '#9ecbff';
    ctx.beginPath();
    ctx.moveTo(106, 28);
    ctx.quadraticCurveTo(112, 40, 106, 44);
    ctx.quadraticCurveTo(100, 40, 106, 28);
    ctx.fill();
  });
}

/** Brilliant KO: X X eyes, small o mouth. */
export function faceBrilliantKO(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    ctx.strokeStyle = '#ffb040';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    glowOn(ctx, '#ff9a3c', 6);
    const X = (cx: number, cy: number) => {
      ctx.beginPath(); ctx.moveTo(cx - 11, cy - 11); ctx.lineTo(cx + 11, cy + 11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 11, cy - 11); ctx.lineTo(cx - 11, cy + 11); ctx.stroke();
    };
    X(40, 48);
    X(88, 48);
    ctx.beginPath();
    ctx.arc(64, 88, 9, 0, Math.PI * 2);
    ctx.stroke();
    glowOff(ctx);
  });
}

/** Boring idle: half-lidded orange rectangles + flat mouth. Pure disdain. */
export function faceBoring(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    // eye whites (barely visible under the lids)
    glowOn(ctx, '#e87722', 6);
    ctx.fillStyle = '#f5efe0';
    ctx.fillRect(26, 46, 26, 10);
    ctx.fillRect(76, 46, 26, 10);
    glowOff(ctx);
    // heavy lids
    ctx.fillStyle = '#100e0c';
    ctx.fillRect(24, 38, 30, 8);
    ctx.fillRect(74, 38, 30, 8);
    glowOn(ctx, '#e87722', 5);
    ctx.fillStyle = '#e87722';
    ctx.fillRect(26, 44, 26, 3);
    ctx.fillRect(76, 44, 26, 3);
    ctx.strokeStyle = '#e87722';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(46, 86); ctx.lineTo(82, 86); ctx.stroke();
    glowOff(ctx);
  });
}

/** Boring firing: narrowed glare, mouth a clenched line of policy. */
export function faceBoringAttack(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    glowOn(ctx, '#ff5a2c', 10);
    ctx.fillStyle = '#ff5a2c';
    ctx.fillRect(24, 48, 30, 7);
    ctx.fillRect(74, 48, 30, 7);
    glowOff(ctx);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    glowOn(ctx, '#c0392b', 8);
    ctx.beginPath(); ctx.moveTo(22, 40); ctx.lineTo(56, 46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(106, 40); ctx.lineTo(72, 46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(44, 88); ctx.lineTo(84, 88); ctx.stroke();
    glowOff(ctx);
  });
}

/** Boring hurt: eyes gone wide (a first), mouth a shocked wiggle. */
export function faceBoringHurt(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    glowOn(ctx, '#f5efe0', 8);
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath(); ctx.arc(40, 48, 13, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(88, 48, 13, 0, Math.PI * 2); ctx.fill();
    glowOff(ctx);
    ctx.fillStyle = '#100e0c';
    ctx.beginPath(); ctx.arc(42, 50, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(86, 50, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e87722';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    glowOn(ctx, '#e87722', 6);
    ctx.beginPath();
    ctx.moveTo(44, 88);
    ctx.quadraticCurveTo(51, 82, 58, 88);
    ctx.quadraticCurveTo(65, 94, 72, 88);
    ctx.quadraticCurveTo(79, 82, 84, 88);
    ctx.stroke();
    glowOff(ctx);
  });
}

/** Boring KO: static + error glyphs. It has stopped filing. */
export function faceBoringKO(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    ctx.fillStyle = 'rgba(245,239,224,0.18)';
    for (let i = 0; i < 260; i++) {
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5);
    }
    glowOn(ctx, '#c0392b', 10);
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 22px Consolas, monospace';
    ctx.fillText('ERR', 46, 52);
    glowOff(ctx);
    ctx.font = 'bold 11px Consolas, monospace';
    ctx.fillStyle = '#8a8578';
    ctx.fillText('FORM NOT FOUND', 14, 84);
  });
}

/** Boss face: the Change Advisory Board — three stern glyph-eyes, red. */
export function faceBoss(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    glowOn(ctx, '#c0392b', 10);
    ctx.fillStyle = '#e04030';
    ctx.fillRect(18, 44, 24, 9);
    ctx.fillRect(52, 44, 24, 9);
    ctx.fillRect(86, 44, 24, 9);
    glowOff(ctx);
    ctx.fillStyle = '#100e0c';
    ctx.fillRect(16, 38, 28, 6);
    ctx.fillRect(50, 38, 28, 6);
    ctx.fillRect(84, 38, 28, 6);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    glowOn(ctx, '#c0392b', 8);
    ctx.beginPath(); ctx.moveTo(40, 90); ctx.lineTo(88, 90); ctx.stroke();
    glowOff(ctx);
    ctx.font = 'bold 9px Consolas, monospace';
    ctx.fillStyle = '#8a8578';
    ctx.fillText('QUORUM PRESENT', 26, 112);
  });
}
