"""Reproducible CSV -> browser data. Standard library only; no simulated positions."""
import argparse, csv, json, collections, hashlib, pathlib, datetime, math
SOURCE='https://github.com/ThompsonJamesBliss/nfl-big-data-bowl-regional-event-data'
REV='85da22eeff2f1d5be106faa9dfe06a1205f2defd'
def known(v): return v not in ('', 'NA', None)
def rows(p):
 with open(p,newline='') as f: yield from csv.DictReader(f)
def key(r): return r['gameId']+'_'+r['playId']
def exclusions(r):
 reasons=[]
 if known(r['penaltyYards']) or any(known(r['foulName'+str(i)]) for i in range(1,4)): reasons.append('recorded penalty')
 if 'no play' in r['playDescription'].lower(): reasons.append('No Play')
 if 'two-point' in r['playDescription'].lower(): reasons.append('two-point attempt')
 return reasons
def write(p,obj): p.parent.mkdir(exist_ok=True,parents=True);p.write_text(json.dumps(obj,separators=(',',':'),allow_nan=False))
def run(root,out):
 games={r['gameId']:r for r in rows(root/'games.csv')}
 players={r['nflId']:{'name':r['displayName'],'position':r['officialPosition']} for r in rows(root/'players.csv')}
 raw=list(rows(root/'plays.csv')); scouts=collections.defaultdict(list);seen=set();count=0
 for r in rows(root/'pffScoutingData.csv'):
  sk=(key(r),r['nflId']);assert sk not in seen,'Duplicate scouting key';seen.add(sk);scouts[key(r)].append(r);count+=1
 plays=[];playmap={};excluded=collections.Counter()
 for r in raw:
  ex=exclusions(r)
  if ex: excluded.update(ex);continue
  k=key(r);s=scouts[k];assert len(s)==22,(k,len(s))
  credited=lambda z:any(z[f'pff_{a}']=='1' for a in ('hit','hurry','sack'))
  rush=[z for z in s if z['pff_role']=='Pass Rush']
  p={'id':k,'game':r['gameId'],'play':int(r['playId']),'week':int(games[r['gameId']]['week']),
   'defense':r['defensiveTeam'],'offense':r['possessionTeam'],'down':int(r['down']),'distance':int(r['yardsToGo']),
   'quarter':int(r['quarter']),'clock':r['gameClock'],'yards':int(r['playResult']),'result':r['passResult'],
   'description':r['playDescription'],'formation':r['offenseFormation'],'personnel':r['personnelO'],
   'coverage':r['pff_passCoverage'] if known(r['pff_passCoverage']) else None,'coverageType':r['pff_passCoverageType'],
   'playAction':r['pff_playAction']=='1','rushers':[z['nflId'] for z in rush],
   'pressure':[z['nflId'] for z in s if credited(z)],
   'allowed':[z['nflId'] for z in s if any(z[f'pff_{a}Allowed']=='1' for a in ('hit','hurry','sack'))],
   'qb':next((z['nflId'] for z in s if z['pff_role']=='Pass'),None),'tracking':False}
  assert k not in playmap;plays.append(p);playmap[k]=p
 track_rows=0;eligible_track_rows=0;missing_snap=0;tracking_files=sorted((root/'tracking').glob('tracking_*.csv'))
 for fi,path in enumerate(tracking_files):
  grouped=collections.defaultdict(list)
  for r in rows(path):
   track_rows+=1
   if key(r) in playmap: grouped[key(r)].append(r);eligible_track_rows+=1
  bundle={}
  for k,rr in grouped.items():
   p=playmap[k];sr={r['nflId']:r for r in scouts[k]};ids=list(dict.fromkeys(r['nflId'] for r in rr));indices={v:i for i,v in enumerate(ids)}
   pr=[]
   for id in ids:
    r=next(x for x in rr if x['nflId']==id);s=sr.get(id,{})
    pr.append({'id':id,'jersey':r['jerseyNumber'],'team':r['team'],'role':s.get('pff_role','Ball'),'alignment':s.get('pff_positionLinedUp',''),
     'credit':[z for z in ('hit','hurry','sack') if s.get('pff_'+z)=='1']})
   frames={};direction=rr[0]['playDirection'];assert direction in ('left','right')
   for r in rr:
    fid=int(r['frameId']);tm=datetime.datetime.fromisoformat(r['time']).timestamp()
    f=frames.setdefault(fid,{'time':tm,'events':set(),'xy':[None]*(len(ids)*2)})
    if known(r['event']) and r['event']!='None': f['events'].add(r['event'])
    x,y=float(r['x']),float(r['y']);assert math.isfinite(x) and math.isfinite(y)
    if direction=='left':x,y=120-x,160/3-y
    j=indices[r['nflId']]*2;assert f['xy'][j] is None,'Duplicate frame/player';f['xy'][j:j+2]=[round(x,2),round(y,2)]
   fs=sorted(frames);snap=next((i for i,fid in enumerate(fs) if 'ball_snap' in frames[fid]['events']),None)
   snap_source='ball_snap'
   if snap is None:
    snap=next((i for i,fid in enumerate(fs) if 'autoevent_ballsnap' in frames[fid]['events']),None);snap_source='autoevent_ballsnap'
   if snap is None:missing_snap+=1
   origin=frames[fs[snap if snap is not None else 0]]['time']
   ff=[[fid,round((fid-fs[snap if snap is not None else 0])/10,1),sorted(frames[fid]['events']),frames[fid]['xy']] for fid in fs]
   p['tracking']=True
   bundle[str(p['play'])]={'players':pr,'frames':ff,'snap':snap,'snapSource':snap_source if snap is not None else None,'direction':direction}
  game=path.stem.split('_')[1];write(out/'tracking'/f'{game}.json',bundle)
  if (fi+1)%20==0:print(f'Processed {fi+1}/{len(tracking_files)} tracking files',flush=True)
 assert len(plays)==len(playmap)
 pressure=[p for p in plays if p['pressure']];five=[p for p in plays if len(p['rushers'])>=5];four=[p for p in plays if len(p['rushers'])==4]
 rate=lambda xs:round(100*sum(bool(p['pressure']) for p in xs)/len(xs),4) if xs else None
 cle=[p for p in plays if p['defense']=='CLE'];garrett=next(id for id,p in players.items() if p['name']=='Myles Garrett')
 reps=[p for p in cle if garrett in p['rushers']]
 audit={'source':SOURCE,'revision':REV,'games':len(games),'rawPlays':len(raw),'scoutingRows':count,'eligiblePlays':len(plays),
  'excludedPlays':len(raw)-len(plays),'exclusionReasonsOverlapping':dict(excluded),'trackingFiles':len(tracking_files),'trackingRows':track_rows,
  'eligibleTrackingRows':eligible_track_rows,'frameRateHz':10,'timingBasis':'Frame differences at 10 Hz; ball_snap preferred over autoevent_ballsnap. Source time strings have only whole-second precision.',
  'playsWithTracking':sum(p['tracking'] for p in plays),'playsWithoutSnap':missing_snap,
  'pressurePlays':len(pressure),'fivePlus':{'n':len(five),'pressureRate':rate(five)},'four':{'n':len(four),'pressureRate':rate(four)},
  'cleveland':{'n':len(cle),'pressure':sum(bool(p['pressure']) for p in cle)},'garrett':{'reps':len(reps),'pressure':sum(garrett in p['pressure'] for p in reps)},
  'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in root.glob('*.csv')},
  'missingOriginalMaterials':['/workspace/nfl-analysis/report.md','/workspace/nfl-analysis/opportunity_map.png','/workspace/nfl-analysis/example_play.png']}
 write(out/'brief.json',{'plays':plays,'players':players,'audit':audit});write(out/'audit.json',audit)
 print(json.dumps(audit,indent=2))
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--input',type=pathlib.Path,required=True);a.add_argument('--output',type=pathlib.Path,required=True);v=a.parse_args();run(v.input,v.output)
