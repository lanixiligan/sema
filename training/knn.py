"""The first classifier: k nearest neighbours on the 63 normalized hand numbers.

To judge a hand, find the k training hands most like it (smallest distance
between their 63 numbers) and take the letter most of them have. How far away
those neighbours are says how sure the answer is: a hand far from every
training hand gets "not sure" instead of a letter.
"""

import json
from collections import Counter

import numpy as np
from sklearn.neighbors import NearestNeighbors

NOT_SURE = "not sure"
# Must match src/vision/landmarks/normalizeHand.js.
NORMALIZATION = 1


class Knn:
    def __init__(self, shapes, letters, k):
        self.letters = np.asarray(letters)
        self.k = k
        self.search = NearestNeighbors(n_neighbors=k).fit(np.asarray(shapes))

    def predict(self, shapes):
        """Returns (letters, distances): the letter for each shape, and the
        average distance to its k neighbours (bigger means less sure)."""
        distances, indexes = self.search.kneighbors(np.asarray(shapes))
        return [vote(row) for row in self.letters[indexes]], distances.mean(axis=1)


def vote(neighbour_letters):
    """The letter most neighbours have. They come nearest first, and Counter
    keeps that order among equal counts, so a tie goes to the nearest's letter."""
    return Counter(neighbour_letters).most_common(1)[0][0]


def with_threshold(letters, distances, threshold):
    """"not sure" wherever the neighbours are further than `threshold`."""
    return [NOT_SURE if d > threshold else letter for letter, d in zip(letters, distances)]


def save_model(path, shapes, letters, k, threshold):
    """Saves what the browser needs to run the classifier (the /dev/try page):
    every training hand's 63 numbers in one flat list, each one's letter as an
    index into `letters`, k, and the "not sure" threshold."""
    names = sorted(set(letters))
    model = {
        "kind": "knn",
        "normalization": NORMALIZATION,
        "letters": names,
        "k": k,
        "threshold": round(float(threshold), 4),
        "labels": [names.index(letter) for letter in letters],
        "shapes": np.asarray(shapes).round(4).ravel().tolist(),
    }
    with open(path, "w") as f:
        json.dump(model, f, separators=(",", ":"))


def leave_one_signer_out(shapes, letters, people, k):
    """Tests on each signer in turn, trained on all the others: how the
    classifier does for people it has never seen. Returns (letters, distances)
    for every sample, in the samples' order."""
    shapes, letters, people = np.asarray(shapes), np.asarray(letters), np.asarray(people)
    predicted = np.empty(len(letters), dtype=object)
    distances = np.empty(len(letters))
    for person in np.unique(people):
        held_out = people == person
        model = Knn(shapes[~held_out], letters[~held_out], k)
        predicted[held_out], distances[held_out] = model.predict(shapes[held_out])
    return list(predicted), distances
