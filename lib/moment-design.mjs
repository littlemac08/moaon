import { duckMark } from './duck-mark.mjs';
export const momentThemes = [
 {id:'sage',name:'루비',description:'웜 필름 · 레드',bg:'#642c29',ink:'#fff5e9',accent:'#ec5349'},
 {id:'night',name:'모노',description:'차콜 · 깊은 명암',bg:'#181819',ink:'#f7f4ed',accent:'#e64a40'},
 {id:'warm',name:'앰버',description:'따뜻한 필름',bg:'#574332',ink:'#fff1d9',accent:'#df704c'},
];
export const INTRO_SECONDS=3, OUTRO_SECONDS=2;
export function momentCard({theme='sage',kind='intro',percent=0,minutes=0,goal=0,start='',end='',time=1.65}={}) {
 const t=momentThemes.find(v=>v.id===theme)||momentThemes[0];
 const clamp=v=>Math.min(1,Math.max(0,v));
 const ease=v=>1-Math.pow(1-clamp(v),3);
 const n=v=>Math.min(1000000,Math.max(0,Math.floor(Number(v)||0)));
 const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)?v.replaceAll('-','.'):'';
 const entrance=ease(time/.7), count=ease((time-.35)/1.45), detail=ease((time-.8)/.7);
 const exit=clamp(((kind==='intro'?3:2)-time)/.35);
 const p=Math.round(n(percent)*count), mins=Math.round(n(minutes)*count);
 const text=(x,y,s,value,extra='')=>`<text x="${x}" y="${y}" fill="${t.ink}" font-family="Apple SD Gothic Neo,Noto Sans CJK KR,Arial,sans-serif" font-size="${s}" ${extra}>${value}</text>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280"><defs><linearGradient id="shade" x2="0" y2="1"><stop stop-color="${t.bg}" stop-opacity=".18"/><stop offset="1" stop-color="#111111" stop-opacity=".78"/></linearGradient></defs><rect width="720" height="1280" fill="url(#shade)"/><g opacity="${exit*entrance}" transform="translate(0 ${24*(1-entrance)})"><circle cx="66" cy="88" r="6" fill="${t.accent}"/>${text(84,94,17,'MOAON / MOTION','letter-spacing="3"')}<path d="M48 124H672M48 1132H672" stroke="${t.ink}" stroke-opacity=".28"/><g transform="translate(0 ${Math.sin(time*2.5)*5})">${duckMark(475,600,190,t.ink,ease(time/1.1))}</g>${kind==='intro'?`${text(52,756,16,'THIS WEEK, I MADE TIME.','letter-spacing="3" opacity=".7"')}${text(48,886,116,`${p}<tspan font-size="36">%</tspan>`,'font-weight="300"')}<path d="M52 924H668" stroke="${t.ink}" stroke-opacity=".2" stroke-width="2"/><path d="M52 924H${52+616*Math.min(p,100)/100}" stroke="${t.accent}" stroke-width="3"/><g opacity="${detail}">${text(52,992,32,`${mins}<tspan font-size="18"> MIN / ${n(goal)} MIN</tspan>`)}${text(52,1044,16,`${date(start)} — ${date(end)}`,'opacity=".7"')}</g>`:`${text(52,816,18,'EVERY LITTLE MOMENT.','letter-spacing="3" opacity=".7"')}${text(48,910,74,'모아온.','font-weight="500"')}<g opacity="${detail}">${text(52,980,23,'작은 오늘이, 나를 만든다.')}${text(52,1044,17,`${mins} MIN COLLECTED · ${p}% THIS WEEK`,'letter-spacing="1"')}</g>`}${text(52,1180,13,'PERSONAL RHYTHM / FILM DIARY','letter-spacing="2" opacity=".7"')}</g></svg>`;
}
