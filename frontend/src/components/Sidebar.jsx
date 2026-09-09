import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileSearch,
  UploadCloud,
  Network,
  GitBranch,
  ShieldAlert,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/analyze", label: "AI Report Analyzer", icon: FileSearch },
  { to: "/batch", label: "Batch Analysis", icon: UploadCloud },
  { to: "/precursors", label: "Precursor Intelligence", icon: Network },
  { to: "/architecture", label: "System Architecture", icon: GitBranch },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 bg-ink-950/95 border-r border-ink-border">
      <div className="flex items-center gap-2.5 px-6 py-6 border-b border-white/[0.04]">
        <div className="w-9 h-9 rounded-lg bg-signal-blue/15 border border-signal-blue/30 flex items-center justify-center shadow-[0_0_24px_rgba(76,124,240,0.12)]">
          <ShieldAlert size={18} className="text-signal-blue" />
        </div>
        <div>
          <div className="font-display font-semibold text-mist-100 text-sm leading-tight tracking-tight">
            OIL SIF
          </div>
          <div className="font-display font-semibold text-mist-100 text-sm leading-tight tracking-tight">
            INTELLIGENCE
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 mt-2 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-signal-blue/12 text-mist-100 border border-signal-blue/25 shadow-[inset_3px_0_0_#4C7CF0]"
                  : "text-mist-400 hover:text-mist-200 hover:bg-ink-800 border border-transparent"
              }`
            }
          >
            <Icon size={17} strokeWidth={1.8} />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-5 border-t border-ink-border">
        <p className="text-xs font-medium text-mist-300">AI Decision Support System</p>
        <p className="text-xs text-mist-500 mt-0.5">Prototype · Hackathon Build</p>
      </div>
    </aside>
  );
}
