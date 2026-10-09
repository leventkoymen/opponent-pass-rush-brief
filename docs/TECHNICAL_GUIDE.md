# Opponent Pass-Rush Brief

**A coaching brief with the plays behind it.** Select an opponent and down/distance, identify pressure sources and defensive tendencies, then inspect real tracking replays. Built for an offensive-line or offensive coach preparing protections.

**Historical scope:** NFL 2021, Weeks 1–8. **32 defenses · 122 games · 7,767 eligible plays with replays.** Scouting is from Pro Football Focus; tracking is from NFL Next Gen Stats. No fabricated plays, coordinates or performance claims.

## Project status

| Area | Status |
| --- | --- |
| Working coaching application | Implemented and locally/browser tested |
| Live AWS demo | [Open the Film Room](https://production.dq0yh80z3cam4.amplifyapp.com/); public Amplify deployment in London |
| NFL/PFF data preparation | Implemented; pinned source and reproducible metrics |
| AWS architecture | Amplify Hosting; manual ZIP upload; browser-side metrics and replay |
| Alternative AWS template | S3/CloudFront CloudFormation definition; locally validated, not used for the live site |
| AWS processing pipeline | CodeBuild proposed as a later milestone; not provisioned |
| Generative AI / predictive model | Not used by the current product |

No particular AWS service is required by the event according to the project owner. The service choices below follow the MVP's actual needs. The organizer's exact submission format has not been supplied; the included worksheet is a draft.

## The coaching workflow

The default screen has one path: **choose a defense → watch a play → read the result**. Orange identifies the defender to watch; gold identifies the quarterback to protect. Names and jersey numbers match the field labels. One Play button animates the real tracking; the timeline lets the coach inspect movement.

Optional sections keep the first view short:

- **Filter by game situation** — down and distance, with active filters and sample size visible beside the defense selection.
- **Choose another play** — supporting plays, search, evidence filters and sorting.
- **See the opponent’s three tendencies** — pressure sources, five-plus-rusher frequency and coverage, with denominators and evidence links.
- **Replay controls & play details** — player selection, guided stages, frame steps, timing, scouting records and full-field view.
- **New to football?** — a short guide to the players and shapes.

The initial Cleveland example highlights Myles Garrett (#95) and Justin Fields (#1). “Reset to example” restores that play and collapses the optional browsing sections.

Example validation anchors: Cleveland generated pressure on **93/227 eligible dropbacks (41.0%)**. Myles Garrett received pressure credit on **40/179 pass-rush reps (22.3%)**. These are historical descriptive counts, not forecasts or proof of individual blocker failure.

## Run locally

**Node.js 18 or newer is the only requirement to run the website.** No package installation, account, API key or build step is needed. The processed data are included. Python is only needed if rebuilding from raw CSVs.

1. Extract the project download.
2. On macOS, open **Start Film Room.command**. On Windows, open **Start Film Room.bat**. Alternatively, open a terminal in the project folder and run:

```sh
npm start
```

3. Your browser opens [http://127.0.0.1:4173](http://127.0.0.1:4173). Keep the terminal window open while using the app; press Ctrl+C to stop it.

The server listens only on this computer. This is a local website, not a public deployment. Do not open `index.html` directly: browsers need HTTP to load the bundled JSON. The interface, fonts, metrics and replays work offline; only optional source-reference links require internet access.

If the port is busy: `npm start -- --port 4174`. To avoid opening a browser automatically: `npm start -- --no-open`. To run checks: `npm test`. If Node is unavailable, the equivalent Python fallback is `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`, followed by opening the local URL yourself.

## AWS hosting

The [live demo](https://production.dq0yh80z3cam4.amplifyapp.com/) runs on AWS Amplify Hosting in London (`eu-west-2`), app `dq0yh80z3cam4`, branch `production`. Deployment 2 succeeded on 9 October 2026. The uploaded ZIP contains the contents of `dist/`; Python preparation runs locally and filtered metrics and animation run in the browser.

The site is public, including its processed JSON. It uses manual uploads rather than an automatic GitHub deployment. The included S3/CloudFront template and deployment script are an unused alternative, not a description of the live infrastructure.

See [architecture](AWS_ARCHITECTURE.md), [deployment instructions](AWS_DEPLOYMENT.md) and the [submission and recording guide](HACKATHON_SUBMISSION.md).

## Data and methodology

Pinned source: [NFL Big Data Bowl regional event dataset](https://github.com/ThompsonJamesBliss/nfl-big-data-bowl-regional-event-data), revision `85da22eeff2f1d5be106faa9dfe06a1205f2defd`.

| Input / output | Count |
| --- | ---: |
| Games | 122 |
| Original plays | 8,557 |
| Player scouting rows | 188,254 |
| Original tracking observations | 8,314,178 |
| Excluded plays | 790 |
| Eligible plays / replays | 7,767 |

Eligibility excludes recorded penalty yardage or foul names, “No Play” descriptions and two-point attempts. This is a passing-situation sample, not every offensive snap.

- **Team pressure:** any PFF hit/hurry/sack credit on a play, counted once.
- **Rusher pressure rate:** credited pass-rush reps divided by that player's pass-rush reps; multiple credit types on one rep count once.
- **Extra-rusher frequency:** at least five unique PFF Pass Rush players divided by eligible dropbacks. This is not a complete blitz-scheme label.
- **Coverage tendency:** a PFF coverage label's count divided by plays with known coverage; unknown labels are reported separately.
- **Blocker responsibility:** PFF pressure-allowed labels are shown separately; pressure or proximity does not establish a blocker failure.

Small splits under 30 plays are flagged. Rates are descriptive associations, not causal claims. The [full methodology](METHODOLOGY.md) documents timing, coordinates, denominators and limitations. `dist/data/audit.json` contains machine-readable counts and source file hashes.

The originally referenced `/workspace/nfl-analysis/report.md`, `opportunity_map.png` and `example_play.png` were unavailable. Their contents have not been presented as inspected; this project independently rebuilt the brief from the public CSVs.

## Tracking limitations

The app uses observed coordinates and rotates left-moving offenses so every replay moves right. Timing uses frame differences at 10 Hz because the source timestamps have whole-second precision. The recorded snap tag takes precedence over the automatic tag. Twenty-three eligible plays lack a snap tag; the app does not invent one.

Throw/sack timing requires the corresponding event tag. QB displacement measures movement from snap, not protection quality or intended reads. Tracking stops at the supplied window, so complete routes, catch points, YAC and full pre-snap motion are not reliably supported. The orange ring identifies the selected defender to watch; a separate label states whether that player has a whole-play pressure credit. It does not indicate pressure onset. The gold diamond marks the quarterback; white squares mark PFF Pass Block players.

## Rebuild and verify

Raw CSVs are not duplicated in this source package. Rebuilding downloads about 865 MB of source CSV data.

```sh
python3 scripts/download_data.py --output /path/to/raw-data
python3 scripts/prepare_data.py --input /path/to/raw-data --output dist/data
npm test
python3 scripts/validate_source.py --input /path/to/raw-data --output dist/data
```

Tests cover historical anchors, all team/down/distance partitions, takeaway evidence counts, empty samples, attribution and all 7,767 replay structures. AWS template tests check the publication default, bucket isolation, origin restrictions and release/caching configuration. The independent raw validator checks every eligible play's pressure/rusher IDs and outcomes, plus every coordinate of one play in each of 122 games. `source-validation.json` records the prior successful raw-data check.

The 15 automated tests include key-player selection, missing timing tags and the protection camera, local HTTP serving, missing-file responses and refusal to serve files outside the app. Desktop and 390px mobile browser checks passed for the guided replay, manual player selection, uncredited players, missing snap tags and empty search results. The Amplify deployment was separately checked for live replay and example tendency counts. Template tests cover only the unused S3/CloudFront alternative.

## Repository guide

```text
Start Film Room.command       macOS local launcher
Start Film Room.bat           Windows local launcher
scripts/serve.mjs             Local website server; Node built-ins only
dist/                         Browser application and processed dataset
  data/audit.json              Data provenance and validation anchors
  data/brief.json              Eligible plays, player lookup and scouting labels
  data/tracking/               Per-game observed tracking bundles
scripts/                      Source download, preparation and raw validation
infra/aws/template.json       CloudFormation infrastructure definition
tests/                        Metric/replay and AWS template tests
docs/AWS_ARCHITECTURE.md       Service choices, diagram and delivery milestones
docs/AWS_DEPLOYMENT.md         Deployment, access, rollback and cleanup runbook
docs/HACKATHON_SUBMISSION.md   Submission draft and demonstration script
docs/METHODOLOGY.md            Detailed original implementation/data notes
```

No ownership or license for NFL/PFF data is asserted by this repository. Use the event's applicable dataset terms when choosing submission and hosting access. Complete the remaining event and team fields before submission; the live AWS URL and Region are recorded above.
