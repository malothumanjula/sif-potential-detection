"""
main.py
--------
FastAPI backend for the OIL SIF Precursor Intelligence system.

Loads the pre-trained SIF model once at startup and exposes REST endpoints
consumed by the React frontend.

Run with:
    uvicorn main:app --reload
"""

import logging
import io
from typing import Optional
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.prediction import load_model_once, get_model, get_model_error, predict_sif, predict_sif_batch
from services.lsr_detection import get_lsr_result
from services.precursor_extraction import extract_precursors
from services.risk_engine import determine_risk_priority, build_explanation
from services import analytics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sif_backend.main")

MODEL_DISCLAIMER = (
    "AI predictions are decision-support signals and should be validated by "
    "qualified HSE personnel."
)

app = FastAPI(
    title="OIL SIF Precursor Intelligence API",
    description=(
        "AI/NLP engine to detect Serious Injury & Fatality (SIF) precursors "
        "in unsafe-act/unsafe-condition and near-miss reports."
    ),
    version="1.0.0",
)

# CORS — allow the Vite dev server (and common alt ports) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    load_model_once()
    if get_model_error():
        logger.warning("Model failed to load: %s", get_model_error())
    else:
        logger.info("Startup complete — model ready.")


# --------------------------------------------------------------------------
# Schemas
# --------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    description: str


# --------------------------------------------------------------------------
# Helper
# --------------------------------------------------------------------------

def _analyze_single(description: str) -> dict:
    pred = predict_sif(description)
    if pred["error"]:
        return {"error": pred["error"]}

    lsr = get_lsr_result(description)
    precursors = extract_precursors(description)
    priority, reason = determine_risk_priority(pred["is_sif"], pred["confidence_pct"], precursors["hazard"])
    indicators = build_explanation(description, pred["is_sif"], lsr["primary_rule"], lsr["matched_keywords"], precursors)

    return {
        "sif_prediction": pred["label"],
        "sif_confidence": pred["confidence_pct"],
        "confidence_note": pred["confidence_note"],
        "life_saving_rule": lsr["primary_rule"],
        "secondary_rules": lsr["secondary_rules"],
        "activity": precursors["activity"],
        "hazard": precursors["hazard"],
        "barrier_failure": precursors["barrier_failure"],
        "location": precursors["location"],
        "risk_priority": priority,
        "risk_reason": reason,
        "detected_indicators": indicators,
        "disclaimer": MODEL_DISCLAIMER,
    }


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------

@app.get("/api/health")
def health():
    model_ok = get_model() is not None
    dataset_ok = analytics.get_scored_dataset() is not None
    return {
        "status": "ok" if model_ok else "degraded",
        "model_loaded": model_ok,
        "model_error": get_model_error(),
        "dataset_loaded": dataset_ok,
        "dataset_error": analytics.get_dataset_error(),
    }


@app.get("/api/dashboard")
def dashboard(
    sif: Optional[str] = Query(None),
    activity: Optional[str] = Query(None),
    hazard: Optional[str] = Query(None),
    lsr: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
):
    filters = {"sif": sif, "activity": activity, "hazard": hazard, "lsr": lsr, "location": location}
    summary = analytics.dashboard_summary(filters=filters)
    if summary is None:
        raise HTTPException(status_code=503, detail=analytics.get_dataset_error() or "Dataset unavailable.")

    summary["top_precursor_patterns"] = analytics.top_precursor_patterns(10, filters=filters)
    summary["disclaimer"] = MODEL_DISCLAIMER
    summary["data_source_note"] = (
        "Demo dataset composed of public Industrial Safety Dataset and IOGP "
        "Fatal Incident Report style records. The architecture is designed to "
        "ingest OIL's actual UA/UC, near-miss and incident reports when "
        "deployed with authorized OIL data."
    )
    return summary


@app.post("/api/analyze")
def analyze(payload: AnalyzeRequest):
    if get_model() is None:
        raise HTTPException(status_code=503, detail=get_model_error() or "Model not loaded.")

    if not payload.description or not payload.description.strip():
        raise HTTPException(status_code=400, detail="Description is required and cannot be empty.")

    result = _analyze_single(payload.description)
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    return result


@app.post("/api/batch-analyze")
async def batch_analyze(file: UploadFile = File(...)):
    if get_model() is None:
        raise HTTPException(status_code=503, detail=get_model_error() or "Model not loaded.")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")

    try:
        raw = await file.read()
        if not raw:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")
        df = pd.read_csv(io.BytesIO(raw))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded CSV has no rows.")

    if "description" not in df.columns:
        raise HTTPException(status_code=400, detail="CSV must contain a 'description' column.")

    if "report_id" not in df.columns:
        df.insert(0, "report_id", [f"R{i+1:03d}" for i in range(len(df))])

    df["description"] = df["description"].fillna("").astype(str)
    descriptions = df["description"].tolist()

    preds = predict_sif_batch(descriptions)

    results = []
    high_priority_count = 0
    sif_count = 0
    error_count = 0

    for i, desc in enumerate(descriptions):
        pred = preds[i]

        if pred["error"]:
            error_count += 1
            results.append({
                "report_id": str(df["report_id"].iloc[i]),
                "description": desc,
                "sif_prediction": "Error",
                "sif_confidence": None,
                "life_saving_rule": None,
                "activity": None,
                "hazard": None,
                "barrier_failure": None,
                "risk_priority": None,
                "error": pred["error"],
            })
            continue

        lsr = get_lsr_result(desc)
        precursors = extract_precursors(desc)
        priority, reason = determine_risk_priority(pred["is_sif"], pred["confidence_pct"], precursors["hazard"])

        if pred["is_sif"]:
            sif_count += 1
        if priority == "HIGH":
            high_priority_count += 1

        results.append({
            "report_id": str(df["report_id"].iloc[i]),
            "description": desc,
            "sif_prediction": pred["label"],
            "sif_confidence": pred["confidence_pct"],
            "life_saving_rule": lsr["primary_rule"],
            "activity": precursors["activity"],
            "hazard": precursors["hazard"],
            "barrier_failure": precursors["barrier_failure"],
            "risk_priority": priority,
            "error": None,
        })

    return {
        "reports_processed": len(results),
        "sif_potential": sif_count,
        "non_sif": len(results) - sif_count - error_count,
        "high_priority": high_priority_count,
        "errors": error_count,
        "results": results,
        "disclaimer": MODEL_DISCLAIMER,
    }


@app.get("/api/precursors")
def precursors(
    sif: Optional[str] = Query(None),
    activity: Optional[str] = Query(None),
    hazard: Optional[str] = Query(None),
    lsr: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
):
    filters = {"sif": sif, "activity": activity, "hazard": hazard, "lsr": lsr, "location": location}
    data = analytics.precursor_intelligence(filters=filters)
    if data is None:
        raise HTTPException(status_code=503, detail=analytics.get_dataset_error() or "Dataset unavailable.")
    return data


@app.get("/api/locations")
def locations():
    data = analytics.location_analysis()
    if data is None:
        raise HTTPException(status_code=503, detail=analytics.get_dataset_error() or "Dataset unavailable.")
    return data


@app.get("/api/activities")
def activities():
    return {"activities": analytics.list_distinct("activity")}


@app.get("/api/hazards")
def hazards():
    return {"hazards": analytics.list_distinct("hazard")}


@app.get("/api/life-saving-rules")
def life_saving_rules():
    return {"life_saving_rules": analytics.list_distinct("life_saving_rule")}
