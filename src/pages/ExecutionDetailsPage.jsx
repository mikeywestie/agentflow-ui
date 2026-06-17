import React, { useEffect, useState } from "react";
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
      .catch((err) => setError(err.message || "Could not load execution details."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageState title="Loading execution" message="Fetching the recorded agent trace..." />;
  if (error) return <PageState title="Execution Details" message={error} isError />;
  if (!execution) return <PageState title="Execution Details" message="No execution found." />;

  const agentRuns = execution.agentRuns || [];
  const completedCount = agentRuns.filter((run) => run.status === "COMPLETED").length;
  const totalDuration = formatDuration(execution.startedAt, execution.completedAt);
  const finalWordCount = countWords(execution.finalOutput);
  const totalWordCount = countWords([execution.finalOutput, ...agentRuns.map((run) => run.output || "")].join(" "));

  return (
    <main className="detail-page">
      <Link to="/" className="back-link">Back to Dashboard</Link>

      <header className="detail-hero execution-hero">
        <div>
          <p className="eyebrow">Execution Trace</p>
          <h1>{execution.workflowName || "Workflow Execution"}</h1>
          <p>This view uses recorded API fields and simple counts from stored text output.</p>
        </div>
        <div className="hero-status-stack">
          <span className={`status-pill ${String(execution.status).toLowerCase()}`}>{execution.status}</span>
          <strong>{completedCount}/{agentRuns.length || 0} agents completed</strong>
        </div>
      </header>

      <section className="workflow-progress-panel">
        <div className="section-heading">
          <p className="eyebrow">Workflow Progress</p>
          <h2>Recorded path</h2>
        </div>
        <div className="progress-track">
          <ProgressNode label="Request" icon="📝" status="completed" />
          {agentRuns.map((run) => <ProgressNode key={run.id} label={agentLabel(run.agentType)} icon={agentIcon(run.agentType)} status={String(run.status).toLowerCase()} />)}
          <ProgressNode label="Final Answer" icon="🏁" status={String(execution.status).toLowerCase()} />
        </div>
      </section>

      <section className="execution-metrics-grid truth-metrics-grid">
        <MetricCard label="Execution time" value={totalDuration} helper="From started and completed timestamps" />
        <MetricCard label="Agents recorded" value={agentRuns.length} helper={`${completedCount} completed`} />
        <MetricCard label="Total output words" value={formatNumber(totalWordCount)} helper="Counted from stored text" />
        <MetricCard label="Final output words" value={formatNumber(finalWordCount)} helper="Counted from final answer" />
      </section>

      <section className="panel source-data-note">
        <strong>Source-backed display</strong>
        <p>Usage, cost, model, provider, and scoring values are not shown until they exist in the backend response.</p>
      </section>

      <section className="detail-grid">
        <article className="panel">
          <div className="section-heading"><p className="eyebrow">Request</p><h2>Original Input</h2></div>
          <pre className="light-pre">{execution.request}</pre>
        </article>

        <article className="panel metadata-panel enhanced-metadata-panel">
          <div><span>Started</span><strong>{formatDate(execution.startedAt)}</strong></div>
          <div><span>Completed</span><strong>{formatDate(execution.completedAt)}</strong></div>
          <div><span>Total duration</span><strong>{totalDuration}</strong></div>
          <div><span>Agents</span><strong>{agentRuns.length}</strong></div>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading timeline-heading-row">
          <div><p className="eyebrow">Agent Chain</p><h2>Trace Timeline</h2></div>
          <span className="timeline-summary-chip">{agentRuns.length} recorded steps</span>
        </div>

        <div className="timeline enhanced-timeline">
          {agentRuns.length === 0 && <p className="empty-state">No agent runs were recorded for this execution.</p>}
          {agentRuns.map((run, index) => (
            <React.Fragment key={run.id}>
              <AgentRunCard run={run} index={index} isLast={index === agentRuns.length - 1} />
              {index < agentRuns.length - 1 && <RecordedStepLink fromRun={run} toRun={agentRuns[index + 1]} />}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="panel final-output-panel final-result-card premium-final-result-card">
        <div className="final-result-header">
          <div><p className="eyebrow">Final Answer</p><h2>{execution.status === "COMPLETED" ? "Execution Complete" : "Execution Result"}</h2><p>The final response returned by the workflow.</p></div>
          <div className="final-score-card truth-card"><span>Status</span><strong>{execution.status}</strong></div>
        </div>
        <div className="final-summary-grid">
          <div><span>Agents executed</span><strong>{agentRuns.length}</strong></div>
          <div><span>Completed</span><strong>{completedCount}</strong></div>
          <div><span>Duration</span><strong>{totalDuration}</strong></div>
          <div><span>Final output</span><strong>{formatNumber(finalWordCount)} words</strong></div>
        </div>
        <details className="full-output-details" open><summary>View final answer</summary><MarkdownOutput value={execution.finalOutput} /></details>
      </section>
    </main>
  );
}

function AgentRunCard({ run, index, isLast }) {
  const wordCount = countWords(run.output);
  return (
    <article className="timeline-item enhanced-timeline-item premium-timeline-item">
      <div className="timeline-rail"><div className={`timeline-index ${String(run.status).toLowerCase()}`}>{agentIcon(run.agentType)}</div>{!isLast && <div className="timeline-line" />}</div>
      <div className="timeline-card enhanced-timeline-card premium-timeline-card">
        <div className="timeline-header">
          <div><div className="agent-title-row"><span className="step-label">Step {index + 1}</span><span className="badge">{run.agentType}</span></div><h3>{run.agentName}</h3></div>
          <div className="timeline-status-stack"><span className={`status-pill ${String(run.status).toLowerCase()}`}>{run.status}</span><small>{formatDuration(run.startedAt, run.completedAt)}</small></div>
        </div>
        <div className="agent-summary-card">
          <div><span>Recorded role</span><p>{run.agentType || "Agent"} run stored as {run.agentName || "Unnamed agent"}.</p></div>
          <div><span>Stored output</span><p>{formatNumber(wordCount)} words recorded.</p></div>
        </div>
        <div className="trace-meta"><span>Started: {formatDate(run.startedAt)}</span><span>Completed: {formatDate(run.completedAt)}</span><span>Output: {formatNumber(wordCount)} words</span></div>
        <details className="trace-details"><summary>View agent input</summary><pre className="light-pre">{run.input || "No input was stored for this agent run."}</pre></details>
        <details className="trace-details full-output-details"><summary>Expand full markdown output</summary><MarkdownOutput value={run.output} /></details>
      </div>
    </article>
  );
}

function RecordedStepLink({ fromRun, toRun }) {
  return <div className="handoff-card truth-handoff-card"><div className="handoff-line" /><div className="handoff-content"><span>{fromRun.agentName} to {toRun.agentName}</span><strong>Next recorded step</strong><div className="handoff-items"><small>Previous output: {formatNumber(countWords(fromRun.output))} words</small><small>Next input: {formatNumber(countWords(toRun.input))} words</small><small>Next status: {toRun.status}</small></div></div></div>;
}

function MetricCard({ label, value, helper }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong><p>{helper}</p></article>;
}

function ProgressNode({ label, icon, status }) {
  return <div className={`progress-node ${status}`}><span>{icon}</span><strong>{label}</strong></div>;
}

function MarkdownOutput({ value }) {
  if (!value) return <p className="empty-state">No output returned.</p>;
  return <div className="markdown-output"><ReactMarkdown>{value}</ReactMarkdown></div>;
}

function PageState({ title, message, isError = false }) {
  return <main className="detail-page"><Link to="/" className="back-link">Back to Dashboard</Link><section className="panel"><p className="eyebrow">AgentFlow</p><h1>{title}</h1><p className={isError ? "alert alert-error" : "empty-state"}>{message}</p></section></main>;
}

function countWords(value = "") {
  const text = String(value || "").trim();
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatDuration(start, end) {
  if (!start || !end) return "-";
  const durationMs = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(durationMs) || durationMs < 0) return "-";
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${Math.round(durationMs / 100) / 10}s`;
}

function agentLabel(type) {
  if (type === "PLANNER") return "Planner";
  if (type === "BUILDER") return "Builder";
  if (type === "REVIEWER") return "Reviewer";
  return "Agent";
}

function agentIcon(type) {
  if (type === "PLANNER") return "🧠";
  if (type === "BUILDER") return "⚙️";
  if (type === "REVIEWER") return "🔍";
  return "🤖";
}
