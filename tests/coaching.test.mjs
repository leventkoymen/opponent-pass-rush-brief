import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chooseDefender,reviewStages,outcomeText,reviewPrompt,protectionView} from '../dist/coaching.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data/brief.json',import.meta.url)));
const bundle=JSON.parse(fs.readFileSync(new URL('../dist/data/tracking/2021092601.json',import.meta.url)));
const play=data.plays.find(p=>p.id==='2021092601_3491'),tracking=bundle['3491'];
test('guided example highlights Garrett, preserves Fields and lands on observed sack',()=>{
 const id=chooseDefender(play,tracking);assert.equal(data.players[id].name,'Myles Garrett');assert.equal(data.players[play.qb].name,'Justin Fields');
 const stages=reviewStages(tracking);assert.equal(tracking.frames[stages.start][1],0);assert.equal(tracking.frames[stages.end][1],3.9);assert.ok(tracking.frames[stages.end][2].includes('qb_sack'));assert.ok(stages.watch>stages.start&&stages.watch<stages.end);
 assert.match(outcomeText(play),/lost 13 net yards/);assert.match(reviewPrompt(play),/without a blocker being charged/);
});
test('spotlight prefers credited sack then hit, never invents pressure for a no-credit play',()=>{
 const players=[{id:'a',team:'D',role:'Pass Rush',credit:['hurry']},{id:'b',team:'D',role:'Pass Rush',credit:['sack']},{id:'q',team:'O',role:'Pass',credit:[]}];
 assert.equal(chooseDefender({defense:'D'},{players}), 'b');assert.equal(chooseDefender({defense:'D'},{players},[],'a'),'a');assert.equal(chooseDefender({defense:'D'},{players},[],'q'),'b');
 assert.equal(chooseDefender({defense:'D'},{players:players.map(p=>({...p,credit:[]}))},[{id:'a',pressure:10},{id:'b',pressure:1}]),'a');
 assert.equal(chooseDefender({defense:'D'},{players:[]}),null);
});
test('missing event and snap tags use first/last observed frames with no invented timing',()=>{
 const stages=reviewStages({snap:null,frames:[[1,0,[],[]],[2,.1,[],[]],[3,.2,[],[]]]});assert.deepEqual(stages,{start:0,watch:1,end:2,hasSnap:false,event:null});
});
test('protection crop contains both key players through the entire example',()=>{
 const id=chooseDefender(play,tracking),v=protectionView(tracking,play.qb,id),height=v.span/(1004/544);
 const ii=tracking.players.map((p,i)=>[p,i]).filter(([p])=>[play.qb,id].includes(p.id)).map(([,i])=>i);
 for(const f of tracking.frames)for(const i of ii){const [x,y]=f[3].slice(i*2,i*2+2);assert.ok(x>v.x0&&x<v.x0+v.span);assert.ok(y>v.y0&&y<v.y0+height);}
});
