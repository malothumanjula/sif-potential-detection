# OIL SIF Precursor Intelligence

A full-stack hackathon prototype for **Problem Statement 26165**: an AI/NLP
engine to detect Serious Injury & Fatality (SIF) precursors in Oil India
Limited's (OIL) unsafe-act/unsafe-condition and near-miss reports.

> ⚠️ **This is a hackathon prototype, not a production system.** AI
> predictions are decision-support signals only and must be validated by
> qualified HSE personnel. The system does not provide medical, legal, or
> guaranteed fatality predictions, and the "AI-Assisted Risk Priority" is
> **not** an official OIL risk score.

---

## 1. Project overview

The system takes a free-text safety observation / near-miss / unsafe-act
report and:

1. Classifies it as **SIF Potential** or **Non-SIF Potential** using a
   pre-trained TF-IDF + Logistic Regression scikit-learn pipeline
   (`sif_detection_model_tfidf_logreg.joblib` — loaded as-is, **never
   retrained**).
2. Maps it to one or more of OIL's **Life-Saving Rules** using a
   transparent, hybrid keyword-based NLP engine.
3. Extracts **precursor information** — Activity, Hazard, Location, Barrier
   Failure — using rule-based keyword matching.
4. Computes an explainable **AI-Assisted Risk Priority** (HIGH / MEDIUM /
   LOW) and a "why was this flagged" list of detected indicators.
5. Surfaces everything through a professional, dark-themed **HSE
   dashboard** with KPIs, interactive charts, batch CSV analysis, and a
   recurring-pattern intelligence view.

---

## 2. Architecture

```
                    OIL HSE USER
                         |
                         v
                React Frontend  (Vite, Tailwind, Recharts)
                         |
                    REST APIs (Axios)
                         |
                         v
                FastAPI Backend
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
     SIF ML Model   LSR NLP Engine   Precursor Engine
   (TF-IDF + LogReg)  (keyword rules)  (keyword rules)
          |              |              |
          +--------------+--------------+
                         |
                         v
                Risk Prioritization
                (explainable, rule-based)
                         |
                         v
                   HSE Dashboard
```

---

## 3. Features

- **SIF Classification** with confidence bands (Low / Moderate / High) and
  a mandatory "AI predictions are decision-support signals…" disclaimer
  shown throughout the app.
- **Life-Saving Rule engine** covering 8 categories (Energy Isolation, Hot
  Work, Confined Space, Line of Fire, Working at Height, Driving, Safe
  Mechanical Lifting, Dropped Objects) plus "Other / Not Identified",
  returning a primary rule and any secondary matches.
- **Precursor extraction** for Activity, Hazard, Location, and Barrier
  Failure, all keyword-based and fully explainable.
- **Explainable AI** — every analysis shows *why* it was flagged (matched
  keywords, detected hazard, detected barrier weakness) instead of just a
  bare percentage.
- **Executive Dashboard** with KPI cards, 6 interactive Recharts
  visualizations, a "Top SIF Precursor Patterns" table, and live
  server-side filters (SIF/Non-SIF, Activity, Hazard, Life-Saving Rule,
  Location) — nothing is hard-coded in the frontend; all analytics come
  from `/api/dashboard`.
- **Batch Analysis** — upload a CSV, get per-row SIF/LSR/precursor/risk
  results, download the results as CSV. Handles empty files, missing
  columns, invalid CSVs, and empty descriptions without crashing.
- **Precursor Intelligence** page with top activities/hazards/barriers/LSRs/
  locations, a sortable "High-Priority Precursor Matrix", and a location/
  site analysis table.
- **System Architecture** page visualizing the full processing pipeline
  and technology stack.

---

## 4. Dataset — important note

The problem brief describes a 451-record `master_dataset_final.csv` (411
records styled after a public **Industrial Safety Dataset**, 40 from
**IOGP Fatal Incident Reports**; reported split of 240 Non-SIF / 211 SIF
Potential). **That exact file was not provided to build this prototype** —
only the trained `.joblib` model was available. To keep the app runnable
out of the box, `backend/data/master_dataset_final.csv` in this repo is a
**clearly-labeled synthetic placeholder** at the same ~451-row scale (see
`backend/generate_demo_dataset.py` if included, or replace the file
directly).

**Replace this file with your real `master_dataset_final.csv` before any
real demo or deployment** — the backend already computes every dashboard
number dynamically from whatever CSV is in `backend/data/`, so no code
changes are needed, only the file swap.

One thing worth knowing from testing: on the placeholder dataset's varied
phrasing, the model's `predict_proba` output frequently sits close to 50/50
and skews toward "SIF Potential" more than the reported 211/451 (~46.8%)
would suggest. This is consistent with the model's ~73.6% baseline accuracy
and is a sign it may be more confident and better-calibrated on text that
matches its original training distribution (i.e. your real dataset) than on
unfamiliar phrasing. Worth keeping an eye on if you evaluate it on new,
differently-worded reports.

**Data honesty:** the demo dataset is not actual OIL internal HSSE data.
The architecture is designed to ingest OIL's real UA/UC, near-miss, and
incident reports when deployed with authorized OIL data.

---

## 5. AI model

- **Type:** scikit-learn `Pipeline` — `TfidfVectorizer` → `LogisticRegression`
  (`class_weight="balanced"`, `max_iter=3000`).
- **Training:** 451 safety reports, 80/20 train/test split (as reported;
  not re-verified or re-trained here).
- **Reported performance:** ~73.6% baseline accuracy, ~77% SIF recall.
- **Usage:** loaded once at backend startup via `joblib.load()` and reused
  for every request — never retrained, never modified.
- Classes: `0` = Non-SIF Potential, `1` = SIF Potential.

---

## 6. Project structure

```
oil-sif-prototype/
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── index.css
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── Header.jsx
│       │   ├── StatCard.jsx
│       │   ├── RiskBadge.jsx
│       │   ├── ConfidenceBar.jsx
│       │   ├── ResultCard.jsx
│       │   ├── Charts.jsx
│       │   └── Panel.jsx
│       └── pages/
│           ├── Dashboard.jsx
│           ├── AnalyzeReport.jsx
│           ├── BatchAnalysis.jsx
│           ├── PrecursorIntelligence.jsx
│           └── Architecture.jsx
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── model/
│   │   └── sif_detection_model_tfidf_logreg.joblib
│   ├── data/
│   │   └── master_dataset_final.csv
│   └── services/
│       ├── prediction.py
│       ├── lsr_detection.py
│       ├── precursor_extraction.py
│       ├── risk_engine.py
│       └── analytics.py
│
└── README.md
```

---

## 7. API endpoints

| Method | Endpoint                  | Description                                                   |
|--------|----------------------------|----------------------------------------------------------------|
| GET    | `/api/health`              | Model/dataset load status                                     |
| GET    | `/api/dashboard`           | Full dashboard analytics (KPIs, charts, top patterns); supports `sif`, `activity`, `hazard`, `lsr`, `location` query filters |
| POST   | `/api/analyze`             | Analyze a single report — body: `{ "description": "..." }`    |
| POST   | `/api/batch-analyze`       | Multipart CSV upload → per-row analysis + summary counts       |
| GET    | `/api/precursors`          | Precursor intelligence aggregations; supports the same filters |
| GET    | `/api/locations`           | Location/site SIF density analysis                             |
| GET    | `/api/activities`          | Distinct activity categories present in the dataset             |
| GET    | `/api/hazards`             | Distinct hazard categories present in the dataset               |
| GET    | `/api/life-saving-rules`   | Distinct Life-Saving Rules present in the dataset                |

CORS is enabled for `http://localhost:5173`, `http://localhost:4173`, and
`http://localhost:3000`.

---

## 8. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Confirm these files are in place before starting:
- `backend/model/sif_detection_model_tfidf_logreg.joblib`
- `backend/data/master_dataset_final.csv`

Then run:

```bash
uvicorn main:app --reload
```

The API will be available at **http://localhost:8000** (interactive docs
at `http://localhost:8000/docs`).

---

## 9. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**.

---

## 10. How to run locally (full flow)

1. Terminal 1:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
2. Terminal 2:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open **http://localhost:5173** in your browser.

---

## 11. How to test

- **Backend only:** visit `http://localhost:8000/docs` for interactive
  Swagger UI, or:
  ```bash
  curl http://localhost:8000/api/health
  curl -X POST http://localhost:8000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"description":"Worker entered a confined space without atmospheric testing."}'
  ```
- **Batch analysis:** prepare a CSV with a `description` column and:
  ```bash
  curl -X POST http://localhost:8000/api/batch-analyze -F "file=@your_reports.csv"
  ```
- **Frontend:** use the demo flow below.

---

## 12. Suggested 3-minute jury demo flow

1. **Dashboard** — show Total Reports, SIF Potential, Non-SIF, SIF
   Density KPIs and the charts.
2. **AI Report Analyzer** — click an example ("Worker entered a confined
   space without atmospheric testing."), click **Analyze Report**, walk
   through the SIF classification, confidence bar, Life-Saving Rule,
   Activity/Hazard/Barrier Failure, "Why was this flagged?", and Risk
   Priority.
3. **Precursor Intelligence** — show the top activities/hazards/barriers
   and the High-Priority Precursor Matrix.
4. **Batch Analysis** — upload a small CSV, show the processed summary and
   downloadable results.
5. **System Architecture** — close on the pipeline diagram and tech stack.

---

## 13. Limitations

- The SIF model was trained on a relatively small (451-row) dataset and
  has a modest baseline accuracy (~73.6%); it should always be treated as
  a decision-support signal, not ground truth.
- The Life-Saving Rule and precursor-extraction engines are keyword-based
  by design (too few labeled examples per category for a reliable
  multiclass classifier) — they will miss precursors phrased in ways that
  don't match the keyword lists.
- The bundled dataset is a synthetic placeholder, not OIL's real data (see
  Section 4).
- Location analytics use whatever `location` values exist in the dataset
  — they are illustrative, not real OIL site names.
- No authentication, database, or persistence layer — this is a stateless
  prototype.

## 14. Future improvements

- Swap in OIL's real, authorized `master_dataset_final.csv` and retrain/
  recalibrate the SIF model on OIL's actual UA/UC and near-miss report
  language.
- Expand the Life-Saving Rule and precursor keyword lists with OIL HSE
  subject-matter input, or move to a small supervised multiclass model
  once enough labeled examples exist per category.
- Add authentication and role-based access for real HSE deployment.
- Persist analyzed reports to a database for historical trend tracking
  rather than recomputing analytics from a static CSV on each request.
- Add automated tests (backend: pytest; frontend: Vitest/React Testing
  Library).
