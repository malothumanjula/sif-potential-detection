import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import Header from "../components/Header.jsx";
import { Panel, Disclaimer } from "../components/Panel.jsx";
import ResultCard from "../components/ResultCard.jsx";
import { analyzeReport } from "../api.js";

const EXAMPLES = [
  "Worker entered a confined space without atmospheric testing.",
  "Maintenance worker performed welding without proper hot work controls.",
  "Worker was exposed to an energized electrical panel.",
  "Employee was standing below a suspended crane load.",
  "Vehicle driver was operating a vehicle on the site.",
];

export default function AnalyzeReport() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError("Please enter a safety observation or near-miss report before analyzing.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeReport(description);
      setResult(res);
    } catch (e) {
      setError(e?.response?.data?.detail || "Analysis failed. Please check the backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header
        title="AI Report Analyzer"
        subtitle="Analyze a free-text safety observation or near-miss report for SIF precursors"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <Panel title="Enter Safety Observation / Near-Miss Report">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Worker entered a confined space without atmospheric testing."
              rows={7}
              className="w-full bg-ink-800 border border-ink-border rounded-lg px-4 py-3 text-sm text-mist-100 placeholder:text-mist-500 focus:outline-none focus:ring-1 focus:ring-signal-blue resize-none"
            />

            <div className="mt-4">
              <p className="text-xs text-mist-500 mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setDescription(ex)}
                    className="text-xs bg-ink-800 hover:bg-ink-700 border border-ink-border text-mist-300 rounded-full px-3 py-1.5 transition-colors"
                  >
                    Example {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-signal-redDeep/25 border border-signal-red/30 text-signal-red text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-signal-blue hover:bg-signal-blueDeep disabled:opacity-60 text-white font-medium text-sm rounded-lg px-4 py-3 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Analyze Report
                </>
              )}
            </button>
          </Panel>

          <Disclaimer text="AI predictions are decision-support signals and should be validated by qualified HSE personnel." />
        </div>

        <div>
          {result ? (
            <ResultCard result={result} />
          ) : (
            <Panel>
              <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center py-10">
                <Sparkles size={28} className="text-mist-600 mb-3" strokeWidth={1.5} />
                <p className="text-sm text-mist-500 max-w-xs">
                  Enter a report and click <span className="text-mist-300 font-medium">Analyze Report</span> to see
                  the AI-assisted SIF classification, Life-Saving Rule mapping, and precursor breakdown.
                </p>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
