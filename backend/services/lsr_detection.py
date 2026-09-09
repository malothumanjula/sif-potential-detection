"""
services/lsr_detection.py
--------------------------
Transparent, rule-based (keyword/phrase matching) detection of the
relevant Life-Saving Rule(s) for a safety report.

This intentionally does NOT use another ML model — the LSR dataset has too
few labeled examples per category for a reliable multiclass classifier, so
a hybrid keyword-based NLP engine is used instead. This keeps the logic
fully explainable for the jury demo.
"""

LSR_KEYWORDS = {
    "Energy Isolation": [
        "energized", "energised", "live electrical", "electrical panel",
        "lockout", "lock out", "isolation", "isolated", "electrical energy",
    ],
    "Hot Work": [
        "welding", "weld", "cutting", "grinding", "spark", "flame", "hot work",
    ],
    "Confined Space": [
        "confined space", "tank entry", "vessel entry", "manhole",
        "atmospheric testing", "gas testing",
    ],
    "Line of Fire": [
        "struck by", "caught between", "caught in", "pinch point",
        "line of fire", "suspended load",
    ],
    "Working at Height": [
        "working at height", "fall from height", "scaffold", "ladder",
        "roof", "elevated",
    ],
    "Driving": [
        "vehicle", "driving", "driver", "truck", "journey", "transportation",
    ],
    "Safe Mechanical Lifting": [
        "crane", "lifting", "hoist", "rigging", "sling", "load lifting",
    ],
    "Dropped Objects": [
        "dropped object", "falling object", "falling material", "object fell",
    ],
}

NOT_IDENTIFIED = "Other / Not Identified"


def _count_matches(text_lower: str, keywords: list) -> tuple:
    matched = [kw for kw in keywords if kw in text_lower]
    return len(matched), matched


def detect_all_rules(description: str) -> list:
    """
    Scans the description for LSR keyword matches.

    Returns:
        list of dicts sorted strongest match first:
        [{"rule": str, "match_count": int, "matched_keywords": list[str]}, ...]
    """
    if not description:
        return []

    text_lower = description.lower()
    scored = []

    for rule, keywords in LSR_KEYWORDS.items():
        count, matched = _count_matches(text_lower, keywords)
        if count > 0:
            scored.append({"rule": rule, "match_count": count, "matched_keywords": matched})

    scored.sort(key=lambda x: x["match_count"], reverse=True)
    return scored


def get_lsr_result(description: str) -> dict:
    """
    Returns a structured LSR detection result:
        {
            "primary_rule": str,
            "secondary_rules": list[str],
            "matched_keywords": list[str],   # keywords behind the primary rule
            "all_matches": list[dict],       # full scored match list
        }
    """
    matches = detect_all_rules(description)

    if not matches:
        return {
            "primary_rule": NOT_IDENTIFIED,
            "secondary_rules": [],
            "matched_keywords": [],
            "all_matches": [],
        }

    primary = matches[0]
    secondary = [m["rule"] for m in matches[1:]]

    return {
        "primary_rule": primary["rule"],
        "secondary_rules": secondary,
        "matched_keywords": primary["matched_keywords"],
        "all_matches": matches,
    }
