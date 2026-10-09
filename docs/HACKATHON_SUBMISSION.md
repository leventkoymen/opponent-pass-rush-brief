# Hackathon submission worksheet

This is a project-specific draft, not a claim to match an organizer's unseen submission template. Fill the remaining event and team fields before submission.

## Project

**Title:** Opponent Pass-Rush Brief — The Film Room

**One-line pitch:** Give offensive-line and offensive coaches three defensible opponent tendencies, then let them inspect the real plays and tracking behind every takeaway.

**Problem:** Coaches need to decide which pressure sources and situations deserve preparation. Aggregate rates alone can hide sample-size differences and cannot establish who failed a protection assignment.

**Solution:** Select the defense and down/distance, read pressure-source, extra-rusher and coverage summaries, then open the exact evidence set and replay observed movement with timing, outcomes and separate PFF attributions.

## What works now

- All 32 teams, 122 games, NFL 2021 Weeks 1–8.
- 7,767 eligible passing-situation plays and corresponding tracking replays.
- Filtered denominators, explicit small-sample states, search and CSV evidence export.
- A simple default screen with a defense selector, named players, distinct shapes, movement trails and one Play button. Statistics, play browsing and advanced controls are optional.
- Scrubbing, speed controls, frame steps, event jumps, rush paths, QB displacement and protection/full-field views; advanced records are expandable.
- Tested metric definitions and source-level checks, with no simulated player positions.

The prior analysis's report and example images were unavailable. The project independently rebuilt the metrics from the pinned public NFL/PFF source and records that provenance in the app.

## AWS contribution

**Live:** [AWS demo](https://production.dq0yh80z3cam4.amplifyapp.com/) on AWS Amplify Hosting in Europe (London), `eu-west-2`, using the `production` branch. Deployment 2 succeeded on 9 October 2026; live replay and example tendency counts were checked in Chrome.

**Source:** [GitHub repository](https://github.com/leventkoymen/opponent-pass-rush-brief). Python prepares the data locally; JavaScript computes filtered summaries and renders replays in the browser.

The repository also includes an unused S3/CloudFront CloudFormation alternative. It is not the infrastructure used for the live demo. Bedrock, Lambda, Athena, CodeBuild and machine learning are not used by the current product.

## Three-minute demonstration

| Time | Show | Explain |
| --- | --- | --- |
| 0:00–0:20 | “Protect the quarterback” and the defense selector | You are the offensive-line coach. Your blockers try to keep defenders away from the player throwing the ball. |
| 0:20–1:10 | Press Play on the default Garrett/Fields example | Follow orange #95 Garrett and protect gold #1 Fields. Their trails show actual movement. The recorded result is a sack and 13-yard loss; the sack tag is 3.9 seconds after the snap. No blocker is charged with allowing pressure. |
| 1:10–1:50 | Expand “See the opponent’s three tendencies” | Who needs attention? Garrett, with 40 credited plays out of 179 rush attempts. How often do extra defenders rush? 51/227 plays. What coverage is behind it? Cover-3, explained in plain language, on 80/227 labeled plays. |
| 1:50–2:15 | Expand the situation filter, then “Choose another play” | All denominators and evidence sets recalculate together; acknowledge the smaller sample. |
| 2:15–2:35 | Methodology and source audit | 7,767 eligible plays from 2021; actual observed coordinates; pressure does not establish a blocker failure. |
| 2:35–3:00 | AWS diagram and actual deployment evidence | Describe only the services actually deployed; summarize the next useful step |

The example play has PFF pressure credited to Garrett and no blocker charged with pressure allowed. Use it to explain why a pressure credit alone does not establish a blocker failure. The path and elapsed time do not reveal assignment or pressure onset.

## Recording the backup video

Keep the live AWS URL as the primary demo. Record a 90-second MP4 as a backup and keep a copy on the presentation laptop. Upload a separate copy to the event's submission portal or another accepted video host; do not rely on a player inside the demo website if the backup is meant to cover a website outage. The recording file and upload destination have not yet been supplied, so no video has been recorded or uploaded by this project.

Record only the application window, with readable player names and narration:

| Time | Action | Suggested narration |
| --- | --- | --- |
| 0–15 sec | Show the defense selector and default Cleveland play | “I’m the offensive-line coach. My job is to give our quarterback time to throw.” |
| 15–40 sec | Press Play, pause midway, point to the two named players | “Orange is Myles Garrett, the defender to watch. Gold is Justin Fields, the quarterback to protect. These paths are recorded player movement.” |
| 40–55 sec | Show the recorded result and expand the coach review question | “The result is a sack and a 13-yard loss. Pressure was credited, but no blocker was charged with allowing it. That’s a reason to review the play, not assign blame.” |
| 55–75 sec | Expand the three opponent tendencies | “The brief shows pressure sources, extra rushers and coverage, with sample sizes. Each finding links to the supporting plays.” |
| 75–90 sec | Open one supporting play; finish on the main view | “This is a historical prototype using 2021 weeks 1–8. It helps a coach decide what to review next.” |

Record the live Amplify site and show its AWS address. After uploading, verify that a judge can open the video link and that sound and text are clear. Keep a downloaded MP4 as well as the link.

## Validation and limitations

Cleveland pressure reproduces 93/227 (41.0%). Garrett reproduces 40/179 (22.3%). Dataset pressure with five-plus rushers is 46.1%, compared with 33.2% with four. These are descriptive associations, not tactical causal effects.

Independent source checks compare every eligible play's pressure/rusher IDs and outcomes, then every coordinate of one play from each of 122 games. Replay tests cover all 7,767 processed plays. See the saved validation artifacts and [methodology](METHODOLOGY.md).

This historical passing-situation dataset does not support current scouting without new data. Twenty-three eligible plays lack a snap tag. Tracking windows do not consistently cover complete routes, catch points, YAC or full pre-snap motion. Five-plus-rusher frequency is not a complete scheme-defined blitz statistic.

## Fields to finish

| Field | Status |
| --- | --- |
| Event and track name | Add organizer's exact name |
| Team members and contribution descriptions | Add actual names and work |
| AWS Region | Europe (London), `eu-west-2` |
| Judge access | Public Amplify website |
| AWS-hosted URL | [Open demo](https://production.dq0yh80z3cam4.amplifyapp.com/) |
| Repository URL | [GitHub](https://github.com/leventkoymen/opponent-pass-rush-brief) |
| Demo recording | Record the verified application and architecture |
| Dataset-use terms | Record the organizer's applicable terms; public availability alone is not a redistribution license |
| Submission deadline and required form fields | Copy the organizer's actual requirements |

## Suggested judging evidence

Provide the README, architecture diagram, exact dataset revision, test output, Amplify deployment status and live URL and a short recording. Distinguish implemented behavior, local validation, actual AWS deployment and future proposals. No measured improvement in coaching outcomes, prediction accuracy or AWS latency has been established.
