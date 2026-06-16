import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:8080/api";

export default function App() {
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/workflows`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/agents`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/executions`).then((r) => r.ok ? r.json() : []),
    ])
      .then(([workflowData, agentData, executionData]) => {
        setWorkflows(Array.isArray(workflowData) ? workflowData : []);
        setAgents(Array.isArray(agentData) ? agentData : []);
        setExecutions(Array.isArray(executionData) ? executionData : []);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not connect to AgentFlow API.");
      });
  }, []);

  return (
    <div style={{ fontFamily: "Arial", padding: 24 }}>
      <h1>AgentFlow UI</h1>
      <p>AI Agent Orchestration Dashboard</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
        <Card title="Workflows" value={workflows.length} />
        <Card title="Agents" value={agents.length} />
        <Card title="Executions" value={executions.length} />
      </div>

      <section style={{ marginTop: 32 }}>
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

      <section style={{ marginTop: 32 }}>
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