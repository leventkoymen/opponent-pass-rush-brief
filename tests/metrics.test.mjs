import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {filterPlays,summarize,evidence,percentage,movement} from '../dist/metrics.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data/brief.json',import.meta.url)));
test('historical anchors independently reproduce earlier analysis',()=>{
 assert.equal(data.plays.length,7767);const s=summarize(filterPlays(data.plays,{team:'CLE'}));assert.equal(s.n,227);assert.equal(s.pressure,93);assert.equal(percentage(s.pressure,s.n),'41.0%');
 const g=s.rushers.find(p=>data.players[p.id].name==='Myles Garrett');assert.deepEqual([g.pressure,g.reps],[40,179]);assert.equal(percentage(g.pressure,g.reps),'22.3%');
 const all=summarize(data.plays);assert.equal(percentage(all.fivePressure,all.five),'46.1%');assert.equal(percentage(all.fourPressure,all.four),'33.2%');
});
test('all 32 teams and down/distance partitions reconcile to source sample',()=>{
 const teams=[...new Set(data.plays.map(p=>p.defense))];assert.equal(teams.length,32);let total=0;
 for(const team of teams){const all=filterPlays(data.plays,{team});total+=all.length;const splits=['short','medium','long','verylong'].flatMap(distance=>['1','2','3','4'].flatMap(down=>filterPlays(data.plays,{team,down,distance})));assert.equal(splits.length,all.length);assert.equal(new Set(splits.map(p=>p.id)).size,all.length);}
 assert.equal(total,7767);
});
test('every takeaway evidence set agrees with its denominator and numerator',()=>{
 for(const team of new Set(data.plays.map(p=>p.defense))){for(const down of ['all','1','2','3','4']){const p=filterPlays(data.plays,{team,down}),s=summarize(p);assert.equal(evidence(p,'extra').length,s.five);assert.equal(evidence(p,'pressure').length,s.pressure);for(const r of s.rushers)assert.equal(evidence(p,`player:${r.id}`).length,r.pressure);for(const [cov,n]of s.coverage)assert.equal(evidence(p,`coverage:${cov}`).length,n);}}
});
test('empty samples have undefined rate, never a fabricated zero',()=>{assert.equal(percentage(0,0),'—');assert.equal(summarize([]).n,0);assert.deepEqual(evidence([],'extra'),[]);});
test('pressure counted once per play, with separate player reps and unknown coverage denominator',()=>{
 const base={game:'g',rushers:['a','b','c','d','e'],pressure:['a','b'],allowed:[],coverage:'Cover-1'};
 const s=summarize([base,{...base,pressure:[],coverage:null,rushers:['a','b','c','d']}]);assert.equal(s.pressure,1);assert.equal(s.five,1);assert.equal(s.coverageN,1);assert.equal(s.noAllowed,1);assert.equal(s.rushers.find(r=>r.id==='a').reps,2);
});
test('QB displacement uses observed snap coordinates and handles absent observations',()=>{
 const r={snap:0,players:[{id:'q'}],frames:[[1,0,[],[1,2]],[2,.1,[],[4,6]]]};assert.equal(movement(r,1,'q'),5);assert.equal(movement(r,1,'unknown'),null);assert.equal(movement({...r,snap:null},1,'q'),null);
});
test('all 7,767 replay files contain real positions, ordered 10Hz frames and valid snap/event timing',()=>{
 let total=0,missingSnap=0;const plays=new Map(data.plays.map(p=>[p.id,p]));
 for(const file of fs.readdirSync(new URL('../dist/data/tracking/',import.meta.url))){const game=file.replace('.json','');const bundle=JSON.parse(fs.readFileSync(new URL(`../dist/data/tracking/${file}`,import.meta.url)));
  for(const [id,r]of Object.entries(bundle)){const p=plays.get(`${game}_${id}`);assert.ok(p);assert.ok(p.tracking);total++;assert.equal(r.players.length,23);assert.ok(r.frames.length>0);const ids=new Set(r.players.map(p=>p.id));assert.equal(ids.size,23);
   if(r.snap===null)missingSnap++;else{assert.equal(r.frames[r.snap][1],0);assert.ok(r.frames[r.snap][2].includes(r.snapSource));if(r.frames.some(f=>f[2].includes('ball_snap')))assert.equal(r.snapSource,'ball_snap');}
   for(let i=0;i<r.frames.length;i++){const f=r.frames[i];assert.equal(f[3].length,46);assert.ok(f[3].every(v=>v===null||Number.isFinite(v)));if(i){assert.ok(f[0]>r.frames[i-1][0]);assert.ok(Math.abs((f[1]-r.frames[i-1][1])-(f[0]-r.frames[i-1][0])/10)<1e-6);}}
   assert.equal(r.players.filter(p=>p.role==='Pass Rush').length,p.rushers.length);
  }
 }
 assert.equal(total,7767);assert.equal(missingSnap,data.audit.playsWithoutSnap);
});
