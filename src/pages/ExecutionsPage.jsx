import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function loadExecutions() {
    setError("");
    setLoading(true);

    fetch(`${API_BASE_URL}/executions`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setExecutions(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setError("Could not load executions from AgentFlow API.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadExecutions();
  }, []);

  return (
    <AppLayout title="Execution History">
      <header className="hero-card page-hero-card">
        <div>
          <p className="eyebrow">Executions</p>
          <h2>Review workflow history.</h2>
          <p>Open any execution to inspect the full agent timeline, handoffs, markdown output, and final answer.</p>
        </div>
        <button className="secondary-button" onClick={loadExecutions}>Refresh executions</button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">History</p>
          <h2>All Executions</h2>
        </div>

        <div className="execution-list">
          {loading && <p className="empty-state">Loading executions...</p>}
          {!loading && executions.length === 0 && <p className="empty-state">No executions have been recorded yet.</p>}
          {executions.map((execution) => (
            <Link key={execution.id} to={`/executions/${execution.id}`} className="execution-row execution-row-large">
              <div>
                <strong>{execution.workflowName || "Workflow execution"}</strong>
                <span>{execution.request}</span>
                <small>{formatDate(execution.startedAt)} → {formatDate(execution.completedAt)}</small>
              </div>
              <span className={`status-pill ${String(execution.status).toLowerCase()}`}>{execution.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}
