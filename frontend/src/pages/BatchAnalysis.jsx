import React, { useState, useRef } from "react";
import { UploadCloud, Download, Loader2, FileWarning, FileText, ShieldAlert, AlertTriangle } from "lucide-react";
import Header from "../components/Header.jsx";
import { Panel, Disclaimer } from "../components/Panel.jsx";
import StatCard from "../components/StatCard.jsx";
import RiskBadge from "../components/RiskBadge.jsx";
import { batchAnalyze } from "../api.js";

function toCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = [
    "report_id",
    "description",
    "sif_prediction",
    "sif_confidence",
    "life_saving_rule",
    "activity",
    "hazard",
    "barrier_failure",
    "risk_priority",
  ];
  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export default function BatchAnalysis() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a CSV file first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await batchAnalyze(file);
      setResult(res);
    } catch (e) {
      setError(e?.response?.data?.detail || "Batch analysis failed. Please check the file and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.results) return;
    const csv = toCsv(result.results);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sif_batch_analysis_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Header
        title="Batch Analysis"
        subtitle="Upload a CSV of safety reports for bulk SIF precursor analysis"
      />

      <Panel title="Upload CSV" className="mb-6">
        <p className="text-xs text-mist-500 mb-4">
          The file must contain a <code className="text-mist-300">description</code> column. Optional columns:{" "}
          <code className="text-mist-300">report_id</code>, <code className="text-mist-300">date</code>,{" "}
          <code className="text-mist-300">country</code>, <code className="text-mist-300">location</code>,{" "}
          <code className="text-mist-300">activity</code>, <code className="text-mist-300">hazard</code>.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-ink-border hover:border-signal-blue/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
        >
          <UploadCloud size={28} className="mx-auto text-mist-500 mb-2" strokeWidth={1.6} />
          <p className="text-sm text-mist-300">
            {file ? (
              <span className="font-medium text-mist-100">{file.name}</span>
            ) : (
              <>Click to choose a CSV file, or drag one here</>
            )}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 bg-signal-redDeep/25 border border-signal-red/30 text-signal-red text-sm rounded-lg px-4 py-3">
            <FileWarning size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="mt-5 flex items-center justify-center gap-2 bg-signal-blue hover:bg-signal-blueDeep disabled:opacity-50 text-white font-medium text-sm rounded-lg px-5 py-2.5 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Processing…
            </>
          ) : (
            "Run Batch Analysis"
          )}
        </button>
      </Panel>

      {result && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Reports Processed" value={result.reports_processed} icon={FileText} />
            <StatCard label="SIF Potential" value={result.sif_potential} tone="red" icon={ShieldAlert} />
            <StatCard label="Non-SIF" value={result.non_sif} tone="green" />
            <StatCard label="High Priority" value={result.high_priority} tone="amber" icon={AlertTriangle} />
          </div>

          <Panel
            title="Results"
            action={
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs bg-ink-800 hover:bg-ink-700 border border-ink-border text-mist-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                <Download size={13} /> Download Results CSV
              </button>
            }
            className="mb-6"
          >
            <div className="overflow-x-auto -mx-5 px-5 max-h-[480px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-ink-850">
                  <tr className="text-left text-mist-500 text-xs uppercase tracking-wide border-b border-ink-border">
                    <th className="py-2 pr-4">Report ID</th>
                    <th className="py-2 pr-4 min-w-[260px]">Description</th>
                    <th className="py-2 pr-4">SIF</th>
                    <th className="py-2 pr-4">Confidence</th>
                    <th className="py-2 pr-4">Life-Saving Rule</th>
                    <th className="py-2 pr-4">Activity</th>
                    <th className="py-2 pr-4">Hazard</th>
                    <th className="py-2 pr-4">Barrier Failure</th>
                    <th className="py-2 pr-4">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((row, i) => (
                    <tr key={i} className="border-b border-ink-border/60 last:border-b-0 align-top">
                      <td className="py-2.5 pr-4 text-mist-400 whitespace-nowrap">{row.report_id}</td>
                      <td className="py-2.5 pr-4 text-mist-300 max-w-[320px]">{row.description}</td>
                      {row.error ? (
                        <td colSpan={6} className="py-2.5 pr-4 text-signal-amber text-xs">
                          {row.error}
                        </td>
                      ) : (
                        <>
                          <td className="py-2.5 pr-4 whitespace-nowrap">
                            <span
                              className={
                                row.sif_prediction === "SIF Potential" ? "text-signal-red font-medium" : "text-signal-green font-medium"
                              }
                            >
                              {row.sif_prediction}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-mist-100 whitespace-nowrap">{row.sif_confidence}%</td>
                          <td className="py-2.5 pr-4 text-mist-300 whitespace-nowrap">{row.life_saving_rule}</td>
                          <td className="py-2.5 pr-4 text-mist-300 whitespace-nowrap">{row.activity}</td>
                          <td className="py-2.5 pr-4 text-mist-300 whitespace-nowrap">{row.hazard}</td>
                          <td className="py-2.5 pr-4 text-mist-300 whitespace-nowrap">{row.barrier_failure}</td>
                          <td className="py-2.5 pr-4 whitespace-nowrap">
                            <RiskBadge priority={row.risk_priority} size="sm" />
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Disclaimer text={result.disclaimer} />
        </>
      )}
    </div>
  );
}
