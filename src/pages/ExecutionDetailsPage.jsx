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

      <section className="workflow-path-panel">
        <div className="section-heading">
          <p className="eyebrow">Workflow Path</p>
          <h2>Agent journey</h2>
        </div>
        {agentRuns.length ? (
          <div className="workflow-path">
            {agentRuns.map((run, index) => (
              <React.Fragment key={run.id}>
                <div className="path-node">
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
              <article key={run.id} className="timeline-item enhanced-timeline-item">
                <div className="timeline-rail">
                  <div className={`timeline-index ${String(run.status).toLowerCase()}`}>{agentIcon(run.agentType)}</div>
                  {index < agentRuns.length - 1 && <div className="timeline-line" />}
                </div>

                <div className="timeline-card enhanced-timeline-card">
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

                  <div className="trace-meta">
                    <span>Started: {formatDate(run.startedAt)}</span>
                    <span>Completed: {formatDate(run.completedAt)}</span>
                  </div>

                  <details className="trace-details">
                    <summary>View agent input</summary>
                    <pre className="light-pre">{run.input}</pre>
                  </details>

                  <details className="trace-details" open>
                    <summary>View agent output</summary>
                    <MarkdownOutput value={run.output} />
                  </details>
                </div>
              </article>
            ))
          ) : (
            <p className="empty-state">No agent runs were recorded for this execution.</p>
          )}
        </div>
      </section>

      <section className="panel final-output-panel final-result-card">
        <div className="section-heading">
          <p className="eyebrow">Result</p>
          <h2>Final Output</h2>
        </div>
        <MarkdownOutput value={execution.finalOutput} />
      </section>
    </main>
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
