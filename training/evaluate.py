"""Scoring: how often each letter is right, and what it gets mistaken for."""

from collections import Counter, defaultdict

from knn import vote


def share_right(true, predicted):
    """{letter: (right, total)} for each letter in `true`."""
    right, total = Counter(), Counter()
    for t, p in zip(true, predicted):
        total[t] += 1
        right[t] += t == p
    return {letter: (right[letter], total[letter]) for letter in total}


def mean_share(by_letter):
    """The average of the letters' shares, so every letter counts the same
    however many samples it has."""
    return sum(right / total for right, total in by_letter.values()) / len(by_letter)


def dataset_of(person):
    """The dataset a public signer comes from: "asl-hg-p01" gives "asl-hg"."""
    return person.rsplit("-", 1)[0]


def mean_by_dataset(true, predicted, people):
    """{dataset: mean_share of its signers' samples}, so a dataset added to
    training can be judged on the signers that were there before it."""
    by = defaultdict(lambda: ([], []))
    for t, p, person in zip(true, predicted, people):
        by[dataset_of(person)][0].append(t)
        by[dataset_of(person)][1].append(p)
    return {name: mean_share(share_right(t, p)) for name, (t, p) in sorted(by.items())}


def mistakes(true, predicted):
    """[(true, predicted, count, share of that true letter)], most common first."""
    totals = Counter(true)
    wrong = Counter((t, p) for t, p in zip(true, predicted) if t != p)
    return [(t, p, n, n / totals[t]) for (t, p), n in wrong.most_common()]


def take_votes(recordings, predicted):
    """{recording: the answer most of its frames got}, frames in order."""
    by_take = defaultdict(list)
    for recording, p in zip(recordings, predicted):
        by_take[recording].append(p)
    return {recording: vote(answers) for recording, answers in by_take.items()}
