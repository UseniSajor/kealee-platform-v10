"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@ops/lib/api";

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function AiToolsPage() {
  const [error, setError] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loadingEstimates, setLoadingEstimates] = useState(true);

  // Active tool
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolLoading, setToolLoading] = useState(false);
  const [toolResult, setToolResult] = useState<any>(null);

  // Tool inputs
  const [selectedEstimateId, setSelectedEstimateId] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Scope analysis inputs
  const [projectDescription, setProjectDescription] = useState("");
  const [projectType, setProjectType] = useState("commercial");

  // Cost prediction inputs
  const [squareFootage, setSquareFootage] = useState("");
  const [location, setLocation] = useState("");
  const [costProjectType, setCostProjectType] = useState("commercial");

  // Value engineering inputs
  const [targetReduction, setTargetReduction] = useState("10");

  useEffect(() => {
    async function loadEstimates() {
      try {
        const result = await api.listEstimates();
        setEstimates(result.estimates || []);
      } catch {
        // Silently handle - estimates are optional for some tools
      } finally {
        setLoadingEstimates(false);
      }
    }
    loadEstimates();
  }, []);

  async function runScopeAnalysis() {
    setToolLoading(true);
    setError(null);
    setToolResult(null);
    try {
      const result = await api.runScopeAnalysis({
        estimateId: selectedEstimateId || undefined,
        projectDescription: projectDescription.trim() || undefined,
        projectType: projectType || undefined,
      });
      setToolResult(result.analysis);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scope analysis failed");
    } finally {
      setToolLoading(false);
    }
  }

  async function runCostPrediction() {
    setToolLoading(true);
    setError(null);
    setToolResult(null);
    try {
      const result = await api.runCostPrediction({
        estimateId: selectedEstimateId || undefined,
        projectType: costProjectType || undefined,
        squareFootage: squareFootage ? Number(squareFootage) : undefined,
        location: location.trim() || undefined,
      });
      setToolResult(result.prediction);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Cost prediction failed");
    } finally {
      setToolLoading(false);
    }
  }

  async function runValueEngineering() {
    if (!selectedEstimateId) {
      setError("Please select an estimate for value engineering.");
      return;
    }
    setToolLoading(true);
    setError(null);
    setToolResult(null);
    try {
      const result = await api.runValueEngineering({
        estimateId: selectedEstimateId,
        targetReduction: targetReduction ? Number(targetReduction) : undefined,
      });
      setToolResult(result.suggestions);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Value engineering failed");
    } finally {
      setToolLoading(false);
    }
  }

  async function runCompareEstimates() {
    if (compareIds.length < 2) {
      setError("Select at least 2 estimates to compare.");
      return;
    }
    setToolLoading(true);
    setError(null);
    setToolResult(null);
    try {
      const result = await api.compareEstimates({ estimateIds: compareIds });
      setToolResult(result.comparison);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      setToolLoading(false);
    }
  }

  async function runBenchmark() {
    if (!selectedEstimateId) {
      setError("Please select an estimate to benchmark.");
      return;
    }
    setToolLoading(true);
    setError(null);
    setToolResult(null);
    try {
      const result = await api.benchmarkEstimate({ estimateId: selectedEstimateId });
      setToolResult(result.benchmark);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Benchmark failed");
    } finally {
      setToolLoading(false);
    }
  }

  function handleCompareToggle(id: string) {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function clearTool() {
    setActiveTool(null);
    setToolResult(null);
    setError(null);
  }

  const tools = [
    {
      id: "scope",
      name: "Scope Analysis",
      description:
        "AI analyzes project scope to identify missing items, suggest inclusions, and validate completeness.",
      run: runScopeAnalysis,
    },
    {
      id: "cost",
      name: "Cost Prediction",
      description:
        "Predict project costs based on type, size, and location using AI and historical data.",
      run: runCostPrediction,
    },
    {
      id: "value",
      name: "Value Engineering",
      description:
        "Identify cost savings opportunities while maintaining or improving quality and performance.",
      run: runValueEngineering,
    },
    {
      id: "compare",
      name: "Compare Estimates",
      description:
        "Side-by-side comparison of multiple estimates to identify differences and alignment.",
      run: runCompareEstimates,
    },
    {
      id: "benchmark",
      name: "Benchmark Estimate",
      description:
        "Compare your estimate against industry benchmarks and similar projects.",
      run: runBenchmark,
    },
  ];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">AI Tools</h1>
          <p className="mt-2 text-sm text-zinc-700">
            AI-powered analysis tools for cost estimation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/ops/portal/estimation/ai-takeoff"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          >
            AI Takeoff
          </Link>
          <Link
            href="/ops/portal/estimation"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          >
            Back to Estimates
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-3 text-xs font-black underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tool selection grid */}
      {!activeTool && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTool(tool.id)}
              className="rounded-2xl border border-black/10 bg-white p-5 text-left shadow-sm transition hover:border-[var(--primary)]/30 hover:shadow-md"
            >
              <div className="text-sm font-black text-zinc-950">{tool.name}</div>
              <p className="mt-2 text-xs text-zinc-600 leading-relaxed">{tool.description}</p>
              <div className="mt-3 text-xs font-extrabold text-[var(--primary)]">
                Open tool &rarr;
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Active tool panel */}
      {activeTool && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Left: Tool inputs */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black tracking-tight">
                  {tools.find((t) => t.id === activeTool)?.name}
                </h2>
                <button
                  type="button"
                  onClick={clearTool}
                  className="text-sm font-extrabold text-zinc-600 hover:underline"
                >
                  Back to tools
                </button>
              </div>
              <p className="mt-1 text-sm text-zinc-700">
                {tools.find((t) => t.id === activeTool)?.description}
              </p>

              <div className="mt-5 space-y-4">
                {/* Estimate selector (used by most tools) */}
                {activeTool !== "compare" && (
                  <div>
                    <label className="block text-sm font-extrabold text-zinc-900">
                      Select estimate {activeTool === "value" || activeTool === "benchmark" ? "(required)" : "(optional)"}
                    </label>
                    <select
                      value={selectedEstimateId}
                      onChange={(e) => setSelectedEstimateId(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                    >
                      <option value="">-- None --</option>
                      {estimates.map((est) => (
                        <option key={est.id} value={est.id}>
                          {est.name || "Untitled"}{" "}
                          {est.totalCost != null ? `(${formatMoney(est.totalCost)})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Scope analysis inputs */}
                {activeTool === "scope" && (
                  <>
                    <div>
                      <label className="block text-sm font-extrabold text-zinc-900">
                        Project description
                      </label>
                      <textarea
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        rows={3}
                        placeholder="Describe the project scope, building type, systems..."
                        className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold text-zinc-900">
                        Project type
                      </label>
                      <select
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                      >
                        <option value="commercial">Commercial</option>
                        <option value="residential">Residential</option>
                        <option value="industrial">Industrial</option>
                        <option value="institutional">Institutional</option>
                        <option value="mixed_use">Mixed Use</option>
                        <option value="renovation">Renovation</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Cost prediction inputs */}
                {activeTool === "cost" && (
                  <>
                    <div>
                      <label className="block text-sm font-extrabold text-zinc-900">
                        Project type
                      </label>
                      <select
                        value={costProjectType}
                        onChange={(e) => setCostProjectType(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                      >
                        <option value="commercial">Commercial</option>
                        <option value="residential">Residential</option>
                        <option value="industrial">Industrial</option>
                        <option value="institutional">Institutional</option>
                        <option value="mixed_use">Mixed Use</option>
                        <option value="renovation">Renovation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold text-zinc-900">
                        Square footage
                      </label>
                      <input
                        type="number"
                        value={squareFootage}
                        onChange={(e) => setSquareFootage(e.target.value)}
                        placeholder="e.g., 25000"
                        className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold text-zinc-900">
                        Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Austin, TX"
                        className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                      />
                    </div>
                  </>
                )}

                {/* Value engineering inputs */}
                {activeTool === "value" && (
                  <div>
                    <label className="block text-sm font-extrabold text-zinc-900">
                      Target cost reduction (%)
                    </label>
                    <input
                      type="number"
                      value={targetReduction}
                      onChange={(e) => setTargetReduction(e.target.value)}
                      min="1"
                      max="50"
                      placeholder="e.g., 10"
                      className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                    />
                    <p className="mt-1 text-xs text-zinc-600">
                      AI will suggest alternatives to reduce costs by approximately this percentage.
                    </p>
                  </div>
                )}

                {/* Compare estimates inputs */}
                {activeTool === "compare" && (
                  <div>
                    <label className="block text-sm font-extrabold text-zinc-900">
                      Select estimates to compare (2+)
                    </label>
                    <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                      {loadingEstimates ? (
                        <div className="text-sm text-zinc-600">Loading estimates...</div>
                      ) : estimates.length === 0 ? (
                        <div className="text-sm text-zinc-600">No estimates available.</div>
                      ) : (
                        estimates.map((est) => (
                          <label
                            key={est.id}
                            className="flex items-center gap-2 rounded-xl border border-black/10 bg-zinc-50 p-2.5 text-sm cursor-pointer hover:bg-zinc-100"
                          >
                            <input
                              type="checkbox"
                              checked={compareIds.includes(est.id)}
                              onChange={() => handleCompareToggle(est.id)}
                              className="h-4 w-4 rounded border-zinc-300"
                            />
                            <span className="font-black text-zinc-900">
                              {est.name || "Untitled"}
                            </span>
                            {est.totalCost != null && (
                              <span className="text-xs text-zinc-600">
                                ({formatMoney(est.totalCost)})
                              </span>
                            )}
                          </label>
                        ))
                      )}
                    </div>
                    {compareIds.length > 0 && (
                      <p className="mt-1 text-xs text-zinc-600">
                        {compareIds.length} estimate{compareIds.length !== 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>
                )}

                {/* Run button */}
                <button
                  type="button"
                  onClick={tools.find((t) => t.id === activeTool)?.run}
                  disabled={toolLoading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-black text-[var(--primary-foreground)] shadow-sm hover:opacity-95 disabled:opacity-60"
                >
                  {toolLoading
                    ? "Processing..."
                    : `Run ${tools.find((t) => t.id === activeTool)?.name}`}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {toolLoading && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-8 text-center shadow-sm">
                <div className="text-sm font-black text-sky-900 animate-pulse">
                  AI is analyzing...
                </div>
                <p className="mt-2 text-xs text-sky-700">
                  This may take a few moments depending on the complexity of the analysis.
                </p>
              </div>
            )}

            {toolResult && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <h3 className="text-lg font-black tracking-tight text-emerald-900">
                  Results
                </h3>

                <div className="mt-3 text-sm text-emerald-900">
                  {typeof toolResult === "string" ? (
                    <p className="whitespace-pre-wrap">{toolResult}</p>
                  ) : Array.isArray(toolResult) ? (
                    <div className="space-y-2">
                      {toolResult.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="rounded-xl bg-white/60 p-3"
                        >
                          {item.name && (
                            <div className="font-black">{item.name}</div>
                          )}
                          {item.description && (
                            <div className="mt-1 text-xs">{item.description}</div>
                          )}
                          {item.savingsAmount != null && (
                            <div className="mt-1 text-xs font-extrabold">
                              Potential savings: {formatMoney(item.savingsAmount)}
                            </div>
                          )}
                          {item.recommendation && (
                            <div className="mt-1 text-xs">{item.recommendation}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : toolResult.summary ? (
                    <div>
                      <p className="whitespace-pre-wrap">{toolResult.summary}</p>
                      {toolResult.details && (
                        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-white/60 p-3 text-xs">
                          {JSON.stringify(toolResult.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-white/60 p-3 text-xs">
                      {JSON.stringify(toolResult, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* Info card */}
            {!toolLoading && !toolResult && (
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-5 shadow-sm">
                <div className="text-sm font-black text-zinc-900">AI tools overview</div>
                <ul className="mt-2 space-y-2 text-sm text-zinc-700">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                    <div>
                      <span className="font-extrabold text-zinc-900">Scope Analysis</span> - Validates
                      estimate completeness and identifies missing items
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                    <div>
                      <span className="font-extrabold text-zinc-900">Cost Prediction</span> - Uses
                      historical data and AI to predict project costs
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                    <div>
                      <span className="font-extrabold text-zinc-900">Value Engineering</span> - Finds
                      cost reduction opportunities without sacrificing quality
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                    <div>
                      <span className="font-extrabold text-zinc-900">Compare Estimates</span> - Side-by-side
                      analysis of multiple estimate versions
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                    <div>
                      <span className="font-extrabold text-zinc-900">Benchmark</span> - Compare against
                      industry data and similar projects
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
