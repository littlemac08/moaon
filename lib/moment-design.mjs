// The same SVG frames are used for the in-app preview and the exported film.
export const momentThemes = [
  { id: 'sage', name: '블루', description: '맑고 차분한', bg: '#263f61', ink: '#f6faff', accent: '#a6d0fa' },
  { id: 'night', name: '나이트', description: '깊고 선명한', bg: '#1f2636', ink: '#f7f8fc', accent: '#c2cbee' },
  { id: 'warm', name: '포레스트', description: '부드러운 초록', bg: '#314d4c', ink: '#f4faf6', accent: '#b2d9ca' },
];
export const INTRO_SECONDS = 3, OUTRO_SECONDS = 2;
const yuri = 'M24 44C24 39 23 36 24 31C25 17 35 10 50 10C65 10 75 17 76 31C77 36 76 39 76 44C76 49 81 42 84 39C90 33 96 39 91 46C88 52 80 56 79 62C78 69 83 77 80 82C77 88 71 83 67 82C62 80 59 89 50 89C41 89 38 80 33 82C29 83 23 88 20 82C17 77 22 69 21 62C20 56 12 52 9 46C4 39 10 33 16 39C19 42 24 49 24 44Z';
export function momentCard({ theme = 'sage', kind = 'intro', percent = 0, minutes = 0, goal = 0, start = '', end = '', time = 1.65 } = {}) {
  const t = momentThemes.find(v => v.id === theme) || momentThemes[0];
  const clamp = v => Math.min(1, Math.max(0, v));
  const ease = v => 1 - Math.pow(1 - clamp(v), 3);
  const n = v => Math.min(1000000, Math.max(0, Math.floor(Number(v) || 0)));
  const date = v => /^\d{4}-\d{2}-\d{2}$/.test(v) ? v.slice(5).replace('-', '.') : '';
  const entrance = ease(time / .7), count = ease((time - .35) / 1.45), detail = ease((time - .8) / .7);
  const exitProgress = kind === 'intro' ? ease((time - 2.35) / .65) : ease((time - 1.72) / .28);
  const transitionOpacity = entrance * (1 - exitProgress);
  const shiftY = kind === 'intro' ? 24 * (1 - entrance) - 125 * exitProgress : 105 * (1 - entrance) - 12 * exitProgress;
  const shiftX = kind === 'intro' ? 85 * exitProgress : -42 * (1 - entrance);
  const p = Math.round(n(percent) * count), mins = Math.round(n(minutes) * count);
  const water = 85 - Math.min(p, 100) * .79;
  const wave = Math.sin(time * 2) * 3;
  const text = (x, y, size, value, extra = '') => `<text x="${x}" y="${y}" fill="${t.ink}" font-family="Apple SD Gothic Neo,Noto Sans CJK KR,Arial,sans-serif" font-size="${size}" ${extra}>${value}</text>`;
  const arrivalTime = kind === 'intro' ? clamp(time / 1.3) : 1;
  const ghostEntrance = arrivalTime * arrivalTime * (3 - 2 * arrivalTime);
  // Start from rest, then gently accelerate along a curved path beyond the frame.
  const flightTime = kind === 'outro' ? clamp((time - .9) / 1.05) : 0;
  const ghostExit = flightTime * flightTime;
  const ghostX = 432 + 350 * (1 - ghostEntrance) - 18 * Math.sin(Math.PI * ghostEntrance) + 390 * ghostExit;
  const ghostY = 605 + 700 * (1 - ghostEntrance) - 780 * ghostExit + Math.sin(time * 2) * 5 * ghostEntrance * (1 - ghostExit);
  const ghostTilt = -8 * Math.sin(Math.PI * arrivalTime) + 10 * Math.sin(Math.PI * flightTime);
  const ghost = `<g transform="translate(${ghostX} ${ghostY}) scale(2) rotate(${ghostTilt} 50 50)"><defs><clipPath id="yuri"><path d="${yuri}"/></clipPath></defs><path d="${yuri}" fill="${t.ink}" fill-opacity=".13"/><g clip-path="url(#yuri)"><path d="M-10 ${water} Q15 ${water + wave + 5} 40 ${water} T90 ${water} T140 ${water} V110 H-10Z" fill="${t.accent}" fill-opacity=".75"/></g><path d="${yuri}" fill="none" stroke="${t.ink}" stroke-opacity=".85" stroke-width="2" stroke-linejoin="round"/><circle cx="42" cy="34" r="2.2" fill="${t.ink}"/><circle cx="58" cy="34" r="2.2" fill="${t.ink}"/><path d="M42 47Q50 54 58 47" fill="none" stroke="${t.ink}" stroke-width="2" stroke-linecap="round"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280"><defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${t.bg}" stop-opacity=".44"/><stop offset=".4" stop-color="${t.bg}" stop-opacity=".08"/><stop offset="1" stop-color="${t.bg}" stop-opacity=".94"/></linearGradient></defs><rect width="720" height="1280" fill="url(#shade)" opacity="${transitionOpacity}"/><g opacity="${transitionOpacity}" transform="translate(${shiftX} ${shiftY})">${text(52,100,26,'moaon.','font-weight="700" letter-spacing="-1"')}${text(668,97,14,'MOMENT','text-anchor="end" letter-spacing="3" opacity=".75"')}<path d="M52 120H668" stroke="${t.ink}" stroke-opacity=".3"/>${ghost}${kind === 'intro' ? `${text(52,800,20,'이번 주, 나를 위한 시간','opacity=".85"')}${text(48,935,130,`${p}<tspan font-size="48">%</tspan>`,'font-weight="300" letter-spacing="-4"')}<g opacity="${detail}">${text(54,1002,27,`${mins}분 <tspan opacity=".65">/ ${n(goal)}분</tspan>`)}${text(54,1054,19,`${date(start)} — ${date(end)}`,'letter-spacing="1" opacity=".75"')}</g>` : `${text(52,820,20,'작은 오늘을 모아','opacity=".85"')}${text(48,918,70,'모아온.','font-weight="600"')}<g opacity="${detail}">${text(52,987,26,'나만의 속도로, 한 걸음씩')}${text(52,1042,19,`${mins}분의 기록 · ${p}%`,'opacity=".75"')}</g>`}<path d="M52 1135H668" stroke="${t.ink}" stroke-opacity=".3"/>${text(52,1180,16,'작은 오늘을 모아','opacity=".75"')}${text(668,1180,13,'MOAON / MOMENT','text-anchor="end" letter-spacing="2" opacity=".65"')}</g></svg>`;
}
