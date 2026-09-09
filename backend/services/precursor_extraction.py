"""
services/precursor_extraction.py
----------------------------------
Transparent, keyword-based extraction of precursor information from a
safety report: Activity, Hazard, Location, and Barrier Failure.

Rule-based NLP layer — not a trained ML model. Returns "Not Identified"
rather than guessing when there isn't enough signal in the text.
"""

NOT_IDENTIFIED = "Not Identified"

ACTIVITY_KEYWORDS = {
    "Electrical Work": ["electrical", "energized", "energised", "panel", "wiring", "circuit"],
    "Working at Height": ["height", "scaffold", "ladder", "roof", "elevated"],
    "Confined Space": ["confined space", "tank entry", "vessel entry", "manhole"],
    "Hot Work": ["welding", "weld", "cutting", "grinding", "hot work", "spark"],
    "Lifting": ["crane", "lifting", "hoist", "rigging", "sling", "suspended load"],
    "Drilling": ["drilling", "rig", "drill floor", "wellhead", "drill pipe"],
    "Transportation": ["vehicle", "driving", "driver", "truck", "road", "journey"],
    "Chemical Handling": ["chemical", "spill", "toxic", "corrosive", "hazardous material", "fumes"],
    "Maintenance": ["maintenance", "repair", "servicing", "inspection", "calibration"],
}

HAZARD_KEYWORDS = {
    "Electrical Energy": ["energized", "energised", "electrical panel", "live electrical", "shock", "electrical energy"],
    "Fall from Height": ["fall from height", "fell", "scaffold", "ladder", "roof"],
    "Confined Space": ["confined space", "tank entry", "vessel entry", "atmospheric testing", "gas testing"],
    "Fire / Explosion": ["fire", "explosion", "spark", "flame", "flammable", "hot work"],
    "Chemical Exposure": ["chemical exposure", "toxic", "corrosive", "spill", "fumes", "chemical"],
    "Pressure Release": ["pressure release", "pressurized", "pressurised", "over-pressure", "blowout"],
    "Falling Object": ["falling object", "dropped object", "struck by", "suspended load", "falling material", "object fell"],
    "Vehicle": ["vehicle", "driving", "driver", "truck", "road"],
    "Caught in / Between": ["caught between", "caught in", "pinch point"],
}

BARRIER_FAILURE_KEYWORDS = {
    "Energy Isolation Failure": ["lockout", "lock out", "isolation", "not isolated", "de-energiz", "without isolation"],
    "Permit Failure": ["without permit", "no permit", "permit sign-off", "without a permit"],
    "Atmospheric Testing Failure": ["atmospheric testing", "gas testing", "without atmospheric", "without gas testing"],
    "PPE Failure": ["ppe", "without ppe", "no ppe", "personal protective equipment", "without a harness", "without fall protection"],
    "Procedure Failure": ["procedure", "sop", "protocol", "without following", "bypassed"],
    "Training / Competency Failure": ["untrained", "not trained", "without proper training", "training", "competency"],
    "Communication Failure": ["communication", "miscommunication", "not informed", "unaware", "without informing"],
    "Guarding Failure": ["guard", "unguarded", "guarding", "barrier removed"],
}

LOCATION_KEYWORDS = [
    "wellhead", "drill floor", "rig", "tank", "vessel", "manhole",
    "electrical panel", "substation", "workshop", "warehouse", "plant",
    "pipeline", "yard", "site", "road", "control room", "platform",
]


def _best_category(text_lower: str, keyword_map: dict, default_label: str):
    """Returns (label, matched_keywords) for the category with the most keyword hits."""
    best_label = default_label
    best_count = 0
    best_keywords = []

    for label, keywords in keyword_map.items():
        matched = [kw for kw in keywords if kw in text_lower]
        if len(matched) > best_count:
            best_count = len(matched)
            best_label = label
            best_keywords = matched

    return best_label, best_keywords


def extract_precursors(description: str) -> dict:
    """
    Returns:
        {
            "activity": str, "activity_keywords": list[str],
            "hazard": str, "hazard_keywords": list[str],
            "barrier_failure": str, "barrier_keywords": list[str],
            "location": str,
        }
    """
    if not description:
        return {
            "activity": NOT_IDENTIFIED, "activity_keywords": [],
            "hazard": NOT_IDENTIFIED, "hazard_keywords": [],
            "barrier_failure": NOT_IDENTIFIED, "barrier_keywords": [],
            "location": NOT_IDENTIFIED,
        }

    text_lower = description.lower()

    activity, activity_kw = _best_category(text_lower, ACTIVITY_KEYWORDS, "Other")
    hazard, hazard_kw = _best_category(text_lower, HAZARD_KEYWORDS, "Other")
    barrier, barrier_kw = _best_category(text_lower, BARRIER_FAILURE_KEYWORDS, "Other / Not Identified")

    location = NOT_IDENTIFIED
    for loc in LOCATION_KEYWORDS:
        if loc in text_lower:
            location = loc.title()
            break

    return {
        "activity": activity, "activity_keywords": activity_kw,
        "hazard": hazard, "hazard_keywords": hazard_kw,
        "barrier_failure": barrier, "barrier_keywords": barrier_kw,
        "location": location,
    }
