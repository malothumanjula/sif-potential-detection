import React, { useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileSearch,
  UploadCloud,
  Network,
  GitBranch,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AnalyzeReport from "./pages/AnalyzeReport.jsx";
import BatchAnalysis from "./pages/BatchAnalysis.jsx";
import PrecursorIntelligence from "./pages/PrecursorIntelligence.jsx";
import Architecture from "./pages/Architecture.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/analyze", label: "AI Report Analyzer", icon: FileSearch },
  { to: "/batch", label: "Batch Analysis", icon: UploadCloud },
  { to: "/precursors", label: "Precursor Intelligence", icon: Network },
  { to: "/architecture", label: "System Architecture", icon: GitBranch },
];

function MobileNav({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-64 bg-ink-950 border-r border-ink-border h-full flex flex-col">
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-signal-blue/15 border border-signal-blue/30 flex items-center justify-center">
              <ShieldAlert size={16} className="text-signal-blue" />
            </div>
            <span className="font-display font-semibold text-mist-100 text-sm">
              OIL SIF INTELLIGENCE
            </span>
          </div>
          <button onClick={onClose} className="text-mist-400">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-signal-blue/12 text-mist-100 border border-signal-blue/25"
                    : "text-mist-400 hover:text-mist-200 border border-transparent"
                }`
              }
            >
              <Icon size={17} strokeWidth={1.8} />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-ink-900">
      <Sidebar />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden flex items-center justify-between px-4 py-3.5 border-b border-ink-border bg-ink-950 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-signal-blue" />
            <span className="font-display font-semibold text-sm text-mist-100">
              OIL SIF INTELLIGENCE
            </span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="text-mist-300">
            <Menu size={22} />
          </button>
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<AnalyzeReport />} />
            <Route path="/batch" element={<BatchAnalysis />} />
            <Route path="/precursors" element={<PrecursorIntelligence />} />
            <Route path="/architecture" element={<Architecture />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
