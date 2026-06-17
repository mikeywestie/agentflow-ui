import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import "../styles/executionTimeline.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export default function ExecutionDetailsPage() {
  const { id } = useParams();
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/executions/${id}`)
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load execution details.");
        }

        setExecution(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Could not load execution details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const agentRuns = execution?.agentRuns || [];
  const completedCount = useMemo(
    () => agentRuns.filter((run) => run.status === "COMPLETED").length,
    [agentRuns]
  );
  const totalDuration = formatDuration(execution?.startedAt, execution?.completedAt);
  const outputMetrics = useMemo(() => calculateOutputMetrics(agentRuns, execution?.finalOutput), [agentRuns, execution?.finalOutput]);
  const successRate = agentRuns.length ? Math.round((completedCount / agentRuns.length) * 100) : 0;

  if (loading) {
    return <PageState title="Loading execution" message="Fetching the recorded agent trace..." />;
  }

  if (error) {
    return <PageState title="Execution Details" message={error} isError />;
  }

  if (!execution) {
    return <PageState title="Execution Details" message="No execution found." />;
  }

  return (
    <main className="detail-page">
      <Link to="/" className="back-link">Back to Dashboard</Link>

      <header className="detail-hero execution-hero">
        <div>
          <p className="eyebrow">Execution Trace</p>
          <h1>{execution.workflowName || "Workflow Execution"}</h1>
          <p>Follow the full path from original request to final answer, with each agent output captured in order.</p>
        </div>
        <div className="hero-status-stack">
          <span className={`status-pill ${String(execution.status).toLowerCase()}`}>{execution.status}</span>
          <strong>{completedCount}/{agentRuns.length || 0} agents completed</strong>
        </div>
      </header>

      <section className="workflow-progress-panel">
        <div className="section-heading">
          <p className="eyebrow">Workflow Progress</p>
          <h2>Request to final answer</h2>
        </div>
        <div className="progress-track">
          <ProgressNode label="Request" icon="📝" status="completed" />
          {agentRuns.map((run) => (
            <ProgressNode key={run.id} label={agentLabel(run.agentType)} icon={agentIcon(run.agentType)} status={String(run.status).toLowerCase()} />
          ))}
          <ProgressNode label="Final Answer" icon="🏁" status={String(execution.status).toLowerCase()} />
        </div>
      </section>

      <section className="workflow-path-panel">
        <div className="section-heading">
          <p className="eyebrow">Workflow Path</p>
          <h2>Agent journey</h2>
        </div>
        {agentRuns.length ? (
          <div className="workflow-path">
            {agentRuns.map((run, index) => (
              <React.Fragment key={run.id}>
                <div className="path-node premium-path-node">
                  <span className={`agent-icon ${String(run.agentType).toLowerCase()}`}>{agentIcon(run.agentType)}</span>
                  <strong>{run.agentName}</strong>
                  <small>{run.agentType}</small>
                </div>
                {index < agentRuns.length - 1 && <span className="path-arrow">→</span>}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <p className="empty-state">No workflow path could be built from this execution.</p>
        )}
      </section>

      <section className="execution-metrics-grid">
        <MetricCard label="Execution time" value={totalDuration} helper="Full workflow duration" />
        <MetricCard label="Success rate" value={`${successRate}%`} helper={`${completedCount}/${agentRuns.length || 0} completed`} />
        <MetricCard label="Estimated tokens" value={formatNumber(outputMetrics.estimatedTokens)} helper="Approximate output volume" />
        <MetricCard label="Estimated cost" value={outputMetrics.estimatedCost} helper="Local estimate only" />
      </section>

      <section className="detail-grid">
        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Request</p>
            <h2>Original Input</h2>
          </div>
          <pre className="light-pre">{execution.request}</pre>
        </article>

        <article className="panel metadata-panel enhanced-metadata-panel">
          <div>
            <span>Started</span>
            <strong>{formatDate(execution.startedAt)}</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{formatDate(execution.completedAt)}</strong>
          </div>
          <div>
            <span>Total duration</span>
            <strong>{totalDuration}</strong>
          </div>
          <div>
            <span>Agents</span>
            <strong>{agentRuns.length}</strong>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading timeline-heading-row">
          <div>
            <p className="eyebrow">Agent Chain</p>
            <h2>Trace Timeline</h2>
          </div>
          <span className="timeline-summary-chip">{agentRuns.length} recorded steps</span>
        </div>

        <div className="timeline enhanced-timeline">
          {agentRuns.length ? (
            agentRuns.map((run, index) => (
              <React.Fragment key={run.id}>
                <AgentTimelineItem run={run} index={index} isLast={index === agentRuns.length - 1} />
                {index < agentRuns.length - 1 && <AgentHandoff fromRun={run} toRun={agentRuns[index + 1]} />}
              </React.Fragment>
            ))
          ) : (
            <p className="empty-state">No agent runs were recorded for this execution.</p>
          )}
        </div>
      </section>

      <section className="panel final-output-panel final-result-card premium-final-result-card">
        <div className="final-result-header">
          <div>
            <p className="eyebrow">Final Answer</p>
            <h2>Review Complete</h2>
            <p>The final response returned by the workflow after all agent handoffs.</p>
          </div>
          <div className="final-score-card">
            <span>Workflow Score</span>
            <strong>{successRate}/100</strong>
          </div>
        </div>

        <div className="final-summary-grid">
          <div>
            <span>Agents executed</span>
            <strong>{agentRuns.length}</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
          <div>
            <span>Duration</span>
            <strong>{totalDuration}</strong>
          </div>
          <div>
            <span>Output size</span>
            <strong>{formatNumber(outputMetrics.wordCount)} words</strong>
          </div>
        </div>

        <details className="full-output-details" open>
          <summary>View final answer</summary>
          <MarkdownOutput value={execution.finalOutput} />
        </details>
      </section>
    </main>
  );
}

function AgentTimelineItem({ run, index, isLast }) {
  const summary = summarizeAgentOutput(run);

  return (
    <article className="timeline-item enhanced-timeline-item premium-timeline-item">
      <div className="timeline-rail">
        <div className={`timeline-index ${String(run.status).toLowerCase()}`}>{agentIcon(run.agentType)}</div>
        {!isLast && <div className="timeline-line" />}
      </div>

      <div className="timeline-card enhanced-timeline-card premium-timeline-card">
        <div className="timeline-header">
          <div>
            <div className="agent-title-row">
              <span className="step-label">Step {index + 1}</span>
              <span className="badge">{run.agentType}</span>
            </div>
            <h3>{run.agentName}</h3>
          </div>
          <div className="timeline-status-stack">
            <span className={`status-pill ${String(run.status).toLowerCase()}`}>{run.status}</span>
            <small>{formatDuration(run.startedAt, run.completedAt)}</small>
          </div>
        </div>

        <div className="agent-summary-card">
          <div>
            <span>Objective</span>
            <p>{summary.objective}</p>
          </div>
          <div>
            <span>Result</span>
            <p>{summary.result}</p>
          </div>
        </div>

        <div className="agent-output-highlights">
          {summary.highlights.map((highlight) => (
            <span key={highlight}>✓ {highlight}</span>
          ))}
        </div>

        <div className="trace-meta">
          <span>Started: {formatDate(run.startedAt)}</span>
          <span>Completed: {formatDate(run.completedAt)}</span>
          <span>Output: {formatNumber(countWords(run.output))} words</span>
        </div>

        <details className="trace-details">
          <summary>View agent input</summary>
          <pre className="light-pre">{run.input}</pre>
        </details>

        <details className="trace-details full-output-details">
          <summary>Expand full markdown output</summary>
          <MarkdownOutput value={run.output} />
        </details>
      </div>
    </article>
  );
}

function AgentHandoff({ fromRun, toRun }) {
  const handoffItems = inferHandoffItems(fromRun.output);

  return (
    <div className="handoff-card">
      <div className="handoff-line" />
      <div className="handoff-content">
        <span>{fromRun.agentName} → {toRun.agentName}</span>
        <strong>Output transferred</strong>
        <div className="handoff-items">
          {handoffItems.map((item) => (
            <small key={item}>✓ {item}</small>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

function ProgressNode({ label, icon, status }) {
  return (
    <div className={`progress-node ${status}`}>
      <span>{icon}</span>
      <strong>{label}</strong>
    </div>
  );
}

function MarkdownOutput({ value }) {
  if (!value) {
    return <p className="empty-state">No output returned.</p>;
  }

  return (
    <div className="markdown-output">
      <ReactMarkdown>{value}</ReactMarkdown>
    </div>
  );
}

function PageState({ title, message, isError = false }) {
  return (
    <main className="detail-page">
      <Link to="/" className="back-link">Back to Dashboard</Link>
      <section className="panel">
        <p className="eyebrow">AgentFlow</p>
        <h1>{title}</h1>
        <p className={isError ? "alert alert-error" : "empty-state"}>{message}</p>
      </section>
    </main>
  );
}

function summarizeAgentOutput(run) {
  const wordCount = countWords(run.output);
  const sections = countMarkdownSections(run.output);
  const listItems = countListItems(run.output);
  const type = run.agentType;

  if (type === "PLANNER") {
    return {
      objective: "Break the user request into a clear project plan.",
      result: `Generated a planning document with ${sections} sections and ${listItems} structured points.`,
      highlights: compactHighlights(["Requirements", "Risks", "Execution phases", `${formatNumber(wordCount)} words`]),
    };
  }

  if (type === "BUILDER") {
    return {
      objective: "Transform the plan into a technical implementation design.",
      result: `Produced architecture, entities, endpoints, services, and implementation notes across ${sections} sections.`,
      highlights: compactHighlights(["Entities", "Endpoints", "Services", "Screens", `${formatNumber(wordCount)} words`]),
    };
  }

  if (type === "REVIEWER") {
    return {
      objective: "Review the proposed solution for risks, gaps, and improvements.",
      result: `Completed a technical review with ${sections} sections and ${listItems} review points.`,
      highlights: compactHighlights(["Security review", "Data model feedback", "API concerns", "Final recommendations"]),
    };
  }

  return {
    objective: "Process the previous workflow output.",
    result: `Returned ${formatNumber(wordCount)} words of agent output.`,
    highlights: compactHighlights(["Processed input", "Generated output", `${formatNumber(wordCount)} words`]),
  };
}

function compactHighlights(items) {
  return items.slice(0, 5);
}

function inferHandoffItems(output = "") {
  const lower = output.toLowerCase();
  const candidates = [
    ["Requirements", lower.includes("requirement")],
    ["Risks", lower.includes("risk")],
    ["Entities", lower.includes("entity") || lower.includes("entities")],
    ["Endpoints", lower.includes("endpoint") || lower.includes("api")],
    ["Services", lower.includes("service")],
    ["Security notes", lower.includes("security") || lower.includes("jwt")],
    ["Implementation notes", lower.includes("implementation")],
    ["Recommendations", lower.includes("recommend")],
  ];

  const matched = candidates.filter(([, isMatch]) => isMatch).map(([label]) => label);
  return matched.length ? matched.slice(0, 4) : ["Context", "Output", "Next agent input"];
}

function calculateOutputMetrics(agentRuns, finalOutput = "") {
  const combinedOutput = [finalOutput, ...agentRuns.map((run) => run.output || "")].join(" ");
  const wordCount = countWords(combinedOutput);
  const estimatedTokens = Math.max(1, Math.round(wordCount * 1.35));
  const estimatedCostValue = estimatedTokens * 0.000002;

  return {
    wordCount,
    estimatedTokens,
    estimatedCost: estimatedCostValue < 0.01 ? "< $0.01" : `$${estimatedCostValue.toFixed(2)}`,
  };
}

function countWords(value = "") {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function countMarkdownSections(value = "") {
  const headingMatches = value.match(/^#{1,6}\s+/gm);
  const numberedMatches = value.match(/^\d+(\.\d+)*\.\s+/gm);
  return Math.max(headingMatches?.length || 0, numberedMatches?.length || 0, 1);
}

function countListItems(value = "") {
  const listMatches = value.match(/^\s*[-*•]\s+/gm);
  const numberedMatches = value.match(/^\s*\d+(\.\d+)*\.\s+/gm);
  return (listMatches?.length || 0) + (numberedMatches?.length || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function formatDuration(start, end) {
  if (!start || !end) {
    return "-";
  }

  const durationMs = new Date(end).getTime() - new Date(start).getTime();

  if (Number.isNaN(durationMs) || durationMs < 0) {
    return "-";
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  const seconds = Math.round(durationMs / 100) / 10;
  return `${seconds}s`;
}

function agentLabel(type) {
  switch (type) {
    case "PLANNER":
      return "Planner";
    case "BUILDER":
      return "Builder";
    case "REVIEWER":
      return "Reviewer";
    default:
      return "Agent";
  }
}

function agentIcon(type) {
  switch (type) {
    case "PLANNER":
      return "🧠";
    case "BUILDER":
      return "⚙️";
    case "REVIEWER":
      return "🔍";
    default:
      return "🤖";
  }
}
