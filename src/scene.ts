// The Street Fighter stage: two cel-shaded voxel robots at eye line in a
// purgatorial office arena — spotlight floor, cubicle silhouettes,
// fluorescent fixtures, drifting dust, glowing beams, and a terminal
// shower of TPS reports.

import * as THREE from 'three';
import { C } from './const';
import { buildBrilliant, buildBoring, buildBoss, type RobotRig } from './gfx/robots';
import * as faces from './gfx/faces';

export type Fighter = 'brilliant' | 'boring';
type Anim = { kind: 'idle' } | { kind: 'attack'; t: number } | { kind: 'hit'; t: number } | { kind: 'ko'; t: number };

const ATTACK_TIME = 0.9;
const HIT_TIME = 0.6;
// 3/4 stance: mostly facing each other, angled a touch toward camera
const STANCE = 0.42;
const BRILLIANT_ROT = Math.PI / 2 - STANCE;
const BORING_ROT = -Math.PI / 2 + STANCE;

interface Paper { mesh: THREE.Mesh; vel: THREE.Vector3; spin: THREE.Vector3; }
interface Spark { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; }

function radialTexture(inner: string, outer: string, size = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function floorTexture(): THREE.CanvasTexture {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#615d54';
  ctx.fillRect(0, 0, size, size);
  // carpet-tile grid
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 3;
  const tile = size / 16;
  for (let i = 0; i <= 16; i++) {
    ctx.beginPath(); ctx.moveTo(i * tile, 0); ctx.lineTo(i * tile, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * tile); ctx.lineTo(size, i * tile); ctx.stroke();
  }
  // per-tile tonal variation (institutional carpet has moods)
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.045})`;
      ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }
  // arena spotlight pool in the center
  const spot = ctx.createRadialGradient(size / 2, size / 2, size * 0.06, size / 2, size / 2, size * 0.52);
  spot.addColorStop(0, 'rgba(255,240,210,0.30)');
  spot.addColorStop(0.6, 'rgba(255,240,210,0.08)');
  spot.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function wallTexture(): THREE.CanvasTexture {
  const w = 1024, h = 256;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#26241f');
  g.addColorStop(0.55, '#3b3833');
  g.addColorStop(1, '#4a463e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // one warm window, far off-center — hope, at a distance
  const win = ctx.createLinearGradient(0, 0, 0, h);
  win.addColorStop(0, 'rgba(255,180,90,0)');
  win.addColorStop(0.5, 'rgba(255,180,90,0.55)');
  win.addColorStop(1, 'rgba(255,180,90,0)');
  ctx.fillStyle = win;
  ctx.fillRect(w * 0.78, h * 0.18, w * 0.055, h * 0.5);
  ctx.fillStyle = 'rgba(22,20,18,0.9)';
  ctx.fillRect(w * 0.805, h * 0.18, 4, h * 0.5);
  ctx.fillRect(w * 0.78, h * 0.42, w * 0.055, 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class BattleScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private brilliant: RobotRig;
  private boring!: RobotRig;
  private bossMode = false;
  private anims: Record<Fighter, Anim> = { brilliant: { kind: 'idle' }, boring: { kind: 'idle' } };
  private beam: THREE.Mesh | null = null;
  private beamGlow: THREE.Mesh | null = null;
  private beamLife = 0;
  private flash: THREE.Mesh | null = null;
  private sparks: Spark[] = [];
  private shake = 0;
  private papers: Paper[] = [];
  private dust!: THREE.Points;
  private shadowB!: THREE.Mesh;
  private shadowO!: THREE.Mesh;
  private clock = new THREE.Clock();
  private t = 0;
  private spread = 2.1;
  private lookY = 1.0;
  private brilliantFaces = {
    idle: faces.faceBrilliant(), attack: faces.faceBrilliantAttack(),
    hurt: faces.faceBrilliantHurt(), ko: faces.faceBrilliantKO(),
  };
  private boringFaces = {
    idle: faces.faceBoring(), attack: faces.faceBoringAttack(),
    hurt: faces.faceBoringHurt(), ko: faces.faceBoringKO(),
  };
  private bossFace = faces.faceBoss();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.scene.background = new THREE.Color(0x211f1c);
    this.scene.fog = new THREE.Fog(0x211f1c, 10, 22);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    this.camera.position.set(0, 1.25, 5.6);
    this.camera.lookAt(0, 1.0, 0);

    // lighting: soft hemisphere + warm key + orange rim + cool fill
    const hemi = new THREE.HemisphereLight(0xf4f7ec, 0x44413a, 1.05);
    const key = new THREE.DirectionalLight(0xfff0dc, 1.35);
    key.position.set(-2, 7, 6);
    const rim = new THREE.DirectionalLight(0xff9a3c, 0.5);
    rim.position.set(5, 3, -4);
    const fill = new THREE.DirectionalLight(0x8ea0b8, 0.25);
    fill.position.set(3, 2, 5);
    this.scene.add(hemi, key, rim, fill);

    // floor: carpet tiles with an arena spotlight pool
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 26),
      new THREE.MeshLambertMaterial({ map: floorTexture() })
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // back wall gradient with one warm window
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 11),
      new THREE.MeshBasicMaterial({ map: wallTexture(), fog: true })
    );
    wall.position.set(0, 5.5, -7);
    this.scene.add(wall);

    // cubicle silhouettes: two rows of grim rectangles
    const cubMat = new THREE.MeshLambertMaterial({ color: 0x34312b });
    const cubMat2 = new THREE.MeshLambertMaterial({ color: 0x2b2925 });
    for (let i = -6; i <= 6; i++) {
      if (Math.abs(i) < 2) continue; // leave the arena center open
      const cub = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1 + (Math.abs(i * 7) % 3) * 0.15, 1.0), cubMat);
      cub.position.set(i * 1.75 + 0.4, 0.55, -4.6);
      this.scene.add(cub);
      const mon = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.08), cubMat2);
      mon.position.set(i * 1.75 + 0.4, 1.35, -4.6);
      this.scene.add(mon);
    }
    // far row, just shapes in the gloom
    for (let i = -5; i <= 5; i++) {
      const cub = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 1.0), cubMat2);
      cub.position.set(i * 2.6 + 1.2, 0.7, -6.2);
      this.scene.add(cub);
    }

    // hanging fluorescent fixtures with faint light cones
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff4dc, transparent: true, opacity: 0.05, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false,
    });
    for (const x of [-2.4, 0, 2.4]) {
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.09, 0.4),
        new THREE.MeshBasicMaterial({ color: 0xf4f7ec })
      );
      fixture.position.set(x, 4.35, -1.2);
      const stem1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.8, 0.03), cubMat);
      stem1.position.set(x - 0.6, 4.8, -1.2);
      const stem2 = stem1.clone();
      stem2.position.x = x + 0.6;
      this.scene.add(fixture, stem1, stem2);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.7, 3.6, 4, 1, true), coneMat);
      cone.rotation.y = Math.PI / 4;
      cone.position.set(x, 2.6, -1.2);
      this.scene.add(cone);
    }

    // drifting dust motes
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(70 * 3);
    for (let i = 0; i < 70; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 10;
      dustPos[i * 3 + 1] = Math.random() * 4.2;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    this.dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0xd8d2c2, size: 0.02, transparent: true, opacity: 0.5, depthWrite: false,
    }));
    this.scene.add(this.dust);

    // soft contact shadows under each fighter
    const shadowTex = radialTexture('rgba(0,0,0,0.42)', 'rgba(0,0,0,0)');
    const mkShadow = () => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1.7, 1.0),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.015;
      this.scene.add(m);
      return m;
    };
    this.shadowB = mkShadow();
    this.shadowO = mkShadow();

    this.brilliant = buildBrilliant();
    this.brilliant.group.position.x = -this.spread;
    this.brilliant.group.rotation.y = BRILLIANT_ROT;
    this.scene.add(this.brilliant.group);

    this.spawnBoring(false);
    this.resize();
    addEventListener('resize', () => this.resize());
    this.renderer.setAnimationLoop(() => this.tick());
  }

  private resize(): void {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false); // CSS keeps the canvas full-screen
    const aspect = w / h;
    this.camera.aspect = aspect;
    const portrait = aspect < 0.85;
    // narrow screens: fighters step closer, lens widens, and the camera
    // tilts down so the robots sit in the strip above the question card
    this.camera.fov = portrait ? 55 : 42;
    this.spread = portrait ? Math.max(0.95, aspect * 2.1) : 2.1;
    this.brilliant.group.position.x = -this.spread;
    if (this.boring) this.boring.group.position.x = this.spread;
    const vFov = (this.camera.fov * Math.PI) / 180;
    const halfW = this.spread + (portrait ? 0.9 : 1.15);
    const zForWidth = halfW / (Math.tan(vFov / 2) * aspect);
    this.camera.position.z = Math.max(portrait ? 4.0 : 5.2, zForWidth);
    this.camera.updateProjectionMatrix();
    this.lookY = portrait ? 0.55 : 1.0;
    this.camera.lookAt(0, this.lookY, 0);
  }

  /** Swap in the normal or boss form of Boring. */
  spawnBoring(boss: boolean): void {
    if (this.boring) this.scene.remove(this.boring.group);
    this.bossMode = boss;
    this.boring = boss ? buildBoss() : buildBoring();
    this.boring.group.position.x = this.spread;
    this.boring.group.rotation.y = BORING_ROT;
    this.scene.add(this.boring.group);
    this.anims.boring = { kind: 'idle' };
    this.setFace('boring', 'idle');
    this.shadowO.scale.setScalar(boss ? 2.1 : 1);
  }

  private rig(f: Fighter): RobotRig { return f === 'brilliant' ? this.brilliant : this.boring; }

  private setFace(f: Fighter, which: 'idle' | 'attack' | 'hurt' | 'ko'): void {
    if (f === 'boring' && this.bossMode && which === 'idle') {
      this.boring.setFace(this.bossFace);
      return;
    }
    const set = f === 'brilliant' ? this.brilliantFaces : this.boringFaces;
    this.rig(f).setFace(set[which]);
  }

  /** attacker fires the Beam of Soul-Crushing Monotony at the other robot. */
  fireBeam(attacker: Fighter, onImpact?: () => void): void {
    this.anims[attacker] = { kind: 'attack', t: 0 };
    this.setFace(attacker, 'attack');
    const defender: Fighter = attacker === 'brilliant' ? 'boring' : 'brilliant';
    const windup = this.bossMode && attacker === 'boring' ? 0.45 : 0.35;
    setTimeout(() => {
      this.spawnBeam(attacker);
      setTimeout(() => {
        this.anims[defender] = { kind: 'hit', t: 0 };
        this.setFace(defender, 'hurt');
        this.shake = this.bossMode ? 0.5 : 0.32;
        this.spawnSparks(defender, attacker === 'brilliant' ? C.orangeBright : (this.bossMode ? C.danger : 0xd8d2c2));
        onImpact?.();
        setTimeout(() => {
          if (this.anims[defender].kind === 'hit') {
            this.anims[defender] = { kind: 'idle' };
            this.setFace(defender, 'idle');
          }
          if (this.anims[attacker].kind === 'attack') {
            this.anims[attacker] = { kind: 'idle' };
            this.setFace(attacker, 'idle');
          }
        }, HIT_TIME * 1000);
      }, 180);
    }, windup * 1000);
  }

  private spawnBeam(attacker: Fighter): void {
    const from = this.rig(attacker);
    const to = this.rig(attacker === 'brilliant' ? 'boring' : 'brilliant');
    const y0 = from.chestY, y1 = to.chestY;
    const x0 = from.group.position.x, x1 = to.group.position.x;
    const len = Math.abs(x1 - x0) - 0.4;
    const thick = this.bossMode && attacker === 'boring' ? 0.3 : 0.16;
    const color = attacker === 'brilliant' ? C.orangeBright : (this.bossMode ? 0xe04030 : 0xcfc9b8);

    const mid = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, 0);
    const rotZ = Math.atan2(y1 - y0, x1 - x0);

    // hot core
    this.beam = new THREE.Mesh(
      new THREE.BoxGeometry(len, thick, thick),
      new THREE.MeshBasicMaterial({ color: 0xfff2dc, transparent: true, opacity: 1 })
    );
    this.beam.position.copy(mid);
    this.beam.rotation.z = rotZ;
    // outer glow sleeve
    this.beamGlow = new THREE.Mesh(
      new THREE.BoxGeometry(len, thick * 2.6, thick * 2.6),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.45,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    this.beamGlow.position.copy(mid);
    this.beamGlow.rotation.z = rotZ;
    this.scene.add(this.beam, this.beamGlow);
    this.beamLife = 0.5;

    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xfff4e0, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.flash = new THREE.Mesh(new THREE.SphereGeometry(thick * 2.2, 12, 10), flashMat);
    this.flash.position.set(x1 + (x0 > x1 ? 0.4 : -0.4), y1, 0);
    this.scene.add(this.flash);
  }

  private spawnSparks(at: Fighter, color: number): void {
    const rig = this.rig(at);
    const origin = new THREE.Vector3(rig.group.position.x, rig.chestY, 0.1);
    const away = at === 'boring' ? 1 : -1;
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.025, 0.025),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
      );
      s.position.copy(origin);
      const ang = (Math.random() - 0.5) * 1.6;
      const speed = 2 + Math.random() * 3;
      this.sparks.push({
        mesh: s,
        vel: new THREE.Vector3(Math.cos(ang) * speed * away, Math.sin(ang) * speed + 1, (Math.random() - 0.5) * 2),
        life: 0.5 + Math.random() * 0.25,
      });
      s.rotation.z = ang;
      this.scene.add(s);
    }
  }

  /** Boring collapses into a shower of TPS reports. */
  defeatCutscene(): void {
    this.anims.boring = { kind: 'ko', t: 0 };
    this.setFace('boring', 'ko');
    this.shake = 0.6;
    const origin = this.boring.group.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const paperGeo = new THREE.BoxGeometry(0.22, 0.005, 0.3);
    for (let i = 0; i < 90; i++) {
      const mat = new THREE.MeshLambertMaterial({
        color: [C.paper, C.paperDim, 0xcfc9b8][i % 3],
      });
      const p = new THREE.Mesh(paperGeo, mat);
      p.position.copy(origin).add(new THREE.Vector3(
        (Math.random() - 0.5) * 1.2, Math.random() * 1.4, (Math.random() - 0.5) * 1.2
      ));
      this.papers.push({
        mesh: p,
        vel: new THREE.Vector3((Math.random() - 0.5) * 2.4, 1.5 + Math.random() * 2.5, (Math.random() - 0.5) * 2.4),
        spin: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      });
      this.scene.add(p);
    }
  }

  koBrilliant(): void {
    this.anims.brilliant = { kind: 'ko', t: 0 };
    this.setFace('brilliant', 'ko');
  }

  reset(): void {
    this.anims = { brilliant: { kind: 'idle' }, boring: { kind: 'idle' } };
    this.setFace('brilliant', 'idle');
    this.setFace('boring', 'idle');
    this.brilliant.group.rotation.set(0, BRILLIANT_ROT, 0);
    this.boring.group.rotation.set(0, BORING_ROT, 0);
    for (const p of this.papers) this.scene.remove(p.mesh);
    this.papers = [];
    for (const s of this.sparks) this.scene.remove(s.mesh);
    this.sparks = [];
  }

  private tick(): void {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.t += dt;

    for (const f of ['brilliant', 'boring'] as Fighter[]) {
      const rig = this.rig(f);
      const anim = this.anims[f];
      const dir = f === 'brilliant' ? 1 : -1; // +x for brilliant's forward
      const baseRotY = f === 'brilliant' ? BRILLIANT_ROT : BORING_ROT;
      const phase = f === 'boring' ? Math.PI : 0;

      if (anim.kind === 'idle') {
        rig.group.position.y = Math.sin(this.t * 2.2 + phase) * 0.035;
        rig.group.rotation.z = 0;
        rig.group.rotation.y = baseRotY + Math.sin(this.t * 0.9 + phase) * 0.02;
        rig.armL.rotation.x = Math.sin(this.t * 2.2 + phase) * 0.09;
        rig.armR.rotation.x = -Math.sin(this.t * 2.2 + phase) * 0.09;
        rig.head.rotation.z = Math.sin(this.t * 1.1 + phase) * 0.035;
        rig.head.position.y += 0; // head bob rides the group
      } else if (anim.kind === 'attack') {
        anim.t += dt;
        const k = anim.t / ATTACK_TIME;
        // anticipation: crouch + lean back, then lunge with arm extended
        const lean = k < 0.4 ? -0.55 * (k / 0.4) : -0.55 + 1.0 * Math.min((k - 0.4) / 0.3, 1);
        rig.group.rotation.z = dir * lean * 0.3;
        rig.group.position.y = k < 0.4 ? -0.05 * (k / 0.4) : 0.02;
        rig.armR.rotation.x = k < 0.4 ? 0.6 : -1.5;
        rig.armL.rotation.x = k < 0.4 ? 0.3 : 0.5;
        if (k >= 1) { this.anims[f] = { kind: 'idle' }; this.setFace(f, 'idle'); }
      } else if (anim.kind === 'hit') {
        anim.t += dt;
        const k = anim.t / HIT_TIME;
        rig.group.rotation.z = -dir * 0.35 * Math.sin(Math.min(k, 1) * Math.PI);
        rig.group.position.y = 0.05 * Math.sin(Math.min(k, 1) * Math.PI * 3);
        rig.armL.rotation.x = 0.5 * Math.sin(Math.min(k, 1) * Math.PI);
        rig.armR.rotation.x = 0.5 * Math.sin(Math.min(k, 1) * Math.PI);
      } else if (anim.kind === 'ko') {
        anim.t += dt;
        const k = Math.min(anim.t / 1.1, 1);
        const e = 1 - (1 - k) * (1 - k);
        rig.group.rotation.z = -dir * e * (Math.PI / 2 - 0.35);
        rig.group.position.y = -e * 0.15;
        if (f === 'boring' && this.bossMode) rig.group.rotation.z = -dir * e * 0.5;
      }
    }

    // contact shadows track the fighters and shrink as they rise
    this.shadowB.position.x = this.brilliant.group.position.x;
    const bLift = Math.max(this.brilliant.group.position.y, 0);
    this.shadowB.scale.setScalar(Math.max(0.75, 1 - bLift * 2));
    if (this.boring) {
      this.shadowO.position.x = this.boring.group.position.x;
      const oLift = Math.max(this.boring.group.position.y, 0);
      const base = this.bossMode ? 2.1 : 1;
      this.shadowO.scale.setScalar(base * Math.max(0.75, 1 - oLift * 2));
    }

    if (this.beam) {
      this.beamLife -= dt;
      const k = Math.max(this.beamLife / 0.5, 0);
      (this.beam.material as THREE.MeshBasicMaterial).opacity = k;
      this.beam.scale.y = this.beam.scale.z = 0.5 + 0.6 * k + Math.sin(this.t * 60) * 0.12;
      if (this.beamGlow) {
        (this.beamGlow.material as THREE.MeshBasicMaterial).opacity = 0.45 * k;
        this.beamGlow.scale.y = this.beamGlow.scale.z = 0.8 + 0.7 * k;
      }
      if (this.beamLife <= 0) {
        this.scene.remove(this.beam);
        if (this.beamGlow) this.scene.remove(this.beamGlow);
        this.beam = null;
        this.beamGlow = null;
        if (this.flash) { this.scene.remove(this.flash); this.flash = null; }
      }
    }
    if (this.flash) {
      this.flash.scale.multiplyScalar(1 + dt * 6);
      (this.flash.material as THREE.MeshBasicMaterial).opacity *= 1 - dt * 8;
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      s.vel.y -= 7 * dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(s.life * 2, 0);
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        this.sparks.splice(i, 1);
      }
    }

    for (const p of this.papers) {
      p.vel.y -= 5 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.spin.x * dt;
      p.mesh.rotation.y += p.spin.y * dt;
      p.mesh.rotation.z += p.spin.z * dt;
      if (p.mesh.position.y < 0.01) {
        p.mesh.position.y = 0.01;
        p.vel.set(0, 0, 0);
        p.spin.multiplyScalar(0.0);
      }
    }

    // dust drifts up and loops
    const pos = this.dust.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + dt * 0.06;
      let x = pos.getX(i) + Math.sin(this.t * 0.4 + i) * dt * 0.05;
      if (y > 4.4) y = 0;
      pos.setY(i, y);
      pos.setX(i, x);
    }
    pos.needsUpdate = true;

    if (this.shake > 0) {
      this.shake = Math.max(this.shake - dt, 0);
      this.camera.position.x = (Math.random() - 0.5) * this.shake * 0.3;
      this.camera.position.y = 1.25 + (Math.random() - 0.5) * this.shake * 0.2;
    } else {
      this.camera.position.x = 0;
      this.camera.position.y = 1.25;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
