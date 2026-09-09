import React from "react";
import { ArrowDown, Cpu, Server, Database, BarChart3, Layers } from "lucide-react";
import Header from "../components/Header.jsx";
import { Panel, Disclaimer } from "../components/Panel.jsx";

const PIPELINE_STEPS = [
  "Safety Report",
  "Text Preprocessing",
  "TF-IDF + Logistic Regression",
  "SIF Potential Classification",
  "Hybrid NLP Engine",
  "Life-Saving Rule · Activity · Hazard · Barrier Failure",
  "AI-Assisted Risk Priority",
  "HSE Decision Dashboard",
];

const STACK = [
  { icon: Layers, label: "Frontend", value: "React + Vite + Tailwind CSS" },
  { icon: Server, label: "Backend", value: "FastAPI (Python)" },
  { icon: Cpu, label: "AI", value: "Scikit-learn (TF-IDF + Logistic Regression)" },
  { icon: Database, label: "Data", value: "Pandas / CSV" },
  { icon: BarChart3, label: "Visualization", value: "Recharts" },
];

export default function Architecture() {
  return (
    <div>
      <Header
        title="System Architecture"
        subtitle="How a safety report flows through the SIF precursor detection pipeline"
      />

      <Panel title="Processing Pipeline" className="mb-6">
        <div className="flex flex-col items-center py-2">
          {PIPELINE_STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className="w-full max-w-lg bg-ink-800 border border-ink-border rounded-lg px-5 py-3 text-center">
                <span className="text-sm font-medium text-mist-100">{step}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <ArrowDown size={18} className="text-signal-blue my-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      </Panel>

      <Panel title="Technology Stack" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STACK.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-ink-800 border border-ink-border rounded-lg p-4">
              <Icon size={18} className="text-signal-blue mb-2" strokeWidth={1.8} />
              <div className="text-xs text-mist-500">{label}</div>
              <div className="text-sm font-medium text-mist-100 mt-0.5">{value}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="About This Prototype" className="mb-6">
        <p className="text-sm text-mist-300 leading-relaxed">
          This is a hackathon prototype demonstrating AI-based SIF precursor classification,
          Life-Saving Rule identification, precursor extraction, recurring pattern detection,
          and AI-assisted risk prioritization for HSE decision support. It is{" "}
          <span className="font-semibold text-mist-100">not production-ready</span>.
        </p>
        <p className="text-sm text-mist-300 leading-relaxed mt-3">
          The SIF classification model is a TF-IDF + Logistic Regression pipeline trained on
          451 safety reports (80/20 train/test split), with a reported baseline accuracy of
          approximately 73.6% and SIF recall of approximately 77%. The Life-Saving Rule mapping
          and precursor extraction (activity, hazard, location, barrier failure) use a transparent,
          hybrid keyword-based NLP engine rather than a second machine learning model, since the
          available labeled examples per Life-Saving Rule category are too few to train a reliable
          multiclass classifier.
        </p>
        <p className="text-sm text-mist-300 leading-relaxed mt-3">
          The demo dataset combines records styled after a public Industrial Safety Dataset and
          IOGP Fatal Incident Reports — it is <span className="font-semibold text-mist-100">not</span>{" "}
          OIL's internal HSSE data. The architecture is designed to ingest OIL's actual UA/UC,
          near-miss, and incident reports when deployed with authorized OIL data.
        </p>
      </Panel>

      <Disclaimer text="AI predictions are decision-support signals and should be validated by qualified HSE personnel. This system does not provide medical, legal, or guaranteed fatality predictions." />
    </div>
  );
}
