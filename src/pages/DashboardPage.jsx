import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080/api";

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [request, setRequest] = useState("Build a quotation management system for electrical contractors");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function loadData() {
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
        setError("Could not connect to AgentFlow API.");
      });
  }

  useEffect(() => {
    loadData();
  }, []);

  async function runWorkflow() {
    setError("");

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
    } catch (err) {
      console.error(err);
      setError(err.message || "Execution failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <h1>AgentFlow UI</h1>
      <p>AI Agent Orchestration Dashboard</p>

      {error && <p style={errorStyle}>{error}</p>}

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

      <section style={sectionStyle}>
        <h2>Workflows</h2>

        {workflows.map((workflow) => (
          <div key={workflow.id} style={panelStyle}>
            <h3>{workflow.name}</h3>
            <p>{workflow.description}</p>

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

const labelStyle = {
  display: "block",
  fontWeight: "bold",
  marginTop: 12,
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
};

const textareaStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontFamily: "Arial",
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

const errorStyle = {
  color: "#b91c1c",
  background: "#fee2e2",
  padding: 12,
  borderRadius: 8,
};
