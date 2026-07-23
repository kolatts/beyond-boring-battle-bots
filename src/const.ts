// Shared palette — same visual language as "The Insurrection".

export const C = {
  ink: 0x22201d,
  paper: 0xf5efe0,
  paperDim: 0xd8d2c2,
  orange: 0xe87722,
  orangeBright: 0xff9a3c,
  officeWall: 0x8d897c,
  officeWallDark: 0x6e6a60,
  officeFloor: 0x9a9588,
  beige: 0xb9b1a0,
  grayDark: 0x55524a,
  screen: 0x161412,
  danger: 0xc0392b,
  boringShell: 0x8a8578,
  boringShellDark: 0x5d5952,
} as const;

// Tuning knobs
export const PLAYER_MAX_HP = 10;   // MORALE
export const BORING_ROUND_HP = 5;  // COMPLIANCE INTEGRITY per normal round
export const BOSS_HP = 7;          // round 9
export const WRONG_DAMAGE = 1;     // morale lost per wrong answer
export const ROUND_HEAL = 1;       // morale restored on round clear
export const QUESTIONS_PER_ROUND = 10; // draw size from each round's pool
