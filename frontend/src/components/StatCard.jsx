import React from "react";

export default function StatCard({ label, value, tone = "default", icon: Icon, hint }) {
  const toneStyles = {
    default: "text-mist-100",
    red: "text-signal-red",
    amber: "text-signal-amber",
    green: "text-signal-green",
    blue: "text-signal-blue",
  };

  return (
    <div className="group bg-ink-850/90 border border-white/[0.07] rounded-xl px-5 py-4 shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:border-signal-blue/25">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-mist-400 tracking-wide">{label}</span>
        {Icon && <Icon size={16} className="text-mist-500 transition-colors group-hover:text-signal-blue" strokeWidth={1.8} />}
      </div>
      <div className={`font-display text-3xl font-semibold mt-2 ${toneStyles[tone]}`}>
        {value}
      </div>
      {hint && <div className="text-xs text-mist-500 mt-1">{hint}</div>}
    </div>
  );
}
