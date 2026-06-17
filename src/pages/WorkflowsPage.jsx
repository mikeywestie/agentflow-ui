import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const EMPTY_WORKFLOW_FORM = { name: "", description: "", enabled: true, agentIds: [] };

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [workflowForm, setWorkflowForm] = useState(EMPTY_WORKFLOW_FORM);
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const enabledAgents = useMemo(() => agents.filter((agent) => agent.enabled !== false), [agents]);

  function loadData() {
    setError("");
    Promise.all([
      fetch(`${API_BASE_URL}/workflows`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE_URL}/agents`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([workflowData, agentData]) => {
        setWorkflows(Array.isArray(workflowData) ? workflowData : []);
        setAgents(Array.isArray(agentData) ? agentData : []);
      })
      .catch(() => setError("Could not load workflow data from AgentFlow API."));
  }

  useEffect(() => { loadData(); }, []);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflowForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create workflow.");
      setWorkflows((previous) => [...previous, data]);
      setWorkflowForm(EMPTY_WORKFLOW_FORM);
      setSuccess(`Workflow created: ${data.name}`);
    } catch (err) {
      setError(err.message || "Could not create workflow.");
    } finally {
      setCreatingWorkflow(false);
    }
  }

  function toggleWorkflowAgent(agentId) {
    setWorkflowForm((previous) => {
      const selected = previous.agentIds.includes(agentId);
      return { ...previous, agentIds: selected ? previous.agentIds.filter((id) => id !== agentId) : [...previous.agentIds, agentId] };
    });
  }

  return (
    <AppLayout title="Workflow Designer">
      <header className="hero-card page-hero-card">
        <div>
          <p className="eyebrow">Workflows</p>
          <h2>Design ordered agent chains.</h2>
          <p>Choose agents in the exact order they should run from request to final output.</p>
        </div>
        <button className="secondary-button" onClick={loadData}>Refresh workflows</button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="two-column-grid">
        <div className="panel">
          <div className="section-heading"><p className="eyebrow">Design</p><h2>Create Workflow</h2></div>
          <label>Name</label>
          <input value={workflowForm.name} onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })} placeholder="Software Architecture Workflow" />
          <label>Description</label>
          <input value={workflowForm.description} onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })} placeholder="What this workflow is used for" />
          <label className="checkbox-row"><input type="checkbox" checked={workflowForm.enabled} onChange={(e) => setWorkflowForm({ ...workflowForm, enabled: e.target.checked })} />Enabled</label>

          <h3 className="mini-heading">Workflow Steps</h3>
          {enabledAgents.length === 0 && <p className="empty-state">No enabled agents available yet.</p>}
          <div className="choice-list">
            {enabledAgents.map((agent) => {
              const selectedIndex = workflowForm.agentIds.indexOf(agent.id);
              return <label key={agent.id} className="choice-card"><input type="checkbox" checked={selectedIndex >= 0} onChange={() => toggleWorkflowAgent(agent.id)} /><span>{selectedIndex >= 0 ? `Step ${selectedIndex + 1}: ` : ""}<strong>{agent.name}</strong> <small>{agent.type}</small></span></label>;
            })}
          </div>

          {workflowForm.agentIds.length > 0 && <div className="preview-box">{workflowForm.agentIds.map((id) => agents.find((agent) => agent.id === id)?.name || "Unknown Agent").join(" -> ")}</div>}
          <button className="primary-button" onClick={createWorkflow} disabled={creatingWorkflow}>{creatingWorkflow ? "Creating workflow..." : "Create Workflow"}</button>
        </div>

        <div className="panel">
          <div className="section-heading"><p className="eyebrow">Flows</p><h2>Current Workflows</h2></div>
          <div className="stack-list">
            {workflows.length === 0 && <p className="empty-state">No workflows found yet.</p>}
            {workflows.map((workflow) => <article key={workflow.id} className="workflow-card"><div><span className="badge">{workflow.enabled ? "Enabled" : "Disabled"}</span><h3>{workflow.name}</h3><p>{workflow.description || "No description provided."}</p></div><ol>{workflow.steps?.map((step) => <li key={step.id}>{step.agentName} <small>{step.agentType}</small></li>)}</ol></article>)}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
