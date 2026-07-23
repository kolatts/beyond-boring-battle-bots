// Voxel robot builders — everything is boxes, faithful to the art
// direction: CRT-screen heads, cream/charcoal bodies, orange bobble antennas.

import * as THREE from 'three';
import { C } from '../const';
import * as faces from './faces';

const box = (w: number, h: number, d: number, color: number, emissive = 0x000000) => {
  const mat = new THREE.MeshLambertMaterial({ color, emissive });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true;
  return m;
};

/** Head with a CRT screen face on the front (+z). */
function screenHead(w: number, h: number, d: number, shellColor: number, face: THREE.Texture): THREE.Group {
  const g = new THREE.Group();
  const shell = box(w, h, d, shellColor);
  g.add(shell);
  const screenMat = new THREE.MeshBasicMaterial({ map: face });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.82, h * 0.78), screenMat);
  screen.position.z = d / 2 + 0.012;
  screen.name = 'faceScreen';
  g.add(screen);
  // side "ear" caps
  const earL = box(0.06, h * 0.4, d * 0.4, C.grayDark);
  earL.position.x = -w / 2 - 0.03;
  const earR = earL.clone();
  earR.position.x = w / 2 + 0.03;
  g.add(earL, earR);
  return g;
}

function antenna(color: number, stemH = 0.16): THREE.Group {
  const g = new THREE.Group();
  const stem = box(0.05, stemH, 0.05, C.grayDark);
  stem.position.y = stemH / 2;
  const bobbleMat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.45 });
  const bobble = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), bobbleMat);
  bobble.position.y = stemH + 0.07;
  bobble.name = 'bobble';
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

/** BRILLIANT — cream shell, orange chest sigil, starburst CRT face. */
export function buildBrilliant(): RobotRig {
  const group = new THREE.Group();

  const legL = box(0.2, 0.34, 0.24, C.grayDark);
  const legR = legL.clone();
  legL.position.set(-0.15, 0.17, 0);
  legR.position.set(0.15, 0.17, 0);
  const footL = box(0.24, 0.1, 0.32, C.ink);
  footL.position.set(-0.15, 0.05, 0.03);
  const footR = footL.clone();
  footR.position.x = 0.15;

  const body = box(0.56, 0.42, 0.4, C.paper);
  body.position.y = 0.55;
  const sigil = new THREE.Mesh(
    new THREE.CircleGeometry(0.1, 16),
    new THREE.MeshBasicMaterial({ color: C.orange })
  );
  sigil.position.set(0, 0, 0.205);
  sigil.name = 'sigil';
  body.add(sigil);

  const armL = box(0.16, 0.4, 0.2, C.paperDim);
  const armR = armL.clone();
  armL.geometry = armL.geometry.clone();
  armR.geometry = armR.geometry.clone();
  armL.geometry.translate(0, -0.14, 0);
  armR.geometry.translate(0, -0.14, 0);
  armL.position.set(-0.38, 0.76, 0);
  armR.position.set(0.38, 0.76, 0);

  const head = screenHead(0.66, 0.5, 0.5, C.paper, faces.faceBrilliant());
  head.position.y = 1.05;
  const ant = antenna(C.orange);
  ant.position.set(0, 0.25, 0);
  head.add(ant);

  group.add(legL, legR, footL, footR, body, armL, armR, head);
  return rigOf(group, head, body, armL, armR, 0.62);
}

/** BORING — desaturated gray/beige, heavier frame, deadpan CRT face. */
export function buildBoring(): RobotRig {
  const group = new THREE.Group();

  const legL = box(0.24, 0.32, 0.28, C.boringShellDark);
  const legR = legL.clone();
  legL.position.set(-0.18, 0.16, 0);
  legR.position.set(0.18, 0.16, 0);

  const body = box(0.68, 0.48, 0.46, C.boringShell);
  body.position.y = 0.56;
  // a laminated badge where a heart would be
  const badge = box(0.16, 0.2, 0.02, C.paperDim);
  badge.position.set(0.14, 0.04, 0.24);
  badge.name = 'badge';
  const clip = box(0.06, 0.04, 0.03, C.grayDark);
  clip.position.set(0.14, 0.16, 0.24);
  body.add(badge, clip);

  const armL = box(0.18, 0.42, 0.22, C.boringShellDark);
  const armR = armL.clone();
  armL.geometry = armL.geometry.clone();
  armR.geometry = armR.geometry.clone();
  armL.geometry.translate(0, -0.15, 0);
  armR.geometry.translate(0, -0.15, 0);
  armL.position.set(-0.45, 0.78, 0);
  armR.position.set(0.45, 0.78, 0);

  const head = screenHead(0.72, 0.52, 0.52, C.beige, faces.faceBoring());
  head.position.y = 1.1;
  const ant = antenna(C.danger, 0.14);
  ant.position.set(0, 0.26, 0);
  head.add(ant);

  group.add(legL, legR, body, armL, armR, head);
  return rigOf(group, head, body, armL, armR, 0.64);
}

/** BOSS — Boring's Change Advisory Board form: Boring enthroned atop a
 *  conference-table dais flanked by faceless voting silhouettes. */
export function buildBoss(): RobotRig & { dais: THREE.Group } {
  const group = new THREE.Group();

  // dais: long table + silhouettes
  const dais = new THREE.Group();
  const table = box(2.6, 0.34, 0.9, 0x4a463e);
  table.position.y = 0.55;
  const skirt = box(2.6, 0.55, 0.7, 0x3a3730);
  skirt.position.y = 0.27;
  dais.add(table, skirt);
  const silMat = new THREE.MeshLambertMaterial({ color: 0x2c2a26 });
  for (const sx of [-1.0, -0.55, 0.55, 1.0]) {
    const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.26), silMat);
    sBody.position.set(sx, 0.95, -0.15);
    const sHead = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.22), silMat);
    sHead.position.set(sx, 1.35, -0.15);
    dais.add(sBody, sHead);
  }
  // stacked binders on the table
  for (const [bx, bh] of [[-1.15, 0.14], [1.2, 0.2], [0.8, 0.1]] as const) {
    const b = box(0.3, bh, 0.24, C.paperDim);
    b.position.set(bx, 0.72 + bh / 2, 0.2);
    b.rotation.y = bx;
    dais.add(b);
  }
  group.add(dais);

  // Boring's boss body, scaled up, centered behind/above the table
  const core = new THREE.Group();
  const body = box(0.9, 0.62, 0.56, C.boringShell);
  body.position.y = 1.35;
  const sash = box(0.94, 0.14, 0.58, C.danger);
  sash.position.y = 1.5;
  const gavel = new THREE.Group();
  const handle = box(0.06, 0.4, 0.06, C.grayDark);
  handle.position.y = -0.1;
  const headG = box(0.22, 0.12, 0.12, C.danger);
  headG.position.y = 0.12;
  gavel.add(handle, headG);
  gavel.position.set(0.68, 1.6, 0.1);
  gavel.rotation.z = -0.4;

  const armL = box(0.22, 0.5, 0.26, C.boringShellDark);
  const armR = armL.clone();
  armL.geometry = armL.geometry.clone();
  armR.geometry = armR.geometry.clone();
  armL.geometry.translate(0, -0.18, 0);
  armR.geometry.translate(0, -0.18, 0);
  armL.position.set(-0.58, 1.62, 0);
  armR.position.set(0.58, 1.62, 0);

  const head = screenHead(0.92, 0.66, 0.62, C.beige, faces.faceBoss());
  head.position.y = 2.05;
  const ant = antenna(C.danger, 0.2);
  ant.position.set(0, 0.33, 0);
  head.add(ant);
  const antL = antenna(C.danger, 0.12);
  antL.position.set(-0.3, 0.33, 0);
  const antR = antenna(C.danger, 0.12);
  antR.position.set(0.3, 0.33, 0);
  head.add(antL, antR);

  core.add(body, sash, armL, armR, head, gavel);
  group.add(core);

  const rig = rigOf(group, head, body, armL, armR, 1.4);
  return Object.assign(rig, { dais });
}
