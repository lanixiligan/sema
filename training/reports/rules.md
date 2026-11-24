# Finger rules report

How the finger rules (`src/vision/landmarks/letterShapes.js`) judge real hands. Every hand goes
through `matchLetter`, as on Learn, once per still letter. Made by `npm run check-rules`.

- **Passes as itself**: the share of a letter’s hands that would count toward its hold.
- **Passes no letter**: hands that make neither their own letter nor any other.
- **Also passes as**: other letters the same hands would pass, were that letter asked for.

Photos are other people’s hands, one picture each; recordings are frames of video from Sema’s
own recorder. A low number on photos alone can be the photos’ angle, not the rule.

## Photos: asl-hg

23,190 hands of 24 letters. **66.3%** pass as their own letter.

| Letter | Hands | Passes as itself | Passes no letter | Also passes as |
| --- | --- | --- | --- | --- |
| A | 1000 | 100.0% | 0.0% | X 14% |
| B | 905 | 100.0% | 0.0% | — |
| C | 925 | 97.6% | 2.4% | — |
| D | 870 | 100.0% | 0.0% | P 46% |
| E | 1000 | 99.1% | 0.0% | X 90%, C 46%, O 1% |
| F | 945 | 100.0% | 0.0% | — |
| G | 998 | 71.0% | 1.3% | P 97%, D 1% |
| H | 894 | 100.0% | 0.0% | — |
| I | 999 | 99.9% | 0.0% | — |
| K | 1000 | 70.0% | 0.0% | P 69%, U 39% |
| L | 992 | 89.7% | 10.3% | — |
| M | 965 | 0.3% | 21.0% | T 31%, E 27%, C 20% |
| N | 1000 | 12.7% | 1.0% | E 30%, T 24%, X 17% |
| O | 1000 | 89.8% | 0.0% | A 32%, X 24%, C 5% |
| P | 899 | 11.1% | 88.8% | G 7% |
| Q | 946 | 13.0% | 86.8% | G 7% |
| R | 979 | 79.2% | 17.5% | K 45%, P 43% |
| S | 1000 | 0.0% | 8.2% | X 62%, E 61%, A 12% |
| T | 1000 | 41.4% | 17.1% | X 55%, E 21%, A 15% |
| U | 944 | 100.0% | 0.0% | — |
| V | 969 | 63.4% | 0.0% | K 80%, P 79%, U 25% |
| W | 1000 | 78.9% | 21.1% | — |
| X | 960 | 12.2% | 77.6% | E 9%, P 4% |
| Y | 1000 | 67.0% | 0.0% | I 38% |

Each condition’s average score, 0 to 1 (bold under 0.6: most hands leave it unticked):

| Letter | Conditions |
| --- | --- |
| A | index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb along the side of the fist 1.00 · thumb straight 1.00 |
| B | index straight 1.00 · middle straight 1.00 · ring straight 1.00 · pinky straight 1.00 · index and middle together 1.00 · thumb folded across the palm 1.00 |
| C | All four fingers curved 0.97 · Gap between thumb and fingertips 0.99 · index and middle together 0.99 |
| D | index straight 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb touches the middle tip 0.99 |
| E | index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb tucked under the fingertips 1.00 · Fingers bent, not a tight fist 1.00 |
| F | thumb and index tips touch 1.00 · middle straight 1.00 · ring straight 1.00 · pinky straight 1.00 |
| G | index straight 0.93 · middle folded down 0.99 · ring folded down 1.00 · pinky folded down 1.00 · thumb parallel to index 0.84 · Fingers point sideways 1.00 |
| H | index straight 1.00 · middle straight 1.00 · ring folded down 1.00 · pinky folded down 1.00 · index and middle together 1.00 · Fingers point sideways 1.00 |
| I | pinky straight 1.00 · index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · thumb tucked in 1.00 |
| K | index straight 1.00 · middle straight 1.00 · ring folded down 1.00 · pinky folded down 1.00 · index and middle spread apart 0.74 · thumb between index and middle 1.00 · Fingers point up 1.00 |
| L | index straight 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb stretched out to the side 0.85 · Fingers point up 1.00 |
| M | index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb under three fingers **0.12** · thumb under the fingers 0.82 · Fingers folded over the thumb **0.36** |
| N | index folded down 0.95 · middle folded down 0.98 · ring folded down 1.00 · pinky folded down 1.00 · thumb under two fingers 0.79 · thumb under the fingers 0.76 · Fingers folded over the thumb **0.50** |
| O | Fingers curved 1.00 · thumb touches the fingertips 0.95 · middle, ring and pinky curved too 1.00 |
| P | index straight 0.99 · ring folded down **0.22** · pinky folded down **0.21** · index and middle spread apart 1.00 · thumb between index and middle **0.48** |
| Q | index straight **0.30** · middle folded down 0.95 · ring folded down 0.97 · pinky folded down 0.95 · thumb parallel to index 1.00 · Fingers point down 0.96 |
| R | index straight 1.00 · middle straight 0.99 · ring folded down 1.00 · pinky folded down 1.00 · index and middle crossed 0.83 |
| S | index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb across the front of the fist 0.65 · Tight fist **0.00** |
| T | index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb tucked between index and middle 0.91 · thumb under the fingers **0.52** |
| U | index straight 1.00 · middle straight 1.00 · ring folded down 1.00 · pinky folded down 1.00 · index and middle together 1.00 · Fingers not crossed 1.00 · Fingers point up 1.00 |
| V | index straight 1.00 · middle straight 1.00 · ring folded down 1.00 · pinky folded down 1.00 · index and middle spread apart 0.78 · Fingers not crossed 1.00 · Fingers point up 1.00 · thumb holding ring and pinky 0.92 |
| W | index straight 1.00 · middle straight 1.00 · ring straight 1.00 · pinky folded down 1.00 · index and middle spread apart 0.76 |
| X | index bent into a hook **0.20** · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 |
| Y | pinky straight 1.00 · index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · thumb stretched out 0.89 |

## Photos: aslyset

4,531 hands of 24 letters. **49.9%** pass as their own letter.

| Letter | Hands | Passes as itself | Passes no letter | Also passes as |
| --- | --- | --- | --- | --- |
| A | 200 | 99.5% | 0.0% | X 4%, O 1% |
| B | 199 | 96.5% | 3.5% | — |
| C | 186 | 97.3% | 2.2% | O 1% |
| D | 188 | 45.2% | 39.9% | P 30%, U 10%, L 2% |
| E | 200 | 0.0% | 0.5% | X 86%, C 26%, A 1% |
| F | 199 | 80.9% | 19.1% | — |
| G | 174 | 4.6% | 89.7% | O 5%, S 1% |
| H | 188 | 1.6% | 87.8% | O 10%, C 1% |
| I | 198 | 100.0% | 0.0% | — |
| K | 200 | 27.0% | 0.0% | U 85%, P 25% |
| L | 199 | 95.0% | 5.0% | — |
| M | 167 | 0.0% | 0.0% | X 78%, C 44%, E 15% |
| N | 192 | 0.0% | 10.4% | X 73%, E 12%, T 9% |
| O | 181 | 81.2% | 0.0% | C 14%, A 14%, X 6% |
| P | 152 | 5.9% | 76.3% | O 9%, C 7%, G 1% |
| Q | 169 | 14.8% | 60.4% | C 23%, O 1%, D 1% |
| R | 184 | 77.7% | 12.5% | U 10%, K 6%, P 5% |
| S | 197 | 3.0% | 7.6% | X 73%, E 70%, A 9% |
| T | 199 | 59.3% | 1.5% | X 50%, A 35%, E 3% |
| U | 183 | 98.9% | 1.1% | — |
| V | 194 | 66.5% | 1.5% | U 28%, K 21%, P 21% |
| W | 198 | 85.9% | 14.1% | — |
| X | 185 | 8.6% | 46.5% | D 36%, P 24%, E 5% |
| Y | 199 | 23.6% | 0.5% | I 80% |

Each condition’s average score, 0 to 1 (bold under 0.6: most hands leave it unticked):

| Letter | Conditions |
| --- | --- |
| A | index folded down 0.99 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb along the side of the fist 1.00 · thumb straight 1.00 |
| B | index straight 1.00 · middle straight 1.00 · ring straight 1.00 · pinky straight 1.00 · index and middle together 1.00 · thumb folded across the palm 0.97 |
| C | All four fingers curved 0.96 · Gap between thumb and fingertips 1.00 · index and middle together 1.00 |
| D | index straight 1.00 · middle folded down 0.87 · ring folded down 1.00 · pinky folded down 0.90 · thumb touches the middle tip **0.57** |
| E | index folded down 0.98 · middle folded down 0.99 · ring folded down 0.99 · pinky folded down 0.95 · thumb tucked under the fingertips **0.13** · Fingers bent, not a tight fist 1.00 |
| F | thumb and index tips touch 0.88 · middle straight 0.88 · ring straight 1.00 · pinky straight 1.00 |
| G | index straight **0.14** · middle folded down 0.99 · ring folded down 1.00 · pinky folded down 1.00 · thumb parallel to index 0.95 · Fingers point sideways 0.99 |
| H | index straight **0.22** · middle straight **0.18** · ring folded down 0.97 · pinky folded down 1.00 · index and middle together 0.99 · Fingers point sideways 1.00 |
| I | pinky straight 1.00 · index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · thumb tucked in 1.00 |
| K | index straight 1.00 · middle straight 1.00 · ring folded down 1.00 · pinky folded down 1.00 · index and middle spread apart **0.40** · thumb between index and middle 1.00 · Fingers point up 1.00 |
| L | index straight 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb stretched out to the side 0.94 · Fingers point up 1.00 |
| M | index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb under three fingers 0.72 · thumb under the fingers 0.85 · Fingers folded over the thumb **0.00** |
| N | index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb under two fingers 0.89 · thumb under the fingers 0.92 · Fingers folded over the thumb **0.01** |
| O | Fingers curved 0.99 · thumb touches the fingertips 0.85 · middle, ring and pinky curved too 1.00 |
| P | index straight **0.16** · ring folded down 0.83 · pinky folded down 0.79 · index and middle spread apart 0.90 · thumb between index and middle 0.73 |
| Q | index straight **0.35** · middle folded down **0.57** · ring folded down 0.82 · pinky folded down 0.83 · thumb parallel to index 1.00 · Fingers point down 1.00 |
| R | index straight 1.00 · middle straight 1.00 · ring folded down 1.00 · pinky folded down 0.99 · index and middle crossed 0.79 |
| S | index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb across the front of the fist **0.22** · Tight fist **0.11** |
| T | index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb tucked between index and middle 0.71 · thumb under the fingers 0.94 |
| U | index straight 1.00 · middle straight 1.00 · ring folded down 1.00 · pinky folded down 0.99 · index and middle together 1.00 · Fingers not crossed 1.00 · Fingers point up 1.00 |
| V | index straight 1.00 · middle straight 1.00 · ring folded down 1.00 · pinky folded down 0.98 · index and middle spread apart 0.70 · Fingers not crossed 1.00 · Fingers point up 1.00 · thumb holding ring and pinky 1.00 |
| W | index straight 1.00 · middle straight 1.00 · ring straight 1.00 · pinky folded down 0.99 · index and middle spread apart 0.84 |
| X | index bent into a hook **0.13** · middle folded down 0.99 · ring folded down 1.00 · pinky folded down 1.00 |
| Y | pinky straight 0.99 · index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · thumb stretched out **0.51** |

## Recordings: p00 2026-10-20a

1,440 hands of 8 letters. **95.6%** pass as their own letter.

| Letter | Hands | Passes as itself | Passes no letter | Also passes as |
| --- | --- | --- | --- | --- |
| B | 180 | 100.0% | 0.0% | — |
| C | 180 | 81.7% | 18.3% | — |
| D | 180 | 100.0% | 0.0% | P 1% |
| F | 180 | 100.0% | 0.0% | — |
| I | 180 | 100.0% | 0.0% | — |
| L | 180 | 83.3% | 16.7% | — |
| W | 180 | 100.0% | 0.0% | — |
| Y | 180 | 100.0% | 0.0% | — |

Each condition’s average score, 0 to 1 (bold under 0.6: most hands leave it unticked):

| Letter | Conditions |
| --- | --- |
| B | index straight 1.00 · middle straight 1.00 · ring straight 1.00 · pinky straight 1.00 · index and middle together 1.00 · thumb folded across the palm 1.00 |
| C | All four fingers curved 0.79 · Gap between thumb and fingertips 1.00 · index and middle together 1.00 |
| D | index straight 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb touches the middle tip 1.00 |
| F | thumb and index tips touch 1.00 · middle straight 1.00 · ring straight 1.00 · pinky straight 1.00 |
| I | pinky straight 1.00 · index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · thumb tucked in 1.00 |
| L | index straight 1.00 · middle folded down 1.00 · ring folded down 1.00 · pinky folded down 1.00 · thumb stretched out to the side 0.87 · Fingers point up 1.00 |
| W | index straight 1.00 · middle straight 1.00 · ring straight 1.00 · pinky folded down 1.00 · index and middle spread apart 1.00 |
| Y | pinky straight 1.00 · index folded down 1.00 · middle folded down 1.00 · ring folded down 1.00 · thumb stretched out 1.00 |
