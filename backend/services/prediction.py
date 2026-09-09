"""
services/prediction.py
-----------------------
Loads the pre-trained SIF (Serious Injury & Fatality) detection model
(TF-IDF + Logistic Regression, saved as a single sklearn Pipeline) ONCE at
backend startup, and exposes simple prediction helpers.

IMPORTANT: The model is NOT retrained here. It is loaded exactly as-is via
joblib.load() and reused for every request.
"""

import os
import logging
import joblib

logger = logging.getLogger("sif_backend.prediction")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "sif_detection_model_tfidf_logreg.joblib")

# The model's positive class (SIF Potential) label.
# classes_ = [0, 1]; 1 = SIF Potential, 0 = Non-SIF.
SIF_POSITIVE_LABEL = 1

_model = None
_model_load_error = None


def load_model_once():
    """
    Loads the model into a module-level singleton. Safe to call multiple
    times — only loads from disk the first time.
    """
    global _model, _model_load_error

    if _model is not None or _model_load_error is not None:
        return _model

    if not os.path.exists(MODEL_PATH):
        _model_load_error = (
            f"Model file not found at '{MODEL_PATH}'. Place "
            "'sif_detection_model_tfidf_logreg.joblib' inside backend/model/."
        )
        logger.error(_model_load_error)
        return None

    try:
        _model = joblib.load(MODEL_PATH)
        logger.info("SIF model loaded successfully from %s", MODEL_PATH)
        return _model
    except Exception as e:
        _model_load_error = f"Failed to load model: {e}"
        logger.error(_model_load_error)
        return None


def get_model():
    """Returns the loaded model, loading it on first access."""
    if _model is None and _model_load_error is None:
        return load_model_once()
    return _model


def get_model_error():
    return _model_load_error


def confidence_band(confidence_pct: float) -> str:
    """Maps a confidence percentage to a human-readable trust label."""
    if confidence_pct < 60:
        return "Low confidence — HSE validation recommended"
    elif confidence_pct < 80:
        return "Moderate confidence"
    else:
        return "High model confidence"


def predict_sif(description: str) -> dict:
    """
    Runs the SIF classification model on a single free-text safety report.

    Returns:
        dict with keys: is_sif, label, confidence_pct, confidence_note, error
    """
    result = {
        "is_sif": None,
        "label": None,
        "confidence_pct": None,
        "confidence_note": None,
        "error": None,
    }

    model = get_model()
    if model is None:
        result["error"] = get_model_error() or "Model is not loaded."
        return result

    text = (description or "").strip()
    if not text:
        result["error"] = "Description is empty. Please provide safety report text."
        return result

    try:
        pred = model.predict([text])[0]
        proba = model.predict_proba([text])[0]

        classes = list(model.classes_)
        pred_idx = classes.index(pred)
        confidence_pct = round(float(proba[pred_idx]) * 100, 1)

        is_sif = (pred == SIF_POSITIVE_LABEL)

        result["is_sif"] = bool(is_sif)
        result["label"] = "SIF Potential" if is_sif else "Non-SIF Potential"
        result["confidence_pct"] = confidence_pct
        result["confidence_note"] = confidence_band(confidence_pct)
        return result

    except Exception as e:
        result["error"] = f"Prediction failed: {e}"
        return result


def predict_sif_batch(descriptions: list) -> list:
    """
    Runs the SIF classification model on a list of report descriptions in a
    single vectorized call for efficiency.

    Returns:
        list of dicts (same shape as predict_sif's return value), aligned by index.
    """
    model = get_model()
    clean_texts = [(d or "").strip() for d in descriptions]
    n = len(clean_texts)

    results = [None] * n

    if model is None:
        err = get_model_error() or "Model is not loaded."
        return [{"is_sif": None, "label": None, "confidence_pct": None,
                  "confidence_note": None, "error": err} for _ in range(n)]

    valid_indices = [i for i, t in enumerate(clean_texts) if t]
    preds = [None] * n
    probas = [None] * n

    if valid_indices:
        valid_texts = [clean_texts[i] for i in valid_indices]
        try:
            batch_preds = model.predict(valid_texts)
            batch_probas = model.predict_proba(valid_texts)
            for j, i in enumerate(valid_indices):
                preds[i] = batch_preds[j]
                probas[i] = batch_probas[j]
        except Exception as e:
            for i in valid_indices:
                preds[i] = "ERROR"
                probas[i] = str(e)

    classes = list(model.classes_)

    for i, text in enumerate(clean_texts):
        if not text:
            results[i] = {"is_sif": None, "label": None, "confidence_pct": None,
                           "confidence_note": None, "error": "Empty description."}
            continue

        if preds[i] == "ERROR" or preds[i] is None:
            results[i] = {"is_sif": None, "label": None, "confidence_pct": None,
                           "confidence_note": None, "error": "Prediction failed for this row."}
            continue

        pred = preds[i]
        proba = probas[i]
        pred_idx = classes.index(pred)
        confidence_pct = round(float(proba[pred_idx]) * 100, 1)
        is_sif = (pred == SIF_POSITIVE_LABEL)

        results[i] = {
            "is_sif": bool(is_sif),
            "label": "SIF Potential" if is_sif else "Non-SIF Potential",
            "confidence_pct": confidence_pct,
            "confidence_note": confidence_band(confidence_pct),
            "error": None,
        }

    return results
