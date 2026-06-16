import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080/api";

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
    return (
      <div style={pageStyle}>
        <Link to="/" style={backLinkStyle}>← Back to Dashboard</Link>
        <h1>Execution Details</h1>
        <p>Loading execution...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <Link to="/" style={backLinkStyle}>← Back to Dashboard</Link>
        <h1>Execution Details</h1>
        <p style={errorStyle}>{error}</p>
      </div>
    );
  }

  if (!execution) {
    return (
      <div style={pageStyle}>
        <Link to="/" style={backLinkStyle}>← Back to Dashboard</Link>
        <h1>Execution Details</h1>
        <p>No execution found.</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <Link to="/" style={backLinkStyle}>← Back to Dashboard</Link>

      <h1>Execution Details</h1>
      <p>Planner → Builder → Reviewer trace</p>

      <div style={summaryPanelStyle}>
        <p><strong>Workflow:</strong> {execution.workflowName}</p>
        <p><strong>Status:</strong> {execution.status}</p>
        <p><strong>Started:</strong> {formatDate(execution.startedAt)}</p>
        <p><strong>Completed:</strong> {formatDate(execution.completedAt)}</p>
        <p><strong>Request:</strong></p>
        <pre style={requestStyle}>{execution.request}</pre>
      </div>

      <section style={sectionStyle}>
        <h2>Agent Trace</h2>

        {execution.agentRuns?.length ? (
          execution.agentRuns.map((run, index) => (
            <article key={run.id} style={agentPanelStyle}>
              <div style={agentHeaderStyle}>
                <h3>{index + 1}. {run.agentName}</h3>
                <span style={badgeStyle}>{run.agentType}</span>
              </div>

              <p><strong>Status:</strong> {run.status}</p>
              <p><strong>Started:</strong> {formatDate(run.startedAt)}</p>
              <p><strong>Completed:</strong> {formatDate(run.completedAt)}</p>

              <details style={detailsStyle}>
                <summary>Input</summary>
                <pre style={preStyle}>{run.input}</pre>
              </details>

              <details open style={detailsStyle}>
                <summary>Output</summary>
                <pre style={preStyle}>{run.output}</pre>
              </details>
            </article>
          ))
        ) : (
          <p>No agent runs were recorded for this execution.</p>
        )}
      </section>

      <section style={sectionStyle}>
        <h2>Final Output</h2>
        <pre style={preStyle}>{execution.finalOutput}</pre>
      </section>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

const pageStyle = {
  fontFamily: "Arial",
  padding: 24,
  maxWidth: 1200,
  margin: "0 auto",
};

const sectionStyle = {
  marginTop: 32,
};

const summaryPanelStyle = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 20,
  background: "#fff",
  marginTop: 20,
};

const agentPanelStyle = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
  background: "#fff",
};

const agentHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const badgeStyle = {
  background: "#111827",
  color: "white",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
};

const detailsStyle = {
  marginTop: 12,
};

const requestStyle = {
  whiteSpace: "pre-wrap",
  background: "#f7f7f7",
  padding: 16,
  borderRadius: 8,
};

const preStyle = {
  whiteSpace: "pre-wrap",
  background: "#111827",
  color: "#f9fafb",
  padding: 16,
  borderRadius: 8,
  overflowX: "auto",
};

const backLinkStyle = {
  display: "inline-block",
  marginBottom: 16,
  color: "#111827",
  textDecoration: "none",
  fontWeight: "bold",
};

const errorStyle = {
  color: "#b91c1c",
  background: "#fee2e2",
  padding: 12,
  borderRadius: 8,
};
