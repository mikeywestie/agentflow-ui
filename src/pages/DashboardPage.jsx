import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [request, setRequest] = useState("Build a quotation management system for electrical contractors");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function loadData() {
    setError("");

    Promise.all([
      fetch(`${API_BASE_URL}/workflows`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE_URL}/agents`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE_URL}/executions`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([workflowData, agentData, executionData]) => {
        const workflowList = Array.isArray(workflowData) ? workflowData : [];
        setWorkflows(workflowList);
        setAgents(Array.isArray(agentData) ? agentData : []);
        setExecutions(Array.isArray(executionData) ? executionData : []);

        if (!selectedWorkflowId && workflowList.length > 0) {
          setSelectedWorkflowId(workflowList[0].id);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Could not connect to AgentFlow API. Make sure the backend is running.");
      });
  }

  useEffect(() => {
    loadData();
  }, []);

  async function runWorkflow() {
    setError("");
    setSuccess("");

    if (!selectedWorkflowId) {
      setError("Please select a workflow.");
      return;
    }

    if (!request.trim()) {
      setError("Please enter a request.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/executions/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowId: selectedWorkflowId,
          request,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Execution failed.");
      }

      setExecutions((previous) => [data, ...previous]);
      setSuccess("Workflow execution completed and was added to Recent Executions.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Execution failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <header className="hero-card">
        <div>
          <p className="eyebrow">Local MVP v0.4.0</p>
          <h2>Build, run, and inspect AI agent workflows.</h2>
          <p>
            AgentFlow is now split into focused pages so the dashboard can stay clean while agents,
            workflows, and executions each have their own workspace.
          </p>
        </div>
        <button className="secondary-button" onClick={loadData}>Refresh data</button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="stats-grid">
        <StatCard title="Workflows" value={workflows.length} description="Saved orchestration flows" />
        <StatCard title="Agents" value={agents.length} description="Reusable specialist roles" />
        <StatCard title="Executions" value={executions.length} description="Recorded workflow runs" />
      </section>

      <section className="panel run-panel">
        <div className="section-heading">
          <p className="eyebrow">Quick Execute</p>
          <h2>Run Workflow</h2>
          <p>Use this quick launcher for testing. Manage workflows and agents from their dedicated pages.</p>
        </div>

        <label>Workflow</label>
        <select value={selectedWorkflowId} onChange={(e) => setSelectedWorkflowId(e.target.value)}>
          {workflows.length === 0 && <option value="">No workflows available</option>}
          {workflows.map((workflow) => (
            <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
          ))}
        </select>

        <label>Request</label>
        <textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={5} />

        <button className="primary-button" onClick={runWorkflow} disabled={loading}>
          {loading ? "Running agents..." : "Run Workflow"}
        </button>
      </section>

      <section className="two-column-grid">
        <div className="panel quick-link-panel">
          <div className="section-heading">
            <p className="eyebrow">Workspace</p>
            <h2>Manage your system</h2>
          </div>
          <div className="quick-link-grid">
            <Link to="/agents" className="quick-link-card">
              <strong>Agents</strong>
              <span>Create and review specialist AI roles.</span>
            </Link>
            <Link to="/workflows" className="quick-link-card">
              <strong>Workflows</strong>
              <span>Build ordered agent chains.</span>
            </Link>
            <Link to="/executions" className="quick-link-card">
              <strong>Executions</strong>
              <span>Browse workflow history.</span>
            </Link>
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">Recent</p>
            <h2>Latest Executions</h2>
          </div>
          <div className="execution-list compact-execution-list">
            {executions.length === 0 && <p className="empty-state">No executions have been recorded yet.</p>}
            {executions.slice(0, 5).map((execution) => (
              <Link key={execution.id} to={`/executions/${execution.id}`} className="execution-row">
                <div>
                  <strong>{execution.workflowName || "Workflow execution"}</strong>
                  <span>{execution.request}</span>
                </div>
                <span className={`status-pill ${String(execution.status).toLowerCase()}`}>{execution.status}</span>
              </Link>
            ))}
          </div>
          <Link className="text-link" to="/executions">View all executions</Link>
        </div>
      </section>
    </AppLayout>
  );
}
