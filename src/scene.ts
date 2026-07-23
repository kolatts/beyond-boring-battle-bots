// The Street Fighter stage: two voxel robots at eye line, beams, shake,
// and a terminal shower of TPS reports.

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

export class BattleScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private brilliant: RobotRig;
  private boring!: RobotRig;
  private bossMode = false;
  private anims: Record<Fighter, Anim> = { brilliant: { kind: 'idle' }, boring: { kind: 'idle' } };
  private beam: THREE.Mesh | null = null;
  private beamLife = 0;
  private flash: THREE.Mesh | null = null;
  private shake = 0;
  private papers: Paper[] = [];
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
    this.scene.background = new THREE.Color(0x2b2926);
    this.scene.fog = new THREE.Fog(0x2b2926, 9, 18);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    this.camera.position.set(0, 1.25, 5.6);
    this.camera.lookAt(0, 1.0, 0);

    const hemi = new THREE.HemisphereLight(0xf4f7ec, 0x55524a, 1.15);
    const key = new THREE.DirectionalLight(0xfff4e0, 1.25);
    key.position.set(-2, 6, 6);
    const rim = new THREE.DirectionalLight(0xff9a3c, 0.4);
    rim.position.set(4, 3, -3);
    this.scene.add(hemi, key, rim);

    // floor: office carpet with a faint grid of carpet tiles
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 24),
      new THREE.MeshLambertMaterial({ color: 0x6e6a60 })
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
    const grid = new THREE.GridHelper(40, 40, 0x5d5952, 0x625e55);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.LineBasicMaterial).opacity = 0.35;
    grid.position.y = 0.01;
    this.scene.add(grid);

    // back wall with fluorescent strip
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 10),
      new THREE.MeshLambertMaterial({ color: 0x504d46 })
    );
    wall.position.set(0, 5, -6);
    this.scene.add(wall);
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.12, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xf4f7ec })
    );
    strip.position.set(0, 4.4, -5.8);
    this.scene.add(strip);

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
    const len = Math.abs(x1 - x0) - 0.5;
    const thick = this.bossMode && attacker === 'boring' ? 0.34 : 0.18;
    const color = attacker === 'brilliant' ? C.orangeBright : (this.bossMode ? C.danger : 0xb9b1a0);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
    this.beam = new THREE.Mesh(new THREE.BoxGeometry(len, thick, thick), mat);
    this.beam.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
    this.beam.rotation.z = Math.atan2(y1 - y0, x1 - x0);
    this.scene.add(this.beam);
    this.beamLife = 0.5;

    const flashMat = new THREE.MeshBasicMaterial({ color: 0xfff4e0, transparent: true, opacity: 0.9 });
    this.flash = new THREE.Mesh(new THREE.SphereGeometry(thick * 1.8, 10, 8), flashMat);
    this.flash.position.set(x1 + (x0 > x1 ? 0.35 : -0.35), y1, 0);
    this.scene.add(this.flash);
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
  }

  private tick(): void {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.t += dt;

    for (const f of ['brilliant', 'boring'] as Fighter[]) {
      const rig = this.rig(f);
      const anim = this.anims[f];
      const dir = f === 'brilliant' ? 1 : -1; // +x for brilliant's forward
      const baseRotY = f === 'brilliant' ? BRILLIANT_ROT : BORING_ROT;

      if (anim.kind === 'idle') {
        rig.group.position.y = Math.sin(this.t * 2.2 + (f === 'boring' ? Math.PI : 0)) * 0.035;
        rig.group.rotation.z = 0;
        rig.group.rotation.y = baseRotY;
        rig.armL.rotation.x = Math.sin(this.t * 2.2) * 0.08;
        rig.armR.rotation.x = -Math.sin(this.t * 2.2) * 0.08;
        rig.head.rotation.z = Math.sin(this.t * 1.1) * 0.03;
      } else if (anim.kind === 'attack') {
        anim.t += dt;
        const k = anim.t / ATTACK_TIME;
        // wind-up: lean back; fire: lunge forward with arm extended
        const lean = k < 0.4 ? -0.55 * (k / 0.4) : -0.55 + 1.0 * Math.min((k - 0.4) / 0.3, 1);
        rig.group.rotation.z = dir * lean * 0.3;
        rig.armR.rotation.x = k < 0.4 ? 0.6 : -1.5;
        rig.group.position.y = 0;
        if (k >= 1) { this.anims[f] = { kind: 'idle' }; this.setFace(f, 'idle'); }
      } else if (anim.kind === 'hit') {
        anim.t += dt;
        const k = anim.t / HIT_TIME;
        rig.group.rotation.z = -dir * 0.35 * Math.sin(Math.min(k, 1) * Math.PI);
        rig.group.position.y = 0.05 * Math.sin(Math.min(k, 1) * Math.PI * 3);
      } else if (anim.kind === 'ko') {
        anim.t += dt;
        const k = Math.min(anim.t / 1.1, 1);
        const e = 1 - (1 - k) * (1 - k);
        rig.group.rotation.z = -dir * e * (Math.PI / 2 - 0.35);
        rig.group.position.y = -e * 0.15;
        if (f === 'boring' && this.bossMode) rig.group.rotation.z = -dir * e * 0.5;
      }
    }

    if (this.beam) {
      this.beamLife -= dt;
      const m = this.beam.material as THREE.MeshBasicMaterial;
      m.opacity = Math.max(this.beamLife / 0.5, 0) * 0.95;
      this.beam.scale.y = this.beam.scale.z = 0.6 + 0.8 * Math.max(this.beamLife / 0.5, 0) + Math.sin(this.t * 60) * 0.15;
      if (this.beamLife <= 0) {
        this.scene.remove(this.beam);
        this.beam = null;
        if (this.flash) { this.scene.remove(this.flash); this.flash = null; }
      }
    }
    if (this.flash) {
      this.flash.scale.multiplyScalar(1 + dt * 6);
      (this.flash.material as THREE.MeshBasicMaterial).opacity *= 1 - dt * 8;
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
