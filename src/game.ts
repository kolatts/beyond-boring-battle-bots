// State machine: TITLE → ROUND_INTRO → QUESTION → RESOLVE → EXPLANATION
// → ... → ROUND_CLEAR | GAME_OVER → VICTORY. Explanations are always
// shown, right or wrong — that mechanic does not get cut.

import bank from './data/questions.json';
import type { Question, Round } from './types';
import { BattleScene } from './scene';
import * as ui from './ui';
import {
  PLAYER_MAX_HP, BORING_ROUND_HP, BOSS_HP, WRONG_DAMAGE, ROUND_HEAL,
  QUESTIONS_PER_ROUND,
} from './const';

const rounds: Round[] = (bank.rounds as Round[]).slice().sort((a, b) => a.round - b.round);

interface State {
  roundIdx: number;
  morale: number;         // Brilliant HP, carried across rounds
  moraleAtRoundStart: number;
  boringHp: number;
  queue: Question[];
  qIdx: number;
  correctThisRound: number;
}

export class Game {
  private scene: BattleScene;
  private s: State = {
    roundIdx: 0, morale: PLAYER_MAX_HP, moraleAtRoundStart: PLAYER_MAX_HP,
    boringHp: BORING_ROUND_HP, queue: [], qIdx: 0, correctThisRound: 0,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new BattleScene(canvas);
    // ?round=N jumps straight to a round — handy for studying one module
    // (and for automated playtests)
    const jump = Number(new URLSearchParams(location.search).get('round'));
    if (jump >= 1 && jump <= rounds.length) {
      this.startRound(jump - 1, true);
    } else {
      ui.showTitle(() => this.startRound(0, true));
    }
  }

  private get round(): Round { return rounds[this.s.roundIdx]; }
  private get isBoss(): boolean { return this.round.round === 9; }
  private get boringMaxHp(): number { return this.isBoss ? BOSS_HP : BORING_ROUND_HP; }

  private startRound(idx: number, freshMorale: boolean): void {
    this.s.roundIdx = idx;
    if (freshMorale && idx === 0) this.s.morale = PLAYER_MAX_HP;
    this.s.moraleAtRoundStart = this.s.morale;
    this.s.boringHp = this.boringMaxHp;
    this.s.correctThisRound = 0;
    this.s.qIdx = 0;
    this.s.queue = drawQuestions(this.round.questions, QUESTIONS_PER_ROUND);

    this.scene.reset();
    this.scene.spawnBoring(this.isBoss);
    ui.setHud({
      morale: this.s.morale, moraleMax: PLAYER_MAX_HP,
      boring: this.s.boringHp, boringMax: this.boringMaxHp,
      round: this.round.round, title: this.round.title, boss: this.isBoss,
    });
    ui.showRoundIntro(this.round, this.isBoss, () => this.nextQuestion());
  }

  private nextQuestion(): void {
    if (this.s.boringHp <= 0) return this.roundClear();
    if (this.s.qIdx >= this.s.queue.length) {
      // pool exhausted without a KO either way — count it as a stall;
      // Boring's paperwork survives, so the round is retried.
      return this.gameOver(true);
    }
    const q = this.s.queue[this.s.qIdx];
    ui.showQuestion(q, this.s.qIdx + 1, this.s.queue.length, (choice) => this.resolve(q, choice));
  }

  private resolve(q: Question, choice: number): void {
    const correct = choice === q.correctIndex;
    ui.hideQuestion();
    if (correct) {
      this.s.correctThisRound++;
      this.scene.fireBeam('brilliant', () => {
        this.s.boringHp = Math.max(this.s.boringHp - 1, 0);
        ui.updateBars(this.s.morale, PLAYER_MAX_HP, this.s.boringHp, this.boringMaxHp);
      });
    } else {
      this.scene.fireBeam('boring', () => {
        this.s.morale = Math.max(this.s.morale - WRONG_DAMAGE, 0);
        ui.updateBars(this.s.morale, PLAYER_MAX_HP, this.s.boringHp, this.boringMaxHp);
      });
    }
    // explanation is ALWAYS shown — after the beam lands
    setTimeout(() => {
      ui.showExplanation(q, choice, correct, () => {
        this.s.qIdx++;
        if (this.s.morale <= 0) return this.gameOver(false);
        this.nextQuestion();
      });
    }, 1400);
  }

  private roundClear(): void {
    this.s.morale = Math.min(this.s.morale + ROUND_HEAL, PLAYER_MAX_HP);
    ui.updateBars(this.s.morale, PLAYER_MAX_HP, this.s.boringHp, this.boringMaxHp);
    if (this.s.roundIdx >= rounds.length - 1) return this.victory();
    ui.showRoundClear(this.round, this.s.correctThisRound, this.s.queue.length,
      () => this.startRound(this.s.roundIdx + 1, false));
  }

  private gameOver(stalled: boolean): void {
    this.scene.koBrilliant();
    setTimeout(() => {
      ui.showGameOver(this.round, stalled, () => {
        this.s.morale = this.s.moraleAtRoundStart;
        this.startRound(this.s.roundIdx, false);
      });
    }, 1300);
  }

  private victory(): void {
    this.scene.defeatCutscene();
    setTimeout(() => ui.showVictory(() => {
      this.s.morale = PLAYER_MAX_HP;
      this.startRound(0, true);
    }), 2600);
  }
}

/** Fisher-Yates draw of n questions so replays differ. */
function drawQuestions(pool: Question[], n: number): Question[] {
  const a = pool.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}
