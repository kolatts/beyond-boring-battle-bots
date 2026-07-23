// DOM overlay: HUD, question card, explanation panel, and the various
// full-screen beats. Classic fighting-game HUD zone: bars up top,
// question card in the lower third.

import type { Question, Round } from './types';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

function el(tag: string, cls: string, html?: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

// ---------- HUD ----------

export interface HudState {
  morale: number; moraleMax: number;
  boring: number; boringMax: number;
  round: number; title: string; boss: boolean;
}

export function setHud(s: HudState): void {
  $('hud').classList.remove('hidden');
  $('round-banner').textContent = s.boss
    ? `FINAL ROUND: ${s.title.replace(/^BOSS:\s*/, '')}`
    : `ROUND ${s.round}: ${s.title}`;
  $('round-banner').classList.toggle('boss', s.boss);
  $('boring-label').textContent = s.boss ? 'CHANGE ADVISORY BOARD' : 'COMPLIANCE INTEGRITY';
  updateBars(s.morale, s.moraleMax, s.boring, s.boringMax);
}

export function updateBars(morale: number, moraleMax: number, boring: number, boringMax: number): void {
  ($('morale-fill') as HTMLElement).style.width = `${(morale / moraleMax) * 100}%`;
  ($('boring-fill') as HTMLElement).style.width = `${(boring / boringMax) * 100}%`;
  $('morale-pips').textContent = `${morale}/${moraleMax}`;
  $('boring-pips').textContent = `${boring}/${boringMax}`;
}

// ---------- overlay helpers ----------

function overlay(): HTMLElement {
  const o = $('overlay');
  o.innerHTML = '';
  o.classList.remove('hidden');
  return o;
}

export function clearOverlay(): void {
  $('overlay').classList.add('hidden');
  $('overlay').innerHTML = '';
}

// ---------- screens ----------

export function showTitle(onStart: () => void): void {
  $('hud').classList.add('hidden');
  const o = overlay();
  const card = el('div', 'panel title-panel');
  card.append(
    el('div', 'title-kicker', 'BEYOND BORING PRESENTS'),
    el('h1', 'title-main', 'BATTLE OF THE<br>BACKLOG'),
    el('div', 'title-vs', '<span class="name-brilliant">BRILLIANT</span><span class="vs">VS</span><span class="name-boring">BORING</span>'),
    el('p', 'title-blurb',
      '9 rounds of agentic-coding trivia. Answer correctly and the Beam of ' +
      'Soul-Crushing Monotony is returned to sender, with interest. Answer ' +
      'wrong and it lands on your MORALE, which HR insists is a renewable resource. ' +
      'It is not. Survive all 9 rounds and BORING short-circuits into a pile of TPS reports.'),
    el('p', 'title-note', 'This is a study tool wearing a fighting-game costume. Losing a round just means retrying it. Like real compliance training, except you learn something.'),
  );
  const btn = el('button', 'btn btn-primary', 'BEGIN PERFORMANCE REVIEW');
  btn.id = 'start-btn';
  btn.onclick = () => { clearOverlay(); onStart(); };
  card.append(btn);
  o.append(card);
}

export function showRoundIntro(r: Round, boss: boolean, onReady: () => void): void {
  const o = overlay();
  const card = el('div', `panel intro-panel${boss ? ' boss' : ''}`);
  card.append(
    el('div', 'intro-round', boss ? 'FINAL ROUND' : `ROUND ${r.round} OF 9`),
    el('h2', 'intro-title', boss ? r.title.replace(/^BOSS:\s*/, '') : r.title),
  );
  if (boss) {
    card.append(el('p', 'intro-boss-note',
      'BORING has assumed its final form: the CHANGE ADVISORY BOARD. ' +
      'Quorum is present. Your change is on the agenda. It will be reviewed.'));
  }
  const quip = el('div', 'quip quip-boring');
  quip.append(el('div', 'quip-speaker', 'BORING'), el('p', 'quip-text', `“${r.boringQuip}”`));
  card.append(quip);
  const btn = el('button', 'btn btn-primary', boss ? 'PRESENT YOUR CHANGE' : 'FIGHT');
  btn.id = 'fight-btn';
  btn.onclick = () => { clearOverlay(); onReady(); };
  card.append(btn);
  o.append(card);
}

export function showQuestion(q: Question, num: number, total: number, onAnswer: (i: number) => void): void {
  // test hook for automated playtesting (playwright)
  (window as unknown as Record<string, unknown>).__bb = { id: q.id, correctIndex: q.correctIndex, num, total };
  const qc = $('question-card');
  qc.innerHTML = '';
  qc.classList.remove('hidden');
  qc.append(el('div', 'q-count', `QUESTION ${num} / ${total}`));
  qc.append(el('p', 'q-prompt', q.prompt));
  const list = el('div', 'q-choices');
  q.choices.forEach((choice, i) => {
    const b = el('button', 'btn q-choice', `<span class="q-letter">${'ABCD'[i]}</span> ${escapeHtml(choice)}`);
    b.setAttribute('data-choice', String(i));
    (b as HTMLButtonElement).onclick = () => onAnswer(i);
    list.append(b);
  });
  qc.append(list);
}

export function hideQuestion(): void {
  $('question-card').classList.add('hidden');
}

export function showExplanation(q: Question, chosen: number, correct: boolean, onNext: () => void): void {
  const o = overlay();
  const card = el('div', `panel expl-panel ${correct ? 'correct' : 'wrong'}`);
  card.append(el('div', 'expl-verdict', correct
    ? 'CORRECT — BEAM RETURNED TO SENDER'
    : 'INCORRECT — MONOTONY BEAM LANDED'));
  card.append(el('p', 'expl-question', q.prompt));
  const answers = el('div', 'expl-answers');
  if (!correct) {
    answers.append(el('div', 'expl-chosen',
      `<span class="tag tag-wrong">YOUR ANSWER</span> ${escapeHtml(q.choices[chosen])}`));
  }
  answers.append(el('div', 'expl-right',
    `<span class="tag tag-right">CORRECT ANSWER</span> ${escapeHtml(q.choices[q.correctIndex])}`));
  card.append(answers);
  card.append(el('div', 'expl-heading', 'WHY (THE ACTUAL LESSON)'));
  card.append(el('p', 'expl-text', q.explanation));
  const btn = el('button', 'btn btn-primary', 'CONTINUE');
  btn.id = 'continue-btn';
  btn.onclick = () => { clearOverlay(); onNext(); };
  card.append(btn);
  o.append(card);
}

export function showRoundClear(r: Round, correct: number, total: number, onNext: () => void): void {
  const o = overlay();
  const card = el('div', 'panel clear-panel');
  card.append(
    el('div', 'clear-kicker', 'ROUND CLEAR'),
    el('h2', 'clear-title', `${r.title} — CLEARED`),
    el('p', 'clear-score', `${correct} correct out of ${total} asked. Morale +1.`),
  );
  const quip = el('div', 'quip quip-brilliant');
  quip.append(el('div', 'quip-speaker', 'BRILLIANT'), el('p', 'quip-text', `“${r.clearQuip}”`));
  card.append(quip);
  const btn = el('button', 'btn btn-primary', 'NEXT ROUND');
  btn.id = 'next-round-btn';
  btn.onclick = () => { clearOverlay(); onNext(); };
  card.append(btn);
  o.append(card);
}

export function showGameOver(r: Round, stalled: boolean, onRetry: () => void): void {
  const o = overlay();
  const card = el('div', 'panel over-panel');
  card.append(
    el('div', 'over-kicker', stalled ? 'ROUND STALLED' : 'MORALE DEPLETED'),
    el('h2', 'over-title', stalled ? 'THE PAPERWORK SURVIVED' : 'BORING WINS THIS ONE'),
    el('p', 'over-text', stalled
      ? 'The question pool ran dry before Boring’s Compliance Integrity did. The board thanks you for your engagement and invites you to resubmit.'
      : 'Your morale has been fully reallocated to a cost center. The good news: this is a study tool, not a gate. Same round, fresh morale, and the questions reshuffle.'),
    el('p', 'over-note', `Retrying: ${r.title}`),
  );
  const btn = el('button', 'btn btn-primary', 'RESUBMIT (RETRY ROUND)');
  btn.id = 'retry-btn';
  btn.onclick = () => { clearOverlay(); onRetry(); };
  card.append(btn);
  o.append(card);
}

export function showVictory(onReplay: () => void): void {
  const o = overlay();
  const card = el('div', 'panel victory-panel');
  card.append(
    el('div', 'clear-kicker', 'FLAWLESS-ISH VICTORY'),
    el('h2', 'victory-title', 'BORING HAS SHORT-CIRCUITED<br>INTO A PILE OF TPS REPORTS'),
    el('p', 'victory-text',
      'All 9 rounds cleared. The Change Advisory Board has dissolved into its component paperwork, ' +
      'which is now gently settling over the carpet tiles like beige snow.'),
    el('p', 'victory-text',
      'You now hold the complete mental model: context is finite and rots; the loop is ' +
      'Explore → Plan → Implement → Commit; prompts are specific or they are noise; instruction files are ' +
      'concrete or they are decoration; skills and MCP make capability portable; verification is the whole ' +
      'ballgame; humans review everything; and Copilot is just these ideas wearing a product name. ' +
      'Go build something. Boring hates that.'),
  );
  const btn = el('button', 'btn btn-primary', 'RUN IT BACK');
  btn.id = 'replay-btn';
  btn.onclick = () => { clearOverlay(); onReplay(); };
  card.append(btn);
  o.append(card);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
