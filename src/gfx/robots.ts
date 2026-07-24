// Voxel robot builders — cel-shaded boxes with sticker-style ink outlines,
// Puzzle-Fighter proportions: big CRT heads, squat bodies, chunky limbs.

import * as THREE from 'three';
import { C } from '../const';
import * as faces from './faces';

// ---- toon shading ------------------------------------------------------

let _gradient: THREE.DataTexture | null = null;
function gradientMap(): THREE.DataTexture {
  if (_gradient) return _gradient;
  const data = new Uint8Array([90, 150, 215, 255]);
  _gradient = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  _gradient.minFilter = THREE.NearestFilter;
  _gradient.magFilter = THREE.NearestFilter;
  _gradient.needsUpdate = true;
  return _gradient;
}

const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x14120f, side: THREE.BackSide });
const OUTLINE = 0.022; // absolute outline thickness, world units

function toon(color: number, emissive = 0x000000, emissiveIntensity = 1): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color, gradientMap: gradientMap(), emissive, emissiveIntensity,
  });
}

/** Box mesh with an ink outline hull (the sticker look). */
const box = (w: number, h: number, d: number, color: number, opts?: { emissive?: number; noOutline?: boolean }) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(color, opts?.emissive ?? 0x000000, 0.5));
  if (!opts?.noOutline) {
    const o = new THREE.Mesh(
      new THREE.BoxGeometry(w + OUTLINE * 2, h + OUTLINE * 2, d + OUTLINE * 2),
      OUTLINE_MAT
    );
    o.name = 'outline';
    m.add(o);
  }
  return m;
};

/** Shift a mesh's pivot (including its outline hull) — used for arm shoulders. */
function pivot(m: THREE.Mesh, dx: number, dy: number, dz: number): void {
  m.geometry.translate(dx, dy, dz);
  for (const child of m.children) {
    if (child instanceof THREE.Mesh && child.name === 'outline') child.geometry.translate(dx, dy, dz);
  }
}

// ---- shared parts ------------------------------------------------------

/** Head with a bezeled CRT screen face on the front (+z). */
function screenHead(
  w: number, h: number, d: number, shellColor: number, face: THREE.Texture,
  earColor: number = C.grayDark, earStyle: 'disc' | 'block' = 'disc'
): THREE.Group {
  const g = new THREE.Group();
  const shell = box(w, h, d, shellColor);
  g.add(shell);

  // recessed dark bezel, then the glowing screen
  const bezel = box(w * 0.88, h * 0.84, 0.03, 0x1b1815, { noOutline: true });
  bezel.position.z = d / 2 + 0.005;
  g.add(bezel);
  const screenMat = new THREE.MeshBasicMaterial({ map: face, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, h * 0.74), screenMat);
  screen.position.z = d / 2 + 0.024;
  screen.name = 'faceScreen';
  g.add(screen);

  // ear caps
  if (earStyle === 'disc') {
    const r = h * 0.2;
    const earGeo = new THREE.CylinderGeometry(r, r, 0.06, 16);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, toon(earColor));
      ear.rotation.z = Math.PI / 2;
      ear.position.x = side * (w / 2 + 0.028);
      const eo = new THREE.Mesh(new THREE.CylinderGeometry(r + OUTLINE, r + OUTLINE, 0.06 + OUTLINE * 2, 16), OUTLINE_MAT);
      ear.add(eo);
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.4, r * 0.4, 0.02, 12), toon(C.ink));
      dot.position.y = side * 0.04;
      ear.add(dot);
      g.add(ear);
    }
  } else {
    for (const side of [-1, 1]) {
      const ear = box(0.08, h * 0.5, d * 0.5, earColor);
      ear.position.x = side * (w / 2 + 0.04);
      g.add(ear);
    }
  }
  return g;
}

function antenna(color: number, stemH = 0.18, bobbleR = 0.1): THREE.Group {
  const g = new THREE.Group();
  const stem = box(0.05, stemH, 0.05, C.grayDark);
  stem.position.y = stemH / 2;
  const bobble = new THREE.Mesh(
    new THREE.SphereGeometry(bobbleR, 12, 10),
    toon(color, color, 0.75)
  );
  bobble.position.y = stemH + bobbleR * 0.8;
  bobble.name = 'bobble';
  const bo = new THREE.Mesh(new THREE.SphereGeometry(bobbleR + OUTLINE, 12, 10), OUTLINE_MAT);
  bobble.add(bo);
  g.add(stem, bobble);
  return g;
}

export interface RobotRig {
  group: THREE.Group;
  head: THREE.Group;
  body: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  faceScreen: THREE.Mesh;
  /** world-space chest height the beam fires from/lands at */
  chestY: number;
  setFace(tex: THREE.Texture): void;
}

function rigOf(group: THREE.Group, head: THREE.Group, body: THREE.Mesh, armL: THREE.Mesh, armR: THREE.Mesh, chestY: number): RobotRig {
  const faceScreen = head.getObjectByName('faceScreen') as THREE.Mesh;
  return {
    group, head, body, armL, armR, faceScreen, chestY,
    setFace(tex: THREE.Texture) {
      (faceScreen.material as THREE.MeshBasicMaterial).map = tex;
      (faceScreen.material as THREE.MeshBasicMaterial).needsUpdate = true;
    },
  };
}

// ---- BRILLIANT ---------------------------------------------------------

/** BRILLIANT — cream shell, orange play-sigil, starburst CRT face. */
export function buildBrilliant(): RobotRig {
  const group = new THREE.Group();

  // feet with orange toe caps
  for (const side of [-1, 1]) {
    const foot = box(0.26, 0.11, 0.36, C.ink);
    foot.position.set(side * 0.16, 0.055, 0.02);
    const toe = box(0.26, 0.06, 0.08, C.orange, { noOutline: true });
    toe.position.set(0, 0.01, 0.15);
    foot.add(toe);
    group.add(foot);
    const leg = box(0.17, 0.2, 0.2, C.grayDark);
    leg.position.set(side * 0.16, 0.24, 0);
    group.add(leg);
  }

  const hips = box(0.5, 0.15, 0.34, C.grayDark);
  hips.position.y = 0.4;
  group.add(hips);

  // torso: squat, cream, with a chest panel + glowing play-button sigil
  const body = box(0.6, 0.42, 0.42, C.paper);
  body.position.y = 0.66;
  const belt = box(0.62, 0.06, 0.44, C.orange, { noOutline: true });
  belt.position.y = -0.18;
  body.add(belt);
  const sigilRing = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 24), toon(C.orange, C.orange, 0.45));
  sigilRing.rotation.x = Math.PI / 2;
  sigilRing.position.set(0, 0.02, 0.215);
  const sigilRingO = new THREE.Mesh(new THREE.CylinderGeometry(0.13 + OUTLINE, 0.13 + OUTLINE, 0.03, 24), OUTLINE_MAT);
  sigilRing.add(sigilRingO);
  const tri = new THREE.Shape();
  tri.moveTo(-0.05, 0.06); tri.lineTo(-0.05, -0.06); tri.lineTo(0.07, 0); tri.closePath();
  const sigilTri = new THREE.Mesh(new THREE.ShapeGeometry(tri), new THREE.MeshBasicMaterial({ color: 0xfff2dc }));
  sigilTri.position.set(0, 0.02, 0.235);
  body.add(sigilRing, sigilTri);
  group.add(body);

  // arms: pivot at shoulder, mitt hands
  const mkArm = (side: number) => {
    const arm = box(0.15, 0.34, 0.19, C.paperDim);
    pivot(arm, 0, -0.12, 0);
    const hand = box(0.17, 0.14, 0.2, C.ink);
    hand.position.y = -0.3;
    arm.add(hand);
    arm.position.set(side * 0.4, 0.84, 0);
    const pad = box(0.2, 0.13, 0.26, C.paper);
    pad.position.set(side * 0.02, 0.02, 0);
    arm.add(pad);
    return arm;
  };
  const armL = mkArm(-1);
  const armR = mkArm(1);
  group.add(armL, armR);

  const neck = box(0.18, 0.09, 0.18, C.grayDark);
  neck.position.y = 0.9;
  group.add(neck);

  // the big head
  const head = screenHead(0.82, 0.6, 0.56, C.paper, faces.faceBrilliant(), C.orange, 'disc');
  head.position.y = 1.28;
  const ant = antenna(C.orange, 0.16, 0.1);
  ant.position.set(0, 0.3, 0);
  head.add(ant);
  group.add(head);

  return rigOf(group, head, body, armL, armR, 0.68);
}

// ---- BORING ------------------------------------------------------------

/** BORING — desaturated gray/beige, heavier frame, deadpan CRT face. */
export function buildBoring(): RobotRig {
  const group = new THREE.Group();

  for (const side of [-1, 1]) {
    const foot = box(0.3, 0.12, 0.38, C.ink);
    foot.position.set(side * 0.2, 0.06, 0.01);
    group.add(foot);
    const leg = box(0.24, 0.2, 0.26, C.boringShellDark);
    leg.position.set(side * 0.2, 0.25, 0);
    group.add(leg);
  }

  const skirt = box(0.68, 0.16, 0.46, C.boringShellDark);
  skirt.position.y = 0.42;
  group.add(skirt);

  // torso: filing-cabinet energy
  const body = box(0.76, 0.46, 0.5, C.boringShell);
  body.position.y = 0.7;
  for (let i = 0; i < 3; i++) {
    const vent = box(0.3, 0.025, 0.02, C.ink, { noOutline: true });
    vent.position.set(-0.16, 0.12 - i * 0.07, 0.255);
    body.add(vent);
  }
  // laminated badge + clip
  const badge = box(0.17, 0.22, 0.02, C.paperDim);
  badge.position.set(0.2, 0.0, 0.26);
  const clip = box(0.07, 0.04, 0.03, C.grayDark, { noOutline: true });
  clip.position.set(0.2, 0.13, 0.26);
  // pocket pens, for emergencies
  const pen1 = box(0.025, 0.11, 0.02, C.orange, { noOutline: true });
  pen1.position.set(-0.3, 0.14, 0.26);
  const pen2 = box(0.025, 0.11, 0.02, C.danger, { noOutline: true });
  pen2.position.set(-0.26, 0.13, 0.26);
  body.add(badge, clip, pen1, pen2);
  group.add(body);

  // shoulders + arms with clamp hands
  const mkArm = (side: number) => {
    const arm = box(0.19, 0.38, 0.23, C.boringShellDark);
    pivot(arm, 0, -0.13, 0);
    const hand = box(0.2, 0.15, 0.22, C.ink);
    hand.position.y = -0.33;
    arm.add(hand);
    arm.position.set(side * 0.51, 0.88, 0);
    return arm;
  };
  const armL = mkArm(-1);
  const armR = mkArm(1);
  for (const side of [-1, 1]) {
    const pad = box(0.26, 0.18, 0.32, C.boringShell);
    pad.position.set(side * 0.51, 0.97, 0);
    group.add(pad);
  }
  group.add(armL, armR);

  const neck = box(0.22, 0.09, 0.22, C.grayDark);
  neck.position.y = 0.96;
  group.add(neck);

  // heavy head with a brow ledge
  const head = screenHead(0.88, 0.62, 0.6, C.beige, faces.faceBoring(), C.boringShellDark, 'block');
  head.position.y = 1.35;
  const brow = box(0.92, 0.09, 0.64, C.boringShellDark);
  brow.position.y = 0.3;
  head.add(brow);
  const ant = antenna(C.danger, 0.14, 0.09);
  ant.position.set(0, 0.38, 0);
  head.add(ant);
  group.add(head);

  return rigOf(group, head, body, armL, armR, 0.72);
}

// ---- BOSS --------------------------------------------------------------

/** BOSS — Boring's Change Advisory Board form: Boring enthroned atop a
 *  conference-table dais flanked by faceless voting silhouettes. */
export function buildBoss(): RobotRig & { dais: THREE.Group } {
  const group = new THREE.Group();

  // dais: long table with a red runner + silhouettes with glowing eyes
  const dais = new THREE.Group();
  const table = box(2.8, 0.36, 0.95, 0x4a463e);
  table.position.y = 0.58;
  const runner = box(2.8, 0.03, 0.5, C.danger, { noOutline: true });
  runner.position.y = 0.78;
  const skirtF = box(2.8, 0.6, 0.75, 0x3a3730);
  skirtF.position.y = 0.29;
  dais.add(table, runner, skirtF);
  for (const sx of [-1.08, -0.6, 0.6, 1.08]) {
    const sBody = box(0.36, 0.52, 0.28, 0x26241f);
    sBody.position.set(sx, 1.0, -0.18);
    const sHead = box(0.28, 0.26, 0.24, 0x26241f);
    sHead.position.set(sx, 1.44, -0.18);
    for (const ex of [-0.06, 0.06]) {
      const eye = box(0.035, 0.02, 0.01, C.danger, { emissive: C.danger, noOutline: true });
      eye.position.set(ex, 0.02, 0.125);
      sHead.add(eye);
    }
    dais.add(sBody, sHead);
  }
  for (const [bx, bh] of [[-1.25, 0.16], [1.3, 0.22], [0.9, 0.12]] as const) {
    const b = box(0.32, bh, 0.26, C.paperDim);
    b.position.set(bx, 0.78 + bh / 2, 0.18);
    b.rotation.y = bx;
    dais.add(b);
  }
  group.add(dais);

  // Boring's boss core, scaled-up proportions
  const body = box(1.0, 0.66, 0.6, C.boringShell);
  body.position.y = 1.5;
  const sash = box(1.04, 0.16, 0.62, C.danger);
  sash.position.y = 1.62;
  for (let i = 0; i < 3; i++) {
    const vent = box(0.4, 0.03, 0.02, C.ink, { noOutline: true });
    vent.position.set(-0.2, 1.42 - i * 0.09, 0.31);
    group.add(vent);
  }

  const gavel = new THREE.Group();
  const handle = box(0.07, 0.44, 0.07, C.grayDark);
  handle.position.y = -0.1;
  const headG = box(0.26, 0.14, 0.14, C.danger);
  headG.position.y = 0.14;
  gavel.add(handle, headG);
  gavel.position.set(0.78, 1.78, 0.12);
  gavel.rotation.z = -0.4;

  const mkArm = (side: number) => {
    const arm = box(0.24, 0.54, 0.28, C.boringShellDark);
    pivot(arm, 0, -0.19, 0);
    const hand = box(0.26, 0.18, 0.28, C.ink);
    hand.position.y = -0.46;
    arm.add(hand);
    arm.position.set(side * 0.66, 1.76, 0);
    return arm;
  };
  const armL = mkArm(-1);
  const armR = mkArm(1);
  for (const side of [-1, 1]) {
    const pad = box(0.32, 0.22, 0.38, C.boringShell);
    pad.position.set(side * 0.66, 1.88, 0);
    group.add(pad);
  }

  const head = screenHead(1.06, 0.74, 0.68, C.beige, faces.faceBoss(), C.boringShellDark, 'block');
  head.position.y = 2.28;
  const brow = box(1.1, 0.1, 0.72, C.boringShellDark);
  brow.position.y = 0.36;
  head.add(brow);
  const ant = antenna(C.danger, 0.2, 0.11);
  ant.position.set(0, 0.44, 0);
  head.add(ant);
  const antL = antenna(C.danger, 0.12, 0.07);
  antL.position.set(-0.34, 0.44, 0);
  const antR = antenna(C.danger, 0.12, 0.07);
  antR.position.set(0.34, 0.44, 0);
  head.add(antL, antR);

  group.add(body, sash, armL, armR, head, gavel);

  const rig = rigOf(group, head, body, armL, armR, 1.55);
  return Object.assign(rig, { dais });
}
