import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const AGENT_TYPES = ["PLANNER", "BUILDER", "REVIEWER"];

const EMPTY_AGENT_FORM = {
  name: "",
  description: "",
  type: "PLANNER",
  systemPrompt: "",
  enabled: true,
};

const EMPTY_WORKFLOW_FORM = {
  name: "",
  description: "",
  enabled: true,
  agentIds: [],
};

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [request, setRequest] = useState("Build a quotation management system for electrical contractors");
  const [agentForm, setAgentForm] = useState(EMPTY_AGENT_FORM);
  const [workflowForm, setWorkflowForm] = useState(EMPTY_WORKFLOW_FORM);
  const [loading, setLoading] = useState(false);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const enabledAgents = useMemo(
    () => agents.filter((agent) => agent.enabled !== false),
    [agents]
  );

  function loadData() {
    setError("");

    Promise.all([
      fetch(`${API_BASE_URL}/workflows`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE_URL}/agents`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE_URL}/executions`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([workflowData, agentData, executionData]) => {
        const workflowList = Array.isArray(workflowData) ? workflowData : [];
        const agentList = Array.isArray(agentData) ? agentData : [];

        setWorkflows(workflowList);
        setAgents(agentList);
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

  async function createAgent() {
    setError("");
    setSuccess("");

    if (!agentForm.name.trim()) {
      setError("Agent name is required.");
      return;
    }

    if (!agentForm.systemPrompt.trim()) {
      setError("Agent system prompt is required.");
      return;
    }

    setCreatingAgent(true);

    try {
      const response = await fetch(`${API_BASE_URL}/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not create agent.");
      }

      setAgents((previous) => [...previous, data]);
      setAgentForm(EMPTY_AGENT_FORM);
      setSuccess(`Agent created: ${data.name}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not create agent.");
    } finally {
      setCreatingAgent(false);
    }
  }

  async function createWorkflow() {
    setError("");
    setSuccess("");

    if (!workflowForm.name.trim()) {
      setError("Workflow name is required.");
      return;
    }

    if (workflowForm.agentIds.length === 0) {
      setError("Select at least one agent for the workflow.");
      return;
    }

    setCreatingWorkflow(true);

    try {
      const response = await fetch(`${API_BASE_URL}/workflows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workflowForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not create workflow.");
      }

      setWorkflows((previous) => [...previous, data]);
      setSelectedWorkflowId(data.id);
      setWorkflowForm(EMPTY_WORKFLOW_FORM);
      setSuccess(`Workflow created: ${data.name}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not create workflow.");
    } finally {
      setCreatingWorkflow(false);
    }
  }

  function toggleWorkflowAgent(agentId) {
    setWorkflowForm((previous) => {
      const alreadySelected = previous.agentIds.includes(agentId);

      return {
        ...previous,
        agentIds: alreadySelected
          ? previous.agentIds.filter((id) => id !== agentId)
          : [...previous.agentIds, agentId],
      };
    });
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">AF</div>
        <div>
          <p className="eyebrow">AgentFlow</p>
          <h1>Orchestration Dashboard</h1>
        </div>
        <nav className="nav-list">
          <a href="#run">Run Workflow</a>
          <a href="#agents">Agents</a>
          <a href="#workflows">Workflows</a>
          <a href="#executions">Executions</a>
        </nav>
      </aside>

      <section className="content-area">
        <header className="hero-card">
          <div>
            <p className="eyebrow">Local MVP v0.4.0</p>
            <h2>Build, run, and inspect AI agent workflows.</h2>
            <p>
              Planner, Builder, and Reviewer agents can be chained into workflows, executed locally,
              and reviewed through a traceable execution history.
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

        <section id="run" className="panel run-panel">
          <div className="section-heading">
            <p className="eyebrow">Execute</p>
            <h2>Run Workflow</h2>
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
          <div className="panel">
            <div className="section-heading">
              <p className="eyebrow">Configure</p>
              <h2>Create Agent</h2>
              <p>Define a reusable specialist with a role and system prompt.</p>
            </div>

            <label>Name</label>
            <input value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} placeholder="Security Reviewer Agent" />

            <label>Type</label>
            <select value={agentForm.type} onChange={(e) => setAgentForm({ ...agentForm, type: e.target.value })}>
              {AGENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>

            <label>Description</label>
            <input value={agentForm.description} onChange={(e) => setAgentForm({ ...agentForm, description: e.target.value })} placeholder="Short purpose for this agent" />

            <label>System Prompt</label>
            <textarea value={agentForm.systemPrompt} onChange={(e) => setAgentForm({ ...agentForm, systemPrompt: e.target.value })} rows={6} placeholder="You are a senior Spring Boot security reviewer..." />

            <label className="checkbox-row">
              <input type="checkbox" checked={agentForm.enabled} onChange={(e) => setAgentForm({ ...agentForm, enabled: e.target.checked })} />
              Enabled
            </label>

            <button className="primary-button" onClick={createAgent} disabled={creatingAgent}>
              {creatingAgent ? "Creating agent..." : "Create Agent"}
            </button>
          </div>

          <div className="panel">
            <div className="section-heading">
              <p className="eyebrow">Design</p>
              <h2>Create Workflow</h2>
              <p>Choose enabled agents in the order they should run.</p>
            </div>

            <label>Name</label>
            <input value={workflowForm.name} onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })} placeholder="Secure Architecture Workflow" />

            <label>Description</label>
            <input value={workflowForm.description} onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })} placeholder="What this workflow is used for" />

            <label className="checkbox-row">
              <input type="checkbox" checked={workflowForm.enabled} onChange={(e) => setWorkflowForm({ ...workflowForm, enabled: e.target.checked })} />
              Enabled
            </label>

            <h3 className="mini-heading">Workflow Steps</h3>
            {enabledAgents.length === 0 && <p className="empty-state">No enabled agents available yet.</p>}

            <div className="choice-list">
              {enabledAgents.map((agent) => {
                const selectedIndex = workflowForm.agentIds.indexOf(agent.id);

                return (
                  <label key={agent.id} className="choice-card">
                    <input type="checkbox" checked={selectedIndex >= 0} onChange={() => toggleWorkflowAgent(agent.id)} />
                    <span>
                      {selectedIndex >= 0 ? `Step ${selectedIndex + 1}: ` : ""}
                      <strong>{agent.name}</strong> <small>{agent.type}</small>
                    </span>
                  </label>
                );
              })}
            </div>

            {workflowForm.agentIds.length > 0 && (
              <div className="preview-box">
                {workflowForm.agentIds.map((id) => agents.find((agent) => agent.id === id)?.name || "Unknown Agent").join(" -> ")}
              </div>
            )}

            <button className="primary-button" onClick={createWorkflow} disabled={creatingWorkflow}>
              {creatingWorkflow ? "Creating workflow..." : "Create Workflow"}
            </button>
          </div>
        </section>

        <section id="agents" className="panel">
          <div className="section-heading">
            <p className="eyebrow">Library</p>
            <h2>Agents</h2>
          </div>
          <div className="card-grid">
            {agents.length === 0 && <p className="empty-state">No agents found yet.</p>}
            {agents.map((agent) => (
              <article key={agent.id} className="info-card">
                <span className="badge">{agent.type}</span>
                <h3>{agent.name}</h3>
                <p>{agent.description || "No description provided."}</p>
                <small>{agent.enabled ? "Enabled" : "Disabled"}</small>
              </article>
            ))}
          </div>
        </section>

        <section id="workflows" className="panel">
          <div className="section-heading">
            <p className="eyebrow">Flows</p>
            <h2>Workflows</h2>
          </div>
          <div className="stack-list">
            {workflows.length === 0 && <p className="empty-state">No workflows found yet.</p>}
            {workflows.map((workflow) => (
              <article key={workflow.id} className="workflow-card">
                <div>
                  <span className="badge">{workflow.enabled ? "Enabled" : "Disabled"}</span>
                  <h3>{workflow.name}</h3>
                  <p>{workflow.description || "No description provided."}</p>
                </div>
                <ol>
                  {workflow.steps?.map((step) => (
                    <li key={step.id}>{step.agentName} <small>{step.agentType}</small></li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section id="executions" className="panel">
          <div className="section-heading">
            <p className="eyebrow">History</p>
            <h2>Recent Executions</h2>
          </div>
          <div className="execution-list">
            {executions.length === 0 && <p className="empty-state">No executions have been recorded yet.</p>}
            {executions.map((execution) => (
              <Link key={execution.id} to={`/executions/${execution.id}`} className="execution-row">
                <div>
                  <strong>{execution.workflowName || "Workflow execution"}</strong>
                  <span>{execution.request}</span>
                </div>
                <span className={`status-pill ${String(execution.status).toLowerCase()}`}>{execution.status}</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({ title, value, description }) {
  return (
    <article className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}
