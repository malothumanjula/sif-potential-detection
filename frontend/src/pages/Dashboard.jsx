import React, { useEffect, useState, useCallback } from "react";
import {
  Activity,
  ArrowUpRight,
  FileText,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Percent,
} from "lucide-react";
import Header from "../components/Header.jsx";
import StatCard from "../components/StatCard.jsx";
import RiskBadge from "../components/RiskBadge.jsx";
import { Panel, Disclaimer } from "../components/Panel.jsx";
import { SifDistributionDonut, RankedBarChart } from "../components/Charts.jsx";
import { getDashboard } from "../api.js";

const EMPTY_FILTERS = { sif: "", activity: "", hazard: "", lsr: "", location: "" };

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1 min-w-[150px]">
      <label className="text-xs text-mist-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-ink-800 border border-ink-border text-mist-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-signal-blue"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const fetchData = useCallback(async (f) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboard(f);
      setData(res);
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not load dashboard data. Is the backend running on port 8000?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => fetchData(filters);
  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    fetchData(EMPTY_FILTERS);
  };

  const optionsFrom = (list) => (list || []).map((x) => x.name);

  return (
    <div>
      <Header
        title="OIL SIF PRECURSOR INTELLIGENCE"
        subtitle="AI-powered Serious Injury & Fatality precursor detection and HSE decision support"
      />

      <section className="relative overflow-hidden rounded-2xl border border-signal-blue/25 bg-[linear-gradient(110deg,#111e35_0%,#0f1826_58%,#17251f_100%)] px-5 py-6 sm:px-7 sm:py-7 mb-6 shadow-panel">
        <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[28px] border-signal-blue/10" />
        <div className="absolute right-20 -bottom-28 h-48 w-48 rounded-full border-[22px] border-signal-green/10" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-signal-blue">
              <Sparkles size={14} /> Operational intelligence brief
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-mist-100 mt-3">
              See the conditions that make serious harm possible.
            </h2>
            <p className="text-sm leading-relaxed text-mist-300 mt-3 max-w-xl">
              Review the strongest precursor signals across your incident dataset and focus your next HSE conversation where exposure is highest.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-signal-green/10 border border-signal-green/25 px-3 py-1.5 text-xs font-medium text-signal-green">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-green shadow-[0_0_10px_#33B27A]" /> Model online
              </span>
              <span className="text-xs text-mist-400">Last refreshed from the active dataset</span>
            </div>
          </div>
          <div className="relative min-w-[190px] rounded-xl border border-white/10 bg-black/15 p-4 lg:mr-2">
            <div className="flex items-center justify-between text-xs text-mist-400">
              <span>Highest signal</span>
              <Activity size={15} className="text-signal-amber" />
            </div>
            <p className="font-display text-xl font-semibold text-mist-100 mt-3">
              {data?.top_precursor_patterns?.[0]?.activity || "Awaiting data"}
            </p>
            <p className="text-xs text-mist-400 mt-1">
              {data?.top_precursor_patterns?.[0]?.sif_density != null
                ? `${data.top_precursor_patterns[0].sif_density}% SIF density`
                : "Top precursor pattern"}
            </p>
            <div className="flex items-center gap-1 text-xs text-signal-blue mt-4">
              Explore pattern <ArrowUpRight size={13} />
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 bg-signal-redDeep/25 border border-signal-red/30 text-signal-red text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="text-mist-400 text-sm">Loading dashboard…</div>
      )}

      {data && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-signal-blue" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-mist-400">Dataset pulse</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            <StatCard label="Total Reports" value={data.total_reports} hint="Across all records" icon={FileText} />
            <StatCard label="SIF Potential" value={data.sif_reports} hint="Requires attention" tone="red" icon={ShieldAlert} />
            <StatCard label="Non-SIF" value={data.non_sif_reports} hint="Lower severity signal" tone="green" icon={ShieldCheck} />
            <StatCard label="SIF Density" value={`${data.sif_density}%`} hint="Share of total reports" tone="amber" icon={Percent} />
          </div>

          <Panel
            title="Refine the intelligence view"
            className="mb-7"
            action={
              <button
                onClick={resetFilters}
                className="text-xs text-mist-400 hover:text-mist-200 flex items-center gap-1"
              >
                <RefreshCw size={13} /> Reset
              </button>
            }
          >
            <div className="flex flex-wrap gap-3 items-end">
              <FilterSelect
                label="SIF / Non-SIF"
                value={filters.sif}
                onChange={(v) => setFilters((f) => ({ ...f, sif: v }))}
                options={["SIF Potential", "Non-SIF Potential"]}
              />
              <FilterSelect
                label="Activity"
                value={filters.activity}
                onChange={(v) => setFilters((f) => ({ ...f, activity: v }))}
                options={optionsFrom(data.top_activities)}
              />
              <FilterSelect
                label="Hazard"
                value={filters.hazard}
                onChange={(v) => setFilters((f) => ({ ...f, hazard: v }))}
                options={optionsFrom(data.top_hazards)}
              />
              <FilterSelect
                label="Life-Saving Rule"
                value={filters.lsr}
                onChange={(v) => setFilters((f) => ({ ...f, lsr: v }))}
                options={optionsFrom(data.top_lsr)}
              />
              <FilterSelect
                label="Location"
                value={filters.location}
                onChange={(v) => setFilters((f) => ({ ...f, location: v }))}
                options={optionsFrom(data.top_locations)}
              />
              <button
                onClick={applyFilters}
                className="bg-signal-blue hover:bg-signal-blueDeep text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
              >
                Apply
              </button>
            </div>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <Panel title="SIF vs Non-SIF Distribution">
              <SifDistributionDonut data={data.sif_distribution} />
            </Panel>
            <Panel title="SIF Reports by Activity">
              <RankedBarChart data={data.top_activities} barColor="#4C7CF0" />
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <Panel title="SIF Reports by Hazard">
              <RankedBarChart data={data.top_hazards} barColor="#E5484D" />
            </Panel>
            <Panel title="SIF Reports by Life-Saving Rule">
              <RankedBarChart data={data.top_lsr} barColor="#F0A93E" />
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <Panel title="SIF Reports by Barrier Failure">
              <RankedBarChart data={data.top_barriers} barColor="#33B27A" />
            </Panel>
            <Panel title="SIF Reports by Location">
              <RankedBarChart data={data.top_locations} barColor="#8494B3" />
            </Panel>
          </div>

          <Panel title="Top SIF Precursor Patterns" className="mb-6">
            {data.top_precursor_patterns?.length > 0 ? (
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-mist-500 text-xs uppercase tracking-wide border-b border-ink-border">
                      <th className="py-2 pr-4">Rank</th>
                      <th className="py-2 pr-4">Activity</th>
                      <th className="py-2 pr-4">Hazard</th>
                      <th className="py-2 pr-4">Barrier Failure</th>
                      <th className="py-2 pr-4">SIF Reports</th>
                      <th className="py-2 pr-4">SIF Density</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_precursor_patterns.map((row) => (
                      <tr key={row.rank} className="border-b border-ink-border/60 last:border-b-0">
                        <td className="py-2.5 pr-4 text-mist-400">#{row.rank}</td>
                        <td className="py-2.5 pr-4 text-mist-100 font-medium">{row.activity}</td>
                        <td className="py-2.5 pr-4 text-mist-300">{row.hazard}</td>
                        <td className="py-2.5 pr-4 text-mist-300">{row.barrier_failure}</td>
                        <td className="py-2.5 pr-4 text-mist-100">{row.sif_reports}</td>
                        <td className="py-2.5 pr-4 text-signal-red font-medium">{row.sif_density}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-mist-500">No SIF Potential reports match the current filters.</p>
            )}
          </Panel>

          <div className="bg-ink-800 border border-ink-border rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-mist-400 leading-relaxed">{data.data_source_note}</p>
          </div>
          <Disclaimer text={data.disclaimer} />
        </>
      )}
    </div>
  );
}
