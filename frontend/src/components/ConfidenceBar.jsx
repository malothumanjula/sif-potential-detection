import React from "react";

export default function ConfidenceBar({ confidence, note }) {
  const pct = Math.max(0, Math.min(100, confidence ?? 0));

  let barColor = "bg-signal-red";
  if (pct >= 80) barColor = "bg-signal-green";
  else if (pct >= 60) barColor = "bg-signal-amber";

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-medium text-mist-400">Model confidence</span>
        <span className="font-display text-sm font-semibold text-mist-100">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {note && <p className="text-xs text-mist-500 mt-1.5">{note}</p>}
    </div>
  );
}
