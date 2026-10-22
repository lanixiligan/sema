"""Step 5 of 2.2: small models, whose weights fit in a few KB.

The k-NN keeps every training hand (11 MB), too big for the live site. These
learn a few thousand numbers (weights) instead:
- Logistic regression: each letter's score is a weighted sum of the 63 hand
  numbers, plus a bias. One layer, so it can only split letters with straight
  boundaries.
- A small neural network (MLP): the same, with one hidden layer in between.
  Each hidden unit is a weighted sum of the 63 numbers with negatives set to 0
  (ReLU), and the letters' scores are weighted sums of those, so it can learn
  combinations of points that a straight boundary can't split (M, N, S, T).
Both turn the 24 scores into percentages that add up to 100% (softmax). The top
one is the guess and its percentage how sure it is: below a threshold, it's
"not sure". Before either, each of the 63 numbers is shifted and scaled to a
mean of 0 and a spread of 1 (StandardScaler), which helps both train.
"""

import json

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from knn import NORMALIZATION, NOT_SURE

# Decimals kept in the saved model: enough to give the same percentages.
DECIMALS = 5


def make_logistic(c):
    """Logistic regression. c: how closely it may fit the training hands;
    smaller keeps the weights small, against learning the signers' quirks."""
    return make_pipeline(StandardScaler(), LogisticRegression(C=c, max_iter=2000))


def make_mlp(hidden, alpha):
    """A neural network with one hidden layer of `hidden` units. alpha: like
    1/c above, bigger keeps the weights smaller. Early stopping ends training
    once a held-back tenth of the training hands stops getting better."""
    network = MLPClassifier(
        hidden_layer_sizes=(hidden,), alpha=alpha, early_stopping=True, max_iter=500, random_state=0
    )
    return make_pipeline(StandardScaler(), network)


def leave_one_signer_out(make, shapes, letters, people):
    """Tests on each signer in turn, on a new model from make() trained on all
    the others: how it does for people it has never seen. Returns (letters,
    confidences) for every sample, in the samples' order: the top letter and
    its percentage."""
    shapes, letters, people = np.asarray(shapes), np.asarray(letters), np.asarray(people)
    predicted = np.empty(len(letters), dtype=object)
    confidences = np.empty(len(letters))
    for person in np.unique(people):
        held_out = people == person
        model = make().fit(shapes[~held_out], letters[~held_out])
        percentages = model.predict_proba(shapes[held_out])
        predicted[held_out] = model.classes_[percentages.argmax(axis=1)]
        confidences[held_out] = percentages.max(axis=1)
    return list(predicted), confidences


def with_threshold(letters, confidences, threshold):
    """"not sure" wherever the top percentage is below `threshold`."""
    return [NOT_SURE if c < threshold else letter for letter, c in zip(letters, confidences)]


def to_network(pipeline):
    """A trained pipeline as plain numbers, the way the browser runs it: the
    scaler's mean and scale, then the layers. A layer's weights have one row
    per output, as long as its input: each output is the sum of its row times
    the input, plus its bias. Logistic regression is one layer; the MLP two."""
    scaler, model = pipeline[0], pipeline[-1]
    if isinstance(model, LogisticRegression):
        pairs = [(model.coef_, model.intercept_)]
    else:
        # scikit-learn keeps the MLP's weights the other way round: a row per input.
        pairs = [(weights.T, biases) for weights, biases in zip(model.coefs_, model.intercepts_)]
    return {
        "letters": [str(letter) for letter in model.classes_],
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "layers": [{"weights": weights.tolist(), "biases": biases.tolist()} for weights, biases in pairs],
    }


def forward(network, shapes):
    """Runs a network from to_network() (or a saved model) on shapes, and
    returns each shape's percentages, in the order of network["letters"]. The
    same steps as the browser's copy (src/pages/dev/try/networkModel.js)."""
    values = (np.asarray(shapes, dtype=float) - network["mean"]) / network["scale"]
    layers = network["layers"]
    for i, layer in enumerate(layers):
        values = values @ np.asarray(layer["weights"]).T + layer["biases"]
        if i < len(layers) - 1:
            values = np.maximum(values, 0)  # ReLU between layers
    # Softmax: e to each score, over their sum. Taking the top score away
    # first gives the same result, and keeps e^score from overflowing.
    powers = np.exp(values - values.max(axis=1, keepdims=True))
    return powers / powers.sum(axis=1, keepdims=True)


def save_model(path, pipeline, name, threshold):
    """Saves what the browser needs to run the model (the /dev/try page): its
    name, the letters, the "not sure" threshold, and the network's numbers."""
    network = to_network(pipeline)
    model = {
        "kind": "network",
        "name": name,
        "normalization": NORMALIZATION,
        "letters": network["letters"],
        "threshold": round(float(threshold), 4),
        "mean": rounded(network["mean"]),
        "scale": rounded(network["scale"]),
        "layers": [
            {"weights": rounded(layer["weights"]), "biases": rounded(layer["biases"])} for layer in network["layers"]
        ],
    }
    with open(path, "w") as f:
        json.dump(model, f, separators=(",", ":"))


def rounded(numbers):
    return np.round(np.asarray(numbers), DECIMALS).tolist()
