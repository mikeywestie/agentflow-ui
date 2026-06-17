import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";

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

      <header className="detail-hero">
        <div>
          <p className="eyebrow">Execution Trace</p>
          <h1>{execution.workflowName || "Workflow Execution"}</h1>
          <p>Planner, Builder, and Reviewer output captured as a traceable agent run.</p>
        </div>
        <span className={`status-pill ${String(execution.status).toLowerCase()}`}>{execution.status}</span>
      </header>

      <section className="detail-grid">
        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Request</p>
            <h2>Original Input</h2>
          </div>
          <pre className="light-pre">{execution.request}</pre>
        </article>

        <article className="panel metadata-panel">
          <div>
            <span>Started</span>
            <strong>{formatDate(execution.startedAt)}</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{formatDate(execution.completedAt)}</strong>
          </div>
          <div>
            <span>Agents</span>
            <strong>{execution.agentRuns?.length || 0}</strong>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Agent Chain</p>
          <h2>Trace Timeline</h2>
        </div>

        <div className="timeline">
          {execution.agentRuns?.length ? (
            execution.agentRuns.map((run, index) => (
              <article key={run.id} className="timeline-item">
                <div className="timeline-index">{index + 1}</div>
                <div className="timeline-card">
                  <div className="timeline-header">
                    <div>
                      <span className="badge">{run.agentType}</span>
                      <h3>{run.agentName}</h3>
                    </div>
                    <span className={`status-pill ${String(run.status).toLowerCase()}`}>{run.status}</span>
                  </div>

                  <div className="trace-meta">
                    <span>Started: {formatDate(run.startedAt)}</span>
                    <span>Completed: {formatDate(run.completedAt)}</span>
                  </div>

                  <details>
                    <summary>Input</summary>
                    <pre className="light-pre">{run.input}</pre>
                  </details>

                  <details open>
                    <summary>Output</summary>
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

      <section className="panel final-output-panel">
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
