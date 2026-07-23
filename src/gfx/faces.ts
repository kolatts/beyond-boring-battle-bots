// CRT-screen faces drawn to canvas textures — dark screen, orange/cream
// features. Brilliant is delighted; Boring is aggressively unimpressed.

import * as THREE from 'three';

const SIZE = 128;

function makeCanvas(draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#161412';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const grad = ctx.createLinearGradient(0, 0, 0, SIZE);
  grad.addColorStop(0, 'rgba(255,255,255,0.07)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);
  draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  return tex;
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
  ctx.shadowColor = '#ff9a3c';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.restore();
}

/** Brilliant idle: starburst eyes + huge open smile. */
export function faceBrilliant(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    star(ctx, 40, 46, 17);
    star(ctx, 88, 46, 17);
    ctx.beginPath();
    ctx.arc(64, 76, 26, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#ff9a3c';
    ctx.fill();
    ctx.fillStyle = '#e8632c';
    ctx.beginPath();
    ctx.ellipse(64, 96, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** Brilliant firing: determined grin, angled brows. */
export function faceBrilliantAttack(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    ctx.strokeStyle = '#ffb040';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(28, 38); ctx.lineTo(52, 48); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(100, 38); ctx.lineTo(76, 48); ctx.stroke();
    star(ctx, 40, 58, 12);
    star(ctx, 88, 58, 12);
    ctx.beginPath();
    ctx.arc(64, 82, 20, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#ff9a3c';
    ctx.fill();
  });
}

/** Brilliant hurt: dizzy spiral eyes, wobbly frown. */
export function faceBrilliantHurt(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    ctx.strokeStyle = '#ffb040';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
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
  });
}

/** Brilliant KO: X X eyes, small o mouth. */
export function faceBrilliantKO(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    ctx.strokeStyle = '#ffb040';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    const X = (cx: number, cy: number) => {
      ctx.beginPath(); ctx.moveTo(cx - 11, cy - 11); ctx.lineTo(cx + 11, cy + 11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 11, cy - 11); ctx.lineTo(cx - 11, cy + 11); ctx.stroke();
    };
    X(40, 48);
    X(88, 48);
    ctx.beginPath();
    ctx.arc(64, 88, 9, 0, Math.PI * 2);
    ctx.stroke();
  });
}

/** Boring idle: half-lidded orange rectangles + flat mouth. Pure disdain. */
export function faceBoring(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    ctx.fillStyle = '#f5efe0';
    ctx.fillRect(26, 46, 26, 10);
    ctx.fillRect(76, 46, 26, 10);
    ctx.fillStyle = '#161412';
    ctx.fillRect(26, 42, 26, 8);
    ctx.fillStyle = '#e87722';
    ctx.fillRect(26, 44, 26, 4);
    ctx.fillRect(76, 44, 26, 4);
    ctx.fillStyle = '#161412';
    ctx.fillRect(76, 42, 26, 6);
    ctx.strokeStyle = '#e87722';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(46, 86); ctx.lineTo(82, 86); ctx.stroke();
  });
}

/** Boring firing: narrowed glare, mouth a clenched line of policy. */
export function faceBoringAttack(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    ctx.fillStyle = '#ff5a2c';
    ctx.fillRect(24, 48, 30, 7);
    ctx.fillRect(74, 48, 30, 7);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(22, 40); ctx.lineTo(56, 46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(106, 40); ctx.lineTo(72, 46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(44, 88); ctx.lineTo(84, 88); ctx.stroke();
  });
}

/** Boring hurt: eyes gone wide (a first), mouth a shocked wiggle. */
export function faceBoringHurt(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath(); ctx.arc(40, 48, 13, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(88, 48, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#161412';
    ctx.beginPath(); ctx.arc(42, 50, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(86, 50, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e87722';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(44, 88);
    ctx.quadraticCurveTo(51, 82, 58, 88);
    ctx.quadraticCurveTo(65, 94, 72, 88);
    ctx.quadraticCurveTo(79, 82, 84, 88);
    ctx.stroke();
  });
}

/** Boring KO: static + error glyphs. It has stopped filing. */
export function faceBoringKO(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    ctx.fillStyle = 'rgba(245,239,224,0.18)';
    for (let i = 0; i < 260; i++) {
      ctx.fillRect(Math.random() * SIZE, Math.random() * SIZE, 2, 2);
    }
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 22px Consolas, monospace';
    ctx.fillText('ERR', 46, 52);
    ctx.font = 'bold 12px Consolas, monospace';
    ctx.fillStyle = '#8a8578';
    ctx.fillText('FORM NOT FOUND', 12, 84);
  });
}

/** Boss face: the Change Advisory Board — three stern glyph-eyes, red. */
export function faceBoss(): THREE.CanvasTexture {
  return makeCanvas((ctx) => {
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(18, 44, 24, 9);
    ctx.fillRect(52, 44, 24, 9);
    ctx.fillRect(86, 44, 24, 9);
    ctx.fillStyle = '#161412';
    ctx.fillRect(18, 40, 24, 6);
    ctx.fillRect(52, 40, 24, 6);
    ctx.fillRect(86, 40, 24, 6);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(40, 90); ctx.lineTo(88, 90); ctx.stroke();
    ctx.font = 'bold 10px Consolas, monospace';
    ctx.fillStyle = '#8a8578';
    ctx.fillText('QUORUM PRESENT', 22, 112);
  });
}
