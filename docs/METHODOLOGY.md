<!-- Original implementation notes retained; see ../README.md for current AWS project status. -->
# Detailed implementation and methodology

A working historical coaching demo for NFL 2021 Weeks 1–8. Includes all 32 defenses, 7,767 eligible dropbacks, three auditable takeaways, and observed tracking replays for every eligible play. No fabricated play or player data.

## Run

Requires Node 18+ to run and test. Python 3 is needed only to rebuild the data. No dependency installation or build step.

```sh
npm start
# Open http://localhost:4173
npm test
```

Alternatively: `python3 -m http.server 4173 --directory dist`.

The application must be served over HTTP, not opened as a file. Internet access is only needed for optional source links; the interface uses local system fonts, and bundled metrics and replays work offline. The static app fetches a roughly 4 MB play index once and lazily loads one game of tracking at a time, retaining up to five game bundles.

## Coach's flow

1. Choose the defense, down and distance. Every denominator updates together.
2. Read pressure sources, five-plus-rusher frequency and the leading PFF coverage label.
3. Select a takeaway to see its exact supporting plays. Search player names, descriptions or source keys; sort by pressure, chronological order or gain.
4. Review real tracking with a named defender and quarterback, one Play button and a timeline. Expand optional sections for three guided stages, speed, frame steps, rush paths, full-field view, event jumps, timing and scouting labels.
5. Export the currently matching evidence list to CSV. Opponent, down, distance and selected play are preserved in the URL; evidence focus and search are session-only.

## Data provenance and missing materials

The requested `/workspace/nfl-analysis/report.md`, `opportunity_map.png` and `example_play.png` were not available in the current workspace or local document/download search. Their content has not been reconstructed or presented as inspected.

The public source was independently retrieved from:
https://github.com/ThompsonJamesBliss/nfl-big-data-bowl-regional-event-data

Pinned revision: `85da22eeff2f1d5be106faa9dfe06a1205f2defd`.

Source attribution: NFL Next Gen Stats tracking; Pro Football Focus scouting. The downloaded files contain 122 games, 8,557 plays, 188,254 scouting rows and 8,314,178 tracking observations. The UI and `dist/data/audit.json` expose source provenance and validation anchors.

## Definitions

- **Eligible sample:** exclude recorded penalty yardage, any recorded foul name, “No Play” descriptions and two-point attempts. This yields 7,767 passing-situation plays. It is not the denominator for every offensive snap.
- **Team pressure:** at least one PFF hit/hurry/sack credit on an eligible play. Count each play once.
- **Rusher pressure reps:** unique credited player-play pass-rush reps divided by the player's PFF Pass Rush reps. Count any hit/hurry/sack union once per rep. Rank by credited volume; this is not a talent ranking.
- **Extra rushers:** at least five unique players with PFF Pass Rush role. This is not a complete scheme-defined blitz metric. Four-rusher and five-plus pressure rates use their own denominators.
- **Coverage:** PFF labels divided by plays with a known label, with unknown counts shown.
- **Small samples:** flag splits below 30 plays; the threshold is a presentation heuristic, not a significance test.
- **Pressure allowed:** separate PFF attribution. No blocker is inferred to have failed from defensive pressure or proximity alone.

## Tracking limitations

Coordinates are observed, rounded to 0.01 yard and normalized so offense moves right (left-moving plays rotate 180 degrees). Equal yard scale is preserved on both canvas axes. The blue line is the ball's x-coordinate at the snap; gold is the line to gain, capped at the goal line. Protection view fits the full observed paths of the selected defender and quarterback with a stable camera. Use full field for other players outside this crop. Player trails identify movement, not responsibilities or wins. The orange ring identifies the defender selected for review; the gold diamond identifies the quarterback; white squares identify PFF Pass Block players. Pressure credit is stated separately and applies to the whole play, **not the instant pressure began**.

The default defender is a credited player, preferring sack, then hit, then hurry credits and using filtered pressure volume as a tie-break. A pressure-source evidence selection takes precedence when that defender is present. Without credits, the app chooses a labeled pass rusher and explicitly says there is no pressure credit. Users can select another defender. These rules are viewing aids, not a model of responsibility or a claim about who was decisive.

The guided middle stage is a frame midway between the recorded snap (or first supplied frame) and the recorded throw/sack (or last supplied frame). It is labeled only as observed movement, never as pressure onset. Missing snap or result events remain explicit. The headline outcome comes from the play record and may extend past tracking coverage.

The public timestamps have whole-second precision. Timings use frame differences at the NFL's documented 10 Hz sample rate: https://operations.nfl.com/gameday/technology/nfl-next-gen-stats . The recorded `ball_snap` takes precedence over `autoevent_ballsnap`; absent snap tags are explicit. There are 23 eligible plays without a snap tag. Throw and sack timings are shown only when the corresponding event exists. Movement is straight-line QB displacement from snap, not cumulative distance or a pocket-quality metric. Replays do not interpolate, extrapolate or synthesize coordinates. Missing player positions are omitted.

Tracking commonly spans shortly before the snap to shortly after release; full-route, catch-point, YAC and complete pre-snap motion analysis are not supported. Recorded play outcomes can extend past the supplied tracking window. Rates are descriptive, with no causal interpretation; sacks contribute directly to pressure-group yardage outcomes.

## Rebuild and verify

Raw data are not duplicated in this repository. Downloading the source takes about 865 MB of disk space.

```sh
python3 scripts/download_data.py --output /path/to/raw-data
python3 scripts/prepare_data.py --input /path/to/raw-data --output dist/data
npm test
python3 scripts/validate_source.py --input /path/to/raw-data --output dist/data
```

The pipeline checks unique scouting keys, complete 22-player scouting joins and finite coordinates. Automated tests verify historical anchors, every team/down/distance partition, the evidence behind each takeaway, zero-sample behavior, separate pressure attribution, QB movement and all 7,767 replay structures. The independent raw validation compares every eligible play's pressure/rusher IDs and outcomes, then every coordinate of one eligible play in each of the 122 games.

Validation anchors: Cleveland pressure **93/227 (41.0%)**; Myles Garrett **40/179 (22.3%)**; five-plus-rusher pressure **46.1%** versus four-rusher pressure **33.2%**.

## Implementation

Buildless HTML/CSS/ES modules, pure metric functions, canvas field replay, Python standard-library data pipeline. There is no account system, prediction model, data-upload backend or current-season feed. Sites deployment is private to the owner. The `.openai/hosting.json` records its exact site identity.
