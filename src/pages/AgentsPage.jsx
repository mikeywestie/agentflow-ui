import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const AGENT_TYPES = ["PLANNER", "BUILDER", "REVIEWER"];
const EMPTY_AGENT_FORM = { name: "", description: "", type: "PLANNER", systemPrompt: "", enabled: true };

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [agentForm, setAgentForm] = useState(EMPTY_AGENT_FORM);
  const [editingAgentId, setEditingAgentId] = useState(null);
  const [savingAgent, setSavingAgent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function loadAgents() {
    setError("");
    fetch(`${API_BASE_URL}/agents`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setAgents(Array.isArray(data) ? data : []))
      .catch(() => setError("Could not load agents from AgentFlow API."));
  }

  useEffect(() => { loadAgents(); }, []);

  function validateForm() {
    if (!agentForm.name.trim()) {
      setError("Agent name is required.");
      return false;
    }

    if (!agentForm.systemPrompt.trim()) {
      setError("Agent instructions are required.");
      return false;
    }

    return true;
  }

  async function saveAgent() {
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setSavingAgent(true);

    try {
      const isEditing = Boolean(editingAgentId);
      const response = await fetch(`${API_BASE_URL}/agents${isEditing ? `/${editingAgentId}` : ""}`, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save agent.");

      setAgents((previous) => isEditing ? previous.map((agent) => agent.id === data.id ? data : agent) : [...previous, data]);
      setAgentForm(EMPTY_AGENT_FORM);
      setEditingAgentId(null);
      setSuccess(isEditing ? `Agent updated: ${data.name}` : `Agent created: ${data.name}`);
    } catch (err) {
      setError(err.message || "Could not save agent.");
    } finally {
      setSavingAgent(false);
    }
  }

  function startEdit(agent) {
    setError("");
    setSuccess("");
    setEditingAgentId(agent.id);
    setAgentForm({
      name: agent.name || "",
      description: agent.description || "",
      type: agent.type || "PLANNER",
      systemPrompt: agent.systemPrompt || "",
      enabled: agent.enabled !== false,
    });
  }

  function cancelEdit() {
    setEditingAgentId(null);
    setAgentForm(EMPTY_AGENT_FORM);
    setError("");
  }

  async function toggleEnabled(agent) {
    setError("");
    setSuccess("");

    try {
      const nextEnabled = !agent.enabled;
      const response = await fetch(`${API_BASE_URL}/agents/${agent.id}/enabled?enabled=${nextEnabled}`, { method: "PATCH" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update agent status.");
      setAgents((previous) => previous.map((item) => item.id === data.id ? data : item));
      setSuccess(`${data.name} ${data.enabled ? "enabled" : "disabled"}.`);
    } catch (err) {
      setError(err.message || "Could not update agent status.");
    }
  }

  async function deleteAgent(agent) {
    setError("");
    setSuccess("");

    const confirmed = window.confirm(`Delete agent "${agent.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/agents/${agent.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete agent.");
      setAgents((previous) => previous.filter((item) => item.id !== agent.id));
      if (editingAgentId === agent.id) cancelEdit();
      setSuccess(`Agent deleted: ${agent.name}`);
    } catch (err) {
      setError(err.message || "Could not delete agent. It may still be used by a workflow.");
    }
  }

  return (
    <AppLayout title="Agent Library">
      <header className="hero-card page-hero-card">
        <div>
          <p className="eyebrow">Agents</p>
          <h2>Create and manage AI specialists.</h2>
          <p>Agents define the role and behavior used inside workflow chains.</p>
        </div>
        <button className="secondary-button" onClick={loadAgents}>Refresh agents</button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="two-column-grid">
        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">Configure</p>
            <h2>{editingAgentId ? "Edit Agent" : "Create Agent"}</h2>
          </div>
          <label>Name</label>
          <input value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} placeholder="Planner Agent" />
          <label>Type</label>
          <select value={agentForm.type} onChange={(e) => setAgentForm({ ...agentForm, type: e.target.value })}>
            {AGENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <label>Description</label>
          <input value={agentForm.description} onChange={(e) => setAgentForm({ ...agentForm, description: e.target.value })} placeholder="Short purpose" />
          <label>Instructions</label>
          <textarea value={agentForm.systemPrompt} onChange={(e) => setAgentForm({ ...agentForm, systemPrompt: e.target.value })} rows={8} />
          <label className="checkbox-row"><input type="checkbox" checked={agentForm.enabled} onChange={(e) => setAgentForm({ ...agentForm, enabled: e.target.checked })} />Enabled</label>
          <div className="button-row">
            <button className="primary-button" onClick={saveAgent} disabled={savingAgent}>{savingAgent ? "Saving agent..." : editingAgentId ? "Update Agent" : "Create Agent"}</button>
            {editingAgentId && <button className="secondary-button" onClick={cancelEdit}>Cancel</button>}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading"><p className="eyebrow">Library</p><h2>Current Agents</h2></div>
          <div className="card-grid single-column-card-grid">
            {agents.length === 0 && <p className="empty-state">No agents found yet.</p>}
            {agents.map((agent) => (
              <article key={agent.id} className="info-card managed-card">
                <div className="managed-card-header">
                  <span className="badge">{agent.type}</span>
                  <small>{agent.enabled ? "Enabled" : "Disabled"}</small>
                </div>
                <h3>{agent.name}</h3>
                <p>{agent.description || "No description provided."}</p>
                <details className="compact-details">
                  <summary>View instructions</summary>
                  <pre className="light-pre">{agent.systemPrompt || "No instructions stored."}</pre>
                </details>
                <div className="button-row card-actions">
                  <button className="secondary-button" onClick={() => startEdit(agent)}>Edit</button>
                  <button className="secondary-button" onClick={() => toggleEnabled(agent)}>{agent.enabled ? "Disable" : "Enable"}</button>
                  <button className="danger-button" onClick={() => deleteAgent(agent)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
