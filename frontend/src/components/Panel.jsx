import React from "react";

export function Panel({ title, action, children, className = "" }) {
  return (
    <div className={`bg-ink-850/90 border border-white/[0.07] rounded-xl shadow-panel backdrop-blur-sm ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-mist-200">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Disclaimer({ text }) {
  return (
    <div className="mt-6 flex items-start gap-2.5 bg-ink-800 border border-ink-border rounded-lg px-4 py-3">
      <div className="w-1.5 h-1.5 rounded-full bg-signal-blue mt-1.5 shrink-0" />
      <p className="text-xs text-mist-400 leading-relaxed">{text}</p>
    </div>
  );
}
