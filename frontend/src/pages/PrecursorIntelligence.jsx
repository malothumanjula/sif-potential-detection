import React, { useEffect, useState, useCallback } from "react";
import { ArrowUpDown } from "lucide-react";
import Header from "../components/Header.jsx";
import { Panel, Disclaimer } from "../components/Panel.jsx";
import { SimpleBarChart } from "../components/Charts.jsx";
import { getPrecursors, getLocations } from "../api.js";

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

function MiniStatTable({ title, rows }) {
  return (
    <Panel title={title}>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-mist-500 text-xs uppercase tracking-wide border-b border-ink-border">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2 pr-3">SIF</th>
              <th className="py-2 pr-3">Density</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r) => (
              <tr key={r.name} className="border-b border-ink-border/60 last:border-b-0">
                <td className="py-2 pr-3 text-mist-200 font-medium">{r.name}</td>
                <td className="py-2 pr-3 text-mist-400">{r.total}</td>
                <td className="py-2 pr-3 text-mist-100">{r.sif}</td>
                <td className="py-2 pr-3 text-signal-red font-medium">{r.sif_density}%</td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-mist-500 text-sm">
                  No data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

const SORT_FIELDS = [
  { key: "sif_reports", label: "SIF Reports" },
  { key: "sif_density", label: "SIF Density" },
];

export default function PrecursorIntelligence() {
  const [data, setData] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState("sif_reports");
  const [sortDir, setSortDir] = useState("desc");

  const fetchData = useCallback(async (f) => {
    setLoading(true);
    setError(null);
    try {
      const [precursorRes, locationRes] = await Promise.all([getPrecursors(f), getLocations()]);
      setData(precursorRes);
      setLocationData(locationRes);
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not load precursor intelligence data.");
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

  const sortedMatrix = data?.precursor_matrix
    ? [...data.precursor_matrix].sort((a, b) =>
        sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
      )
    : [];

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div>
      <Header
        title="Recurring SIF Precursor Intelligence"
        subtitle="Patterns across activities, hazards, barrier failures, Life-Saving Rules, and locations"
      />

      {error && (
        <div className="mb-6 bg-signal-redDeep/25 border border-signal-red/30 text-signal-red text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading && !data && <div className="text-mist-400 text-sm">Loading precursor intelligence…</div>}

      {data && (
        <>
          <Panel
            title="Filters"
            className="mb-6"
            action={
              <button onClick={resetFilters} className="text-xs text-mist-400 hover:text-mist-200">
                Reset
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
            <Panel title="Top Activities">
              <SimpleBarChart data={data.top_activities} dataKey="sif" barColor="#4C7CF0" />
            </Panel>
            <Panel title="Top Hazards">
              <SimpleBarChart data={data.top_hazards} dataKey="sif" barColor="#E5484D" />
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <Panel title="Top Barrier Failures">
              <SimpleBarChart data={data.top_barriers} dataKey="sif" barColor="#33B27A" />
            </Panel>
            <Panel title="Top Life-Saving Rules">
              <SimpleBarChart data={data.top_lsr} dataKey="sif" barColor="#F0A93E" />
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <MiniStatTable title="Top Activities — Detail" rows={data.top_activities} />
            <MiniStatTable title="Top Hazards — Detail" rows={data.top_hazards} />
          </div>

          <Panel title="High-Priority Precursor Matrix" className="mb-6">
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-mist-500 text-xs uppercase tracking-wide border-b border-ink-border">
                    <th className="py-2 pr-4">Activity</th>
                    <th className="py-2 pr-4">Hazard</th>
                    <th className="py-2 pr-4">Barrier Failure</th>
                    {SORT_FIELDS.map((f) => (
                      <th key={f.key} className="py-2 pr-4">
                        <button
                          onClick={() => toggleSort(f.key)}
                          className="flex items-center gap-1 hover:text-mist-200"
                        >
                          {f.label} <ArrowUpDown size={12} />
                        </button>
                      </th>
                    ))}
                    <th className="py-2 pr-4">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMatrix.map((row, i) => {
                    const priority = row.sif_density >= 15 ? "HIGH" : row.sif_density >= 8 ? "MEDIUM" : "LOW";
                    const priorityColor =
                      priority === "HIGH" ? "text-signal-red" : priority === "MEDIUM" ? "text-signal-amber" : "text-signal-green";
                    return (
                      <tr key={i} className="border-b border-ink-border/60 last:border-b-0">
                        <td className="py-2.5 pr-4 text-mist-100 font-medium">{row.activity}</td>
                        <td className="py-2.5 pr-4 text-mist-300">{row.hazard}</td>
                        <td className="py-2.5 pr-4 text-mist-300">{row.barrier_failure}</td>
                        <td className="py-2.5 pr-4 text-mist-100">{row.sif_reports}</td>
                        <td className="py-2.5 pr-4 text-mist-100">{row.sif_density}%</td>
                        <td className={`py-2.5 pr-4 font-semibold ${priorityColor}`}>{priority}</td>
                      </tr>
                    );
                  })}
                  {sortedMatrix.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-mist-500 text-sm">
                        No SIF Potential reports match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {locationData && (
            <Panel title="Location / Site Analysis" className="mb-6">
              <p className="text-xs text-mist-400 mb-4">{locationData.note}</p>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-mist-500 text-xs uppercase tracking-wide border-b border-ink-border">
                      <th className="py-2 pr-4">Location</th>
                      <th className="py-2 pr-4">Total Reports</th>
                      <th className="py-2 pr-4">SIF Reports</th>
                      <th className="py-2 pr-4">SIF Density</th>
                      <th className="py-2 pr-4">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationData.locations.map((loc) => {
                      const priorityColor =
                        loc.priority === "HIGH" ? "text-signal-red" : loc.priority === "MEDIUM" ? "text-signal-amber" : "text-signal-green";
                      return (
                        <tr key={loc.name} className="border-b border-ink-border/60 last:border-b-0">
                          <td className="py-2.5 pr-4 text-mist-100 font-medium">{loc.name}</td>
                          <td className="py-2.5 pr-4 text-mist-400">{loc.total}</td>
                          <td className="py-2.5 pr-4 text-mist-100">{loc.sif}</td>
                          <td className="py-2.5 pr-4 text-mist-100">{loc.sif_density}%</td>
                          <td className={`py-2.5 pr-4 font-semibold ${priorityColor}`}>{loc.priority}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          <Disclaimer text="AI predictions are decision-support signals and should be validated by qualified HSE personnel." />
        </>
      )}
    </div>
  );
}
