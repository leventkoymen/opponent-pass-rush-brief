// Plain-language presentation rules. These do not change the metric engine.
export const COVERAGE_GUIDE={
 'Cover-0':'Man-to-man coverage with no deep defender providing help.',
 'Cover-1':'Man-to-man coverage with one defender protecting deep.',
 'Cover-2':'Zone coverage with two defenders protecting deep areas.',
 'Cover-3':'Zone coverage with three defenders protecting deep areas.',
 'Quarters':'A coverage family with four defenders sharing deep areas.',
 'Cover-6':'A mix of two-deep and quarters coverage on opposite sides.',
 '2-Man':'Man-to-man underneath, with two defenders protecting deep.',
 'Bracket':'Two defenders combine to cover a receiving threat.',
 'Red Zone':'A coverage label for the area close to the goal line.',
 'Goal Line':'A defensive call used near the goal line.',
 'Prevent':'A coverage designed for special end-of-half or end-of-game situations.',
 'Miscellaneous':'A call outside the standard coverage categories.'
};
export function coverageGuide(label){return COVERAGE_GUIDE[label]||'No detailed coverage description is available for this label.';}
export function chooseDefender(play,tracking,rankings=[],requested=null){
 const defenders=tracking.players.filter(p=>p.team===play.defense);
 if(requested&&defenders.some(p=>p.id===requested))return requested;
 const rank=id=>rankings.find(p=>p.id===id)?.pressure||0;
 const score=p=>(p.credit.includes('sack')?3:p.credit.includes('hit')?2:p.credit.includes('hurry')?1:0);
 const credited=defenders.filter(p=>p.credit.length);
 const pool=credited.length?credited:defenders.filter(p=>p.role==='Pass Rush');
 return [...pool].sort((a,b)=>score(b)-score(a)||rank(b.id)-rank(a.id)||a.id.localeCompare(b.id))[0]?.id||null;
}
export function reviewStages(tracking){
 const event=name=>{const i=tracking.frames.findIndex(f=>f[2].includes(name));return i<0?null:i;};
 const snap=tracking.snap,release=event('pass_forward'),sack=event('qb_sack');
 const start=snap??0,end=release??sack??tracking.frames.length-1;
 return {start,watch:Math.max(start,Math.floor((start+end)/2)),end,hasSnap:snap!==null,event:release!==null?'throw':sack!==null?'sack':null};
}
export function outcomeText(play){
 const result={S:'Sack — the quarterback was stopped behind the line before throwing.',C:'Completed pass — a teammate caught the throw.',I:'Incomplete pass — the throw was not completed.',IN:'Interception — the defense caught the pass.',R:'Scramble — the quarterback ran with the ball.'}[play.result]||'See the recorded play description for the outcome.';
 const yards=play.yards===0?'No net yards gained.':play.yards>0?`The offense gained ${play.yards} net yards.`:`The offense lost ${Math.abs(play.yards)} net yards.`;
 return `${result} ${yards}`;
}
export function reviewPrompt(play){
 if(play.pressure.length&&!play.allowed.length)return 'Pressure was recorded without a blocker being charged. What should we review in the full protection before assigning responsibility?';
 if(play.rushers.length>=5)return 'How should the protection account for the extra rushers? Review who is available to block and how the quarterback moves.';
 return 'How does the highlighted defender approach the quarterback? Review the blockers’ movement and the space the quarterback uses.';
}
export function protectionView(tracking,qbId,defenderId){
 const indices=tracking.players.map((p,i)=>[p,i]).filter(([p])=>p.id===qbId||p.id===defenderId).map(([,i])=>i);
 const points=tracking.frames.flatMap(f=>indices.map(i=>[f[3][i*2],f[3][i*2+1]]).filter(p=>p.every(Number.isFinite)));
 if(!points.length)return {span:120,x0:0,y0:-.5};
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys);
 const ratio=1004/544,span=Math.min(140,Math.max(36,hiX-loX+14,(hiY-loY+14)*ratio)),height=span/ratio;
 return {span,x0:(loX+hiX-span)/2,y0:(loY+hiY-height)/2};
}
