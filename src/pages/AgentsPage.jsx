import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const AGENT_TYPES = ["PLANNER", "BUILDER", "REVIEWER"];
const EMPTY_AGENT_FORM = { name: "", description: "", type: "PLANNER", systemPrompt: "", enabled: true };

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [agentForm, setAgentForm] = useState(EMPTY_AGENT_FORM);
  const [creatingAgent, setCreatingAgent] = useState(false);
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

  async function createAgent() {
    setError("");
    setSuccess("");

    if (!agentForm.name.trim()) {
      setError("Agent name is required.");
      return;
    }

    if (!agentForm.systemPrompt.trim()) {
      setError("Agent instructions are required.");
      return;
    }

    setCreatingAgent(true);

    try {
      const response = await fetch(`${API_BASE_URL}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create agent.");
      setAgents((previous) => [...previous, data]);
      setAgentForm(EMPTY_AGENT_FORM);
      setSuccess(`Agent created: ${data.name}`);
    } catch (err) {
      setError(err.message || "Could not create agent.");
    } finally {
      setCreatingAgent(false);
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
          <div className="section-heading"><p className="eyebrow">Configure</p><h2>Create Agent</h2></div>
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
          <button className="primary-button" onClick={createAgent} disabled={creatingAgent}>{creatingAgent ? "Creating agent..." : "Create Agent"}</button>
        </div>

        <div className="panel">
          <div className="section-heading"><p className="eyebrow">Library</p><h2>Current Agents</h2></div>
          <div className="card-grid single-column-card-grid">
            {agents.length === 0 && <p className="empty-state">No agents found yet.</p>}
            {agents.map((agent) => <article key={agent.id} className="info-card"><span className="badge">{agent.type}</span><h3>{agent.name}</h3><p>{agent.description || "No description provided."}</p><small>{agent.enabled ? "Enabled" : "Disabled"}</small></article>)}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
