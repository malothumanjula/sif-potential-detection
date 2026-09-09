"""
services/risk_engine.py
-------------------------
Simple, explainable "AI-Assisted Risk Priority" engine.

Combines the SIF ML prediction, its confidence, the detected hazard, and
any detected barrier failure into a HIGH / MEDIUM / LOW priority label,
plus a human-readable list of "why was this flagged" indicators.

IMPORTANT: This is explicitly NOT an official OIL risk score — it is an
AI-assisted decision-support signal only.
"""

# Hazards considered inherently high-consequence regardless of confidence.
CRITICAL_HAZARDS = {
    "Electrical Energy", "Fall from Height", "Confined Space",
    "Fire / Explosion", "Pressure Release", "Falling Object",
}

NOT_IDENTIFIED_VALUES = {"Not Identified", "Other", "Other / Not Identified"}


def determine_risk_priority(is_sif: bool, confidence_pct: float, hazard: str) -> tuple:
    """
    Returns (priority: str, reason: str).
    """
    if is_sif is None:
        return "UNKNOWN", "Unable to assess risk — prediction unavailable."

    confidence_pct = confidence_pct or 0.0
    is_critical_hazard = hazard not in NOT_IDENTIFIED_VALUES and hazard in CRITICAL_HAZARDS

    if is_sif and (confidence_pct >= 70 or is_critical_hazard):
        reason = (
            f"SIF Potential with {confidence_pct}% model confidence"
            + (f" and a high-consequence hazard ({hazard}) detected." if is_critical_hazard else ".")
        )
        return "HIGH", reason

    if is_sif and 50 <= confidence_pct < 70:
        return "MEDIUM", f"SIF Potential with moderate model confidence ({confidence_pct}%)."

    if is_sif:
        return "MEDIUM", f"SIF Potential but with low model confidence ({confidence_pct}%) — HSE validation recommended."

    return "LOW", f"Classified as Non-SIF Potential with {confidence_pct}% model confidence."


def build_explanation(description: str, is_sif: bool, lsr_primary: str,
                       lsr_matched_keywords: list, precursors: dict) -> list:
    """
    Builds a list of human-readable "detected risk indicators" strings,
    used to answer "Why was this flagged?" without exposing model internals.
    """
    indicators = []

    if lsr_primary and lsr_primary != "Other / Not Identified":
        indicators.append(f"{lsr_primary} activity pattern detected")

    for kw in lsr_matched_keywords[:3]:
        indicators.append(f"Keyword signal: \"{kw}\"")

    hazard = precursors.get("hazard")
    if hazard and hazard not in ("Other", "Not Identified"):
        indicators.append(f"Potential hazard identified: {hazard}")

    barrier = precursors.get("barrier_failure")
    if barrier and barrier not in ("Other / Not Identified", "Not Identified"):
        indicators.append(f"Barrier weakness detected: {barrier}")

    if not indicators:
        indicators.append(
            "No strong keyword-based indicators found — classification is based "
            "primarily on the trained ML model's language patterns."
        )

    return indicators
