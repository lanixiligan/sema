# Training

Python that runs offline to train Sema's letter classifier (milestone 2.2). Nothing here
ships in the app. The plan for 2.2 is in `docs/project-plan.md`; the files it reads are
described in `docs/data-format.md`.

The whole story, from the photos to the result, in plain words: `docs/model-training.md`.

Needs Python 3 with numpy and scikit-learn (versions in `requirements.txt`). Run
everything from the project root.

| File | What it does |
| --- | --- |
| `dataset.py` | Loads extracted files and cleans them (`clean()`): the rules and why each exists |
| `knn.py` | The first classifier, k nearest neighbours, with "not sure" for far-off hands |
| `small.py` | The small models: logistic regression and a small neural network, saved as weights the browser can run |
| `evaluate.py` | Scoring: per-letter accuracy, mistakes, votes over a take's frames |
| `test_dataset.py`, `test_knn.py`, `test_small.py` | Tests: `python3 -m unittest discover training` |
| `clean.py` | Runs the cleaning on one dataset and writes `reports/cleaning-<dataset>.md` |
| `train.py` | Trains the k-NN, tests it, and writes `reports/knn.md` |
| `train_small.py` | Trains the small models, tests them next to the k-NN, writes `reports/small.md`, and saves the better one for the browser |
| `reports/` | Results as counts and public file names only, so they can be committed |

## Steps

1. Extract the hand points from each public dataset's photos at `/dev/extract` (Chrome)
   and save the files in `data/extracted/` (one per dataset: ASL-HG, ASLYset).
2. Check the cleaning, one dataset at a time: `python3 training/clean.py data/extracted/<file>.json`.
3. Train and test: `python3 training/train.py data/extracted/<file>.json [...] data/raw/<session>.json [...]`
   (every extracted file to train on, then the session files; the order doesn't matter, each
   file is sorted by its content). It tests on each public signer in turn (trained on
   the others, all datasets' signers included), then on the session files. The report also
   gives each dataset's signers' mean alone, so a newly added dataset can be judged on the
   signers that were there before it. k and the "not sure" threshold come from the
   first test alone, so the recordings stay a fair test. It also saves the model for the
   browser, `data/models/knn-asl.json` (gitignored: it holds every training hand).
4. Train and test the small models: `python3 training/train_small.py` with the same files
   (after step 3: the report puts them next to the k-NN's numbers in `reports/knn.json`). It
   tries a few settings for each, chosen on the held-out signers alone like k, and takes a few
   minutes. Both are saved in `data/models/` (gitignored); the better one on unseen people is
   copied to `public/models/asl-letters.json`, which is committed and goes on the live site: it
   holds only weights (no training hands), a few KB.
5. Try them live: `npm run dev`, pick the model on the `/dev` dashboard (the switch between the
   small model and the k-NN only shows under `npm run dev`), then open
   http://localhost:5173/learn in Chrome: its "Right now" line shows the model's guess. The
   small model also works on the live site.

## Data rules

- Split training and testing by signer (`person`), never by photo or frame.
- Lanix's recordings in `data/raw/` are the test set: never train on them.
- `data/raw/`, `data/public/`, `data/extracted/` and `data/models/` are gitignored. Reports hold
  counts only, never hand points.
