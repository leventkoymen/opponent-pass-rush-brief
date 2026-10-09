"""Download the exact public source snapshot (~850 MB tracking + 16 MB metadata)."""
import argparse,pathlib,subprocess,concurrent.futures,json
REV='85da22eeff2f1d5be106faa9dfe06a1205f2defd'
BASE='https://raw.githubusercontent.com/ThompsonJamesBliss/nfl-big-data-bowl-regional-event-data/'+REV+'/'
p=argparse.ArgumentParser();p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
for name in ['games.csv','plays.csv','players.csv','pffScoutingData.csv']:
 subprocess.run(['curl','--retry','2','-fLsS',BASE+'data/'+name,'-o',str(a.output/name)],check=True)
import csv
with open(a.output/'games.csv') as f:games=[r['gameId'] for r in csv.DictReader(f)]
(a.output/'tracking').mkdir(exist_ok=True)
def download(game):
 target=a.output/'tracking'/('tracking_'+game+'.csv')
 subprocess.run(['curl','--retry','2','-fLsS',BASE+'data/tracking/'+target.name,'-o',str(target)],check=True)
 return game
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for i,g in enumerate(pool.map(download,games)):
  if (i+1)%20==0:print(i+1,'games downloaded',flush=True)
print('Downloaded source snapshot',REV)
