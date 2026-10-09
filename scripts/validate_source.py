"""Independent raw-data checks against the published browser bundle."""
import csv,json,pathlib,collections,hashlib,argparse
p=argparse.ArgumentParser();p.add_argument('--input',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args()
def rows(name):
 with open(a.input/name,newline='') as f: yield from csv.DictReader(f)
bundle=json.loads((a.output/'brief.json').read_text());actual={x['id']:x for x in bundle['plays']}
raw=list(rows('plays.csv'));expected={}
for r in raw:
 penalty=r['penaltyYards'] not in ('NA','') or any(r['foulName'+str(i)] not in ('NA','') for i in [1,2,3])
 if penalty or 'no play' in r['playDescription'].lower() or 'two-point' in r['playDescription'].lower():continue
 expected[r['gameId']+'_'+r['playId']]=r
assert set(expected)==set(actual)
sc=collections.defaultdict(list)
for r in rows('pffScoutingData.csv'):sc[r['gameId']+'_'+r['playId']].append(r)
for k,r in expected.items():
 p=actual[k];s=sc[k];pressure={v['nflId'] for v in s if '1' in [v['pff_hit'],v['pff_hurry'],v['pff_sack']]};rush={v['nflId'] for v in s if v['pff_role'].lower()=='pass rush'}
 assert set(p['pressure'])==pressure and set(p['rushers'])==rush
 assert p['yards']==int(r['playResult']) and p['coverage']==r['pff_passCoverage']
# Validate original-coordinate identity at all frames of one play from every game.
checked=0
for path in sorted((a.output/'tracking').glob('*.json')):
 game=path.stem;group=json.loads(path.read_text());playid=sorted(group,key=int)[0];replay=group[playid]
 lookup={(f[0],v['id']):(f[3][i*2],f[3][i*2+1]) for f in replay['frames'] for i,v in enumerate(replay['players'])}
 raw_count=0
 for r in rows('tracking/tracking_'+game+'.csv'):
  if r['playId']!=playid:continue
  x,y=float(r['x']),float(r['y'])
  if r['playDirection']=='left':x,y=120-x,160/3-y
  bx,by=lookup[(int(r['frameId']),r['nflId'])]
  assert abs(bx-x)<=.0051 and abs(by-y)<=.0051
  raw_count+=1
 assert raw_count==len(lookup);checked+=1
print(json.dumps({'eligiblePlaysMatched':len(actual),'scoutingJoinsMatched':len(actual),'gamesWithRawCoordinateChecks':checked,'status':'passed'},indent=2))
