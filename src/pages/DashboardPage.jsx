import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080/api";
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
        setError("Could not connect to AgentFlow API.");
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
    <div style={pageStyle}>
      <h1>AgentFlow UI</h1>
      <p>AI Agent Orchestration Dashboard</p>

      {error && <p style={errorStyle}>{error}</p>}
      {success && <p style={successStyle}>{success}</p>}

      <div style={cardsStyle}>
        <Card title="Workflows" value={workflows.length} />
        <Card title="Agents" value={agents.length} />
        <Card title="Executions" value={executions.length} />
      </div>

      <section style={sectionStyle}>
        <h2>Run Workflow</h2>

        <label style={labelStyle}>Workflow</label>
        <select
          value={selectedWorkflowId}
          onChange={(e) => setSelectedWorkflowId(e.target.value)}
          style={inputStyle}
        >
          {workflows.map((workflow) => (
            <option key={workflow.id} value={workflow.id}>
              {workflow.name}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Request</label>
        <textarea
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          rows={5}
          style={textareaStyle}
        />

        <button onClick={runWorkflow} disabled={loading} style={buttonStyle}>
          {loading ? "Running agents..." : "Run Workflow"}
        </button>
      </section>

      <section style={twoColumnSectionStyle}>
        <div style={panelStyle}>
          <h2>Create Agent</h2>
          <p style={mutedStyle}>Define a reusable AI specialist with its own role and system prompt.</p>

          <label style={labelStyle}>Name</label>
          <input
            value={agentForm.name}
            onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
            placeholder="Example: Security Reviewer Agent"
            style={inputStyle}
          />

          <label style={labelStyle}>Type</label>
          <select
            value={agentForm.type}
            onChange={(e) => setAgentForm({ ...agentForm, type: e.target.value })}
            style={inputStyle}
          >
            {AGENT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <label style={labelStyle}>Description</label>
          <input
            value={agentForm.description}
            onChange={(e) => setAgentForm({ ...agentForm, description: e.target.value })}
            placeholder="Short purpose for this agent"
            style={inputStyle}
          />

          <label style={labelStyle}>System Prompt</label>
          <textarea
            value={agentForm.systemPrompt}
            onChange={(e) => setAgentForm({ ...agentForm, systemPrompt: e.target.value })}
            rows={6}
            placeholder="You are a senior Spring Boot security reviewer..."
            style={textareaStyle}
          />

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={agentForm.enabled}
              onChange={(e) => setAgentForm({ ...agentForm, enabled: e.target.checked })}
            />
            Enabled
          </label>

          <button onClick={createAgent} disabled={creatingAgent} style={buttonStyle}>
            {creatingAgent ? "Creating agent..." : "Create Agent"}
          </button>
        </div>

        <div style={panelStyle}>
          <h2>Create Workflow</h2>
          <p style={mutedStyle}>Choose agents in the exact order they should run.</p>

          <label style={labelStyle}>Name</label>
          <input
            value={workflowForm.name}
            onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
            placeholder="Example: Secure Architecture Workflow"
            style={inputStyle}
          />

          <label style={labelStyle}>Description</label>
          <input
            value={workflowForm.description}
            onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
            placeholder="What this workflow is used for"
            style={inputStyle}
          />

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={workflowForm.enabled}
              onChange={(e) => setWorkflowForm({ ...workflowForm, enabled: e.target.checked })}
            />
            Enabled
          </label>

          <h3>Workflow Steps</h3>
          {enabledAgents.length === 0 && <p>No enabled agents available yet.</p>}

          <div style={agentPickerStyle}>
            {enabledAgents.map((agent) => {
              const selectedIndex = workflowForm.agentIds.indexOf(agent.id);

              return (
                <label key={agent.id} style={agentChoiceStyle}>
                  <input
                    type="checkbox"
                    checked={selectedIndex >= 0}
                    onChange={() => toggleWorkflowAgent(agent.id)}
                  />
                  <span>
                    {selectedIndex >= 0 ? `Step ${selectedIndex + 1}: ` : ""}
                    <strong>{agent.name}</strong> ({agent.type})
                  </span>
                </label>
              );
            })}
          </div>

          {workflowForm.agentIds.length > 0 && (
            <div style={previewStyle}>
              <strong>Preview:</strong>{" "}
              {workflowForm.agentIds
                .map((id) => agents.find((agent) => agent.id === id)?.name || "Unknown Agent")
                .join(" → ")}
            </div>
          )}

          <button onClick={createWorkflow} disabled={creatingWorkflow} style={buttonStyle}>
            {creatingWorkflow ? "Creating workflow..." : "Create Workflow"}
          </button>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>Agents</h2>
        <div style={cardsStyle}>
          {agents.map((agent) => (
            <div key={agent.id} style={agentCardStyle}>
              <h3>{agent.name}</h3>
              <p><strong>Type:</strong> {agent.type}</p>
              <p><strong>Status:</strong> {agent.enabled ? "Enabled" : "Disabled"}</p>
              {agent.description && <p>{agent.description}</p>}
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>Workflows</h2>

        {workflows.map((workflow) => (
          <div key={workflow.id} style={panelStyle}>
            <h3>{workflow.name}</h3>
            <p>{workflow.description}</p>
            <p><strong>Status:</strong> {workflow.enabled ? "Enabled" : "Disabled"}</p>

            <strong>Steps:</strong>
            <ul>
              {workflow.steps?.map((step) => (
                <li key={step.id}>
                  Step {step.stepOrder}: {step.agentName} ({step.agentType})
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section style={sectionStyle}>
        <h2>Recent Executions</h2>

        {executions.map((execution) => (
          <div key={execution.id} style={panelStyle}>
            <h3>{execution.workflowName}</h3>

            <p>
              <strong>Status:</strong> {execution.status}
            </p>

            <p>
              <strong>Request:</strong> {execution.request}
            </p>

            <Link to={`/executions/${execution.id}`} style={linkButtonStyle}>
              View Details
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={cardStyle}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

const pageStyle = {
  fontFamily: "Arial",
  padding: 24,
  maxWidth: 1200,
  margin: "0 auto",
};

const cardsStyle = {
  display: "flex",
  gap: 16,
  marginTop: 24,
  flexWrap: "wrap",
};

const sectionStyle = {
  marginTop: 32,
};

const twoColumnSectionStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  marginTop: 32,
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 20,
  minWidth: 160,
  background: "#f9f9f9",
};

const panelStyle = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
  background: "#fff",
};

const agentCardStyle = {
  ...cardStyle,
  flex: "1 1 260px",
};

const labelStyle = {
  display: "block",
  fontWeight: "bold",
  marginTop: 12,
  marginBottom: 6,
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: "bold",
  marginTop: 12,
};

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontFamily: "Arial",
  boxSizing: "border-box",
};

const buttonStyle = {
  marginTop: 12,
  padding: "12px 18px",
  border: "none",
  borderRadius: 8,
  background: "#111827",
  color: "white",
  cursor: "pointer",
};

const linkButtonStyle = {
  display: "inline-block",
  marginTop: 10,
  padding: "10px 14px",
  borderRadius: 8,
  background: "#111827",
  color: "white",
  textDecoration: "none",
};

const agentPickerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const agentChoiceStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: 10,
  border: "1px solid #ddd",
  borderRadius: 8,
};

const previewStyle = {
  marginTop: 12,
  padding: 12,
  background: "#f7f7f7",
  borderRadius: 8,
};

const mutedStyle = {
  color: "#555",
};

const errorStyle = {
  color: "#b91c1c",
  background: "#fee2e2",
  padding: 12,
  borderRadius: 8,
};

const successStyle = {
  color: "#166534",
  background: "#dcfce7",
  padding: 12,
  borderRadius: 8,
};
