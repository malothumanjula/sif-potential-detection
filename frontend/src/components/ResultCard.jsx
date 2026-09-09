import React from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import RiskBadge from "./RiskBadge.jsx";
import ConfidenceBar from "./ConfidenceBar.jsx";

function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-ink-border last:border-b-0">
      <span className="text-sm text-mist-400">{label}</span>
      <span className="text-sm font-medium text-mist-100 text-right">{value || "Not Identified"}</span>
    </div>
  );
}

export default function ResultCard({ result }) {
  if (!result) return null;

  const isSif = result.sif_prediction === "SIF Potential";

  return (
    <div className="bg-ink-850 border border-ink-border rounded-xl shadow-panel overflow-hidden">
      <div className="px-6 py-4 border-b border-ink-border flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-mist-300 tracking-wide">
          AI SAFETY ANALYSIS
        </h3>
        <RiskBadge priority={result.risk_priority} />
      </div>

      <div className="px-6 py-5">
        <div className="flex items-center gap-3 mb-5">
          {isSif ? (
            <AlertTriangle className="text-signal-red" size={28} strokeWidth={1.8} />
          ) : (
            <CheckCircle2 className="text-signal-green" size={28} strokeWidth={1.8} />
          )}
          <div>
            <div
              className={`font-display text-xl font-semibold ${
                isSif ? "text-signal-red" : "text-signal-green"
              }`}
            >
              {isSif ? "SIF POTENTIAL" : "NON-SIF POTENTIAL"}
            </div>
            <div className="text-xs text-mist-500">Fatal-potential precursor classification</div>
          </div>
        </div>

        <ConfidenceBar confidence={result.sif_confidence} note={result.confidence_note} />

        <div className="mt-5">
          <Field label="Life-Saving Rule" value={result.life_saving_rule} />
          {result.secondary_rules?.length > 0 && (
            <Field label="Secondary Rules" value={result.secondary_rules.join(", ")} />
          )}
          <Field label="Activity" value={result.activity} />
          <Field label="Hazard" value={result.hazard} />
          <Field label="Barrier Failure" value={result.barrier_failure} />
          <Field label="Location Cue" value={result.location} />
        </div>

        {result.detected_indicators?.length > 0 && (
          <div className="mt-5 bg-ink-800 border border-ink-border rounded-lg p-4">
            <p className="text-xs font-semibold text-mist-300 mb-2.5">Why was this flagged?</p>
            <ul className="space-y-1.5">
              {result.detected_indicators.map((ind, i) => (
                <li key={i} className="text-sm text-mist-300 flex items-start gap-2">
                  <span className="text-signal-blue mt-0.5">✓</span>
                  <span>{ind}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-mist-500 mt-3">
              These indicators contributed to the AI-assisted SIF precursor flag.
            </p>
          </div>
        )}

        <div
          className={`mt-5 rounded-lg px-4 py-3 border flex items-center gap-2.5 ${
            isSif
              ? "bg-signal-redDeep/25 border-signal-red/30 text-signal-red"
              : "bg-signal-greenDeep/25 border-signal-green/30 text-signal-green"
          }`}
        >
          {isSif ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
          <span className="text-sm font-semibold">
            {isSif ? "Immediate HSE Review Recommended" : "Routine HSE Review"}
          </span>
        </div>

        <p className="text-xs text-mist-500 mt-4">
          Risk priority is an <span className="text-mist-400 font-medium">AI-Assisted Risk Priority</span>,
          not an official OIL risk score. {result.risk_reason}
        </p>
      </div>
    </div>
  );
}
