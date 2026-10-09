export const percentage = (n, d) => d ? `${(100*n/d).toFixed(1)}%` : '—';
export function filterPlays(plays, {team='CLE',down='all',distance='all'}={}) {
 return plays.filter(p=>p.defense===team && (down==='all'||p.down===Number(down)) && (distance==='all'||(distance==='short'&&p.distance<=3)||(distance==='medium'&&p.distance>=4&&p.distance<=6)||(distance==='long'&&p.distance>=7&&p.distance<=10)||(distance==='verylong'&&p.distance>=11)));
}
export function summarize(plays){
 const rushers=new Map(),coverage=new Map();
 for(const p of plays){
  for(const id of new Set(p.rushers)){const r=rushers.get(id)||{id,reps:0,pressure:0};r.reps++;if(p.pressure.includes(id))r.pressure++;rushers.set(id,r);}
  if(p.coverage)coverage.set(p.coverage,(coverage.get(p.coverage)||0)+1);
 }
 const four=plays.filter(p=>p.rushers.length===4),five=plays.filter(p=>p.rushers.length>=5);
 return {n:plays.length,games:new Set(plays.map(p=>p.game)).size,pressure:plays.filter(p=>p.pressure.length).length,
  rushers:[...rushers.values()].sort((a,b)=>b.pressure-a.pressure||b.reps-a.reps||a.id.localeCompare(b.id)),
  five:five.length,fivePressure:five.filter(p=>p.pressure.length).length,four:four.length,fourPressure:four.filter(p=>p.pressure.length).length,
  coverage:[...coverage].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),coverageN:plays.filter(p=>p.coverage).length,
  noAllowed:plays.filter(p=>p.pressure.length&&!p.allowed.length).length};
}
export function evidence(plays, focus){
 if(focus==='pressure')return plays.filter(p=>p.pressure.length);
 if(focus==='extra')return plays.filter(p=>p.rushers.length>=5);
 if(focus.startsWith('player:'))return plays.filter(p=>p.rushers.includes(focus.slice(7))&&p.pressure.includes(focus.slice(7)));
 if(focus.startsWith('coverage:'))return plays.filter(p=>p.coverage===focus.slice(9));
 return plays;
}
export function movement(replay,frame,qb){
 if(replay.snap===null)return null;
 const i=replay.players.findIndex(p=>p.id===qb)*2;
 if(i<0)return null;
 const a=replay.frames[replay.snap][3],b=replay.frames[frame][3];
 return [a[i],a[i+1],b[i],b[i+1]].some(x=>x==null)?null:Math.hypot(b[i]-a[i],b[i+1]-a[i+1]);
}
