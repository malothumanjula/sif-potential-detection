import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

const CONFIG = {
  HIGH: {
    bg: "bg-signal-redDeep/40",
    border: "border-signal-red/40",
    text: "text-signal-red",
    icon: AlertTriangle,
  },
  MEDIUM: {
    bg: "bg-signal-amberDeep/40",
    border: "border-signal-amber/40",
    text: "text-signal-amber",
    icon: AlertCircle,
  },
  LOW: {
    bg: "bg-signal-greenDeep/40",
    border: "border-signal-green/40",
    text: "text-signal-green",
    icon: CheckCircle2,
  },
  UNKNOWN: {
    bg: "bg-ink-700",
    border: "border-ink-border",
    text: "text-mist-400",
    icon: HelpCircle,
  },
};

export default function RiskBadge({ priority, size = "md" }) {
  const cfg = CONFIG[priority] || CONFIG.UNKNOWN;
  const Icon = cfg.icon;
  const sizeCls = size === "sm" ? "text-xs px-2 py-0.5 gap-1" : "text-sm px-3 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${cfg.bg} ${cfg.border} ${cfg.text} ${sizeCls}`}
    >
      <Icon size={size === "sm" ? 12 : 14} strokeWidth={2} />
      {priority || "UNKNOWN"}
    </span>
  );
}
