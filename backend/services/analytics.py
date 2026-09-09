"""
services/analytics.py
-----------------------
Loads master_dataset_final.csv, runs every report through the SIF model +
LSR engine + precursor extraction engine ONCE (cached in memory), and
exposes aggregation helpers used by the dashboard / precursor intelligence
API endpoints.

All analytics are computed dynamically from the dataset — nothing is
hard-coded on the frontend.
"""

import os
import logging
import pandas as pd

from services.prediction import predict_sif_batch
from services.lsr_detection import get_lsr_result
from services.precursor_extraction import extract_precursors
from services.risk_engine import determine_risk_priority

logger = logging.getLogger("sif_backend.analytics")

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "master_dataset_final.csv")

_cached_df = None
_dataset_load_error = None


def _load_raw_dataset():
    global _dataset_load_error

    if not os.path.exists(DATA_PATH):
        _dataset_load_error = (
            f"Dataset not found at '{DATA_PATH}'. Place master_dataset_final.csv "
            "inside backend/data/."
        )
        logger.error(_dataset_load_error)
        return None

    try:
        df = pd.read_csv(DATA_PATH)
        if "description" not in df.columns:
            _dataset_load_error = "master_dataset_final.csv must contain a 'description' column."
            logger.error(_dataset_load_error)
            return None
        return df
    except Exception as e:
        _dataset_load_error = f"Failed to read dataset: {e}"
        logger.error(_dataset_load_error)
        return None


def get_dataset_error():
    return _dataset_load_error


def get_scored_dataset(force_reload: bool = False) -> pd.DataFrame:
    """
    Returns a fully scored dataframe (one row per report) with columns:
    report_id, description, location, source, sif_prediction, sif_confidence,
    life_saving_rule, secondary_rules, activity, hazard, barrier_failure,
    risk_priority, risk_reason.

    Cached in memory after first computation since scoring 451 rows through
    the model + rule engines on every request would be wasteful.
    """
    global _cached_df

    if _cached_df is not None and not force_reload:
        return _cached_df

    df = _load_raw_dataset()
    if df is None:
        return None

    if "report_id" not in df.columns:
        df.insert(0, "report_id", [f"R{i+1:03d}" for i in range(len(df))])
    if "location" not in df.columns:
        df["location"] = "Not Specified"
    if "source" not in df.columns:
        df["source"] = "Unspecified"

    df["description"] = df["description"].fillna("").astype(str)
    descriptions = df["description"].tolist()

    preds = predict_sif_batch(descriptions)

    rows = []
    for i, desc in enumerate(descriptions):
        pred = preds[i]
        lsr = get_lsr_result(desc)
        precursors = extract_precursors(desc)
        priority, reason = determine_risk_priority(
            pred.get("is_sif"), pred.get("confidence_pct"), precursors["hazard"]
        )

        rows.append({
            "report_id": df["report_id"].iloc[i],
            "description": desc,
            "location": df["location"].iloc[i] if pd.notna(df["location"].iloc[i]) else "Not Specified",
            "source": df["source"].iloc[i] if pd.notna(df["source"].iloc[i]) else "Unspecified",
            "sif_prediction": pred.get("label") or "Error",
            "sif_confidence": pred.get("confidence_pct"),
            "life_saving_rule": lsr["primary_rule"],
            "secondary_rules": ", ".join(lsr["secondary_rules"]) if lsr["secondary_rules"] else "",
            "activity": precursors["activity"],
            "hazard": precursors["hazard"],
            "barrier_failure": precursors["barrier_failure"],
            "risk_priority": priority,
            "risk_reason": reason,
        })

    _cached_df = pd.DataFrame(rows)
    return _cached_df


def _value_counts_by_sif(df: pd.DataFrame, column: str, top_n: int = 10) -> list:
    """Returns [{name, total, sif, sif_density}] sorted by total desc."""
    if df is None or df.empty:
        return []

    grouped = df.groupby(column).agg(
        total=("report_id", "count"),
        sif=("sif_prediction", lambda s: int((s == "SIF Potential").sum())),
    ).reset_index()
    grouped["sif_density"] = (grouped["sif"] / grouped["total"] * 100).round(1)
    grouped = grouped.sort_values("total", ascending=False).head(top_n)
    grouped = grouped.rename(columns={column: "name"})
    return grouped.to_dict(orient="records")


def _apply_filters(df: pd.DataFrame, filters: dict) -> pd.DataFrame:
    """Applies optional equality filters (sif, activity, hazard, lsr, location)."""
    if not filters:
        return df

    filtered = df
    if filters.get("sif"):
        filtered = filtered[filtered["sif_prediction"] == filters["sif"]]
    if filters.get("activity"):
        filtered = filtered[filtered["activity"] == filters["activity"]]
    if filters.get("hazard"):
        filtered = filtered[filtered["hazard"] == filters["hazard"]]
    if filters.get("lsr"):
        filtered = filtered[filtered["life_saving_rule"] == filters["lsr"]]
    if filters.get("location"):
        filtered = filtered[filtered["location"] == filters["location"]]
    return filtered


def dashboard_summary(filters: dict = None) -> dict:
    df = get_scored_dataset()
    if df is None:
        return None

    df = _apply_filters(df, filters)

    total = len(df)
    sif_count = int((df["sif_prediction"] == "SIF Potential").sum())
    nonsif_count = total - sif_count
    sif_density = round((sif_count / total) * 100, 1) if total else 0.0

    sif_distribution = [
        {"name": "SIF Potential", "value": sif_count},
        {"name": "Non-SIF", "value": nonsif_count},
    ]

    return {
        "total_reports": total,
        "sif_reports": sif_count,
        "non_sif_reports": nonsif_count,
        "sif_density": sif_density,
        "sif_distribution": sif_distribution,
        "top_activities": _value_counts_by_sif(df, "activity"),
        "top_hazards": _value_counts_by_sif(df, "hazard"),
        "top_lsr": _value_counts_by_sif(df, "life_saving_rule"),
        "top_barriers": _value_counts_by_sif(df, "barrier_failure"),
        "top_locations": _value_counts_by_sif(df, "location"),
    }


def top_precursor_patterns(top_n: int = 10, filters: dict = None) -> list:
    """
    Groups SIF-Potential reports by (activity, hazard, barrier_failure) and
    returns the most frequent combinations, i.e. "Top SIF Precursor Patterns".
    """
    df = get_scored_dataset()
    if df is None:
        return []

    df = _apply_filters(df, filters)
    sif_only = df[df["sif_prediction"] == "SIF Potential"]
    if sif_only.empty:
        return []

    total_sif = len(sif_only)
    grouped = (
        sif_only.groupby(["activity", "hazard", "barrier_failure"])
        .size()
        .reset_index(name="sif_reports")
        .sort_values("sif_reports", ascending=False)
        .head(top_n)
    )
    grouped["sif_density"] = (grouped["sif_reports"] / total_sif * 100).round(1)
    grouped.insert(0, "rank", range(1, len(grouped) + 1))

    return grouped.to_dict(orient="records")


def precursor_intelligence(filters: dict = None) -> dict:
    """Aggregations used by the Precursor Intelligence page."""
    df = get_scored_dataset()
    if df is None:
        return None

    df = _apply_filters(df, filters)

    return {
        "top_activities": _value_counts_by_sif(df, "activity"),
        "top_hazards": _value_counts_by_sif(df, "hazard"),
        "top_barriers": _value_counts_by_sif(df, "barrier_failure"),
        "top_lsr": _value_counts_by_sif(df, "life_saving_rule"),
        "top_locations": _value_counts_by_sif(df, "location"),
        "precursor_matrix": top_precursor_patterns(15, filters=filters),
    }


def location_analysis() -> dict:
    df = get_scored_dataset()
    if df is None:
        return None

    locations = _value_counts_by_sif(df, "location", top_n=50)
    for loc in locations:
        density = loc["sif_density"]
        loc["priority"] = "HIGH" if density >= 60 else ("MEDIUM" if density >= 35 else "LOW")

    return {
        "note": (
            "Location analytics demonstrated using available dataset location "
            "fields. OIL HSSE location data can be integrated during deployment."
        ),
        "locations": locations,
    }


def list_distinct(column: str) -> list:
    df = get_scored_dataset()
    if df is None:
        return []
    return sorted(df[column].dropna().unique().tolist())
