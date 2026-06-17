import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export default function EmailToolsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [workflowResult, setWorkflowResult] = useState(null);
  const [query, setQuery] = useState("quote");
  const [workflowId, setWorkflowId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadWorkflows();
    searchMessages("quote");
  }, []);

  async function loadWorkflows() {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows`);
      const data = response.ok ? await response.json() : [];
      const enabledWorkflows = Array.isArray(data) ? data.filter((workflow) => workflow.enabled !== false) : [];
      setWorkflows(enabledWorkflows);
      if (enabledWorkflows.length > 0) setWorkflowId(enabledWorkflows[0].id);
    } catch {
      setError("Could not load workflows.");
    }
  }

  async function searchMessages(searchQuery = query) {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/tools/email/messages?query=${encodeURIComponent(searchQuery || "")}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not search email tool messages.");
      setMessages(Array.isArray(data) ? data : []);
      setSelectedMessage(null);
      setProposal(null);
      setSuccess(`Found ${Array.isArray(data) ? data.length : 0} local email message(s).`);
    } catch (err) {
      setError(err.message || "Could not search email tool messages.");
    } finally {
      setLoading(false);
    }
  }

  async function readMessage(id) {
    setError("");
    setProposal(null);

    try {
      const response = await fetch(`${API_BASE_URL}/tools/email/messages/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not read email message.");
      setSelectedMessage(data);
    } catch (err) {
      setError(err.message || "Could not read email message.");
    }
  }

  async function createProposal(id) {
    setError("");
    setProposal(null);

    try {
      const response = await fetch(`${API_BASE_URL}/tools/email/messages/${id}/proposal`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create local proposal.");
      setProposal(data);
    } catch (err) {
      setError(err.message || "Could not create local proposal.");
    }
  }

  async function runEmailWorkflow() {
    setError("");
    setSuccess("");
    setWorkflowResult(null);

    if (!workflowId) {
      setError("Select an enabled workflow first.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/tools/email/workflows/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, query }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not run email workflow.");
      setWorkflowResult(data);
      setMessages(data.messages || []);
      setSuccess(`Email workflow completed with ${data.matchedMessageCount} matched message(s).`);
    } catch (err) {
      setError(err.message || "Could not run email workflow.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout title="Email Tools">
      <header className="hero-card page-hero-card">
        <div>
          <p className="eyebrow">Tool-Using Agents</p>
          <h2>Email triage sandbox.</h2>
          <p>Search local mock emails, inspect messages, create approval-required proposals, and run the results through an AgentFlow workflow.</p>
        </div>
        <span className="badge">Local sandbox</span>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="tool-status-grid">
        <article className="tool-status-card active"><strong>Implemented</strong><span>Read local email messages</span></article>
        <article className="tool-status-card active"><strong>Implemented</strong><span>Run email context through workflows</span></article>
        <article className="tool-status-card pending"><strong>Placeholder</strong><span>Gmail OAuth connection</span></article>
        <article className="tool-status-card pending"><strong>Approval required</strong><span>Send, archive, delete, label</span></article>
      </section>

      <section className="two-column-grid">
        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">Search</p>
            <h2>Email Tool Input</h2>
            <p>This currently uses local sample email data. Later this can be replaced with Gmail search/read tools.</p>
          </div>

          <label>Email query</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="quote, recruiter, AgentFlow" />

          <label>Workflow</label>
          <select value={workflowId} onChange={(e) => setWorkflowId(e.target.value)}>
            {workflows.length === 0 && <option value="">No enabled workflows found</option>}
            {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
          </select>

          <div className="button-row">
            <button className="secondary-button" onClick={() => searchMessages()} disabled={loading}>{loading ? "Working..." : "Search Emails"}</button>
            <button className="primary-button" onClick={runEmailWorkflow} disabled={loading || !workflowId}>{loading ? "Running..." : "Run Email Workflow"}</button>
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">Safety</p>
            <h2>Tool Permission Model</h2>
          </div>
          <div className="permission-list">
            <div><strong>READ_ONLY</strong><p>Search and read message content for analysis.</p></div>
            <div><strong>APPROVAL_REQUIRED</strong><p>Draft, send, archive, delete, or label actions must be reviewed first.</p></div>
            <div><strong>Not implemented yet</strong><p>Real Gmail OAuth, real sending, real mailbox changes, and approval queue UI.</p></div>
          </div>
        </div>
      </section>

      <section className="email-tool-grid">
        <div className="panel">
          <div className="section-heading"><p className="eyebrow">Messages</p><h2>Matched Emails</h2></div>
          <div className="stack-list">
            {messages.length === 0 && <p className="empty-state">No email messages found.</p>}
            {messages.map((message) => (
              <article key={message.id} className="email-message-card">
                <div className="managed-card-header">
                  <span className="badge">{message.unread ? "Unread" : "Read"}</span>
                  {message.hasAttachment && <small>Attachment</small>}
                </div>
                <h3>{message.subject}</h3>
                <p><strong>{message.fromName}</strong> &lt;{message.fromEmail}&gt;</p>
                <p>{message.snippet}</p>
                <div className="button-row card-actions">
                  <button className="secondary-button" onClick={() => readMessage(message.id)}>Read</button>
                  <button className="secondary-button" onClick={() => createProposal(message.id)}>Create Proposal</button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading"><p className="eyebrow">Inspect</p><h2>Message Detail</h2></div>
          {!selectedMessage && <p className="empty-state">Select a message to inspect its stored body.</p>}
          {selectedMessage && (
            <article className="email-detail-card">
              <span className="badge">{selectedMessage.id}</span>
              <h3>{selectedMessage.subject}</h3>
              <p><strong>From:</strong> {selectedMessage.fromName} &lt;{selectedMessage.fromEmail}&gt;</p>
              <pre className="light-pre">{selectedMessage.body}</pre>
            </article>
          )}

          {proposal && (
            <article className="proposal-card">
              <p className="eyebrow">Approval Required Proposal</p>
              <h3>{proposal.subject}</h3>
              <p><strong>To:</strong> {proposal.to}</p>
              <pre className="light-pre">{proposal.body}</pre>
              <p><strong>Access:</strong> {proposal.accessLevel}</p>
              <p>{proposal.approvalReason}</p>
              <button className="danger-button" disabled>Send disabled until approval workflow exists</button>
            </article>
          )}
        </div>
      </section>

      {workflowResult && (
        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Workflow Result</p>
            <h2>Email workflow execution</h2>
            <p>{workflowResult.safetyNote}</p>
          </div>
          <div className="final-summary-grid">
            <div><span>Matched messages</span><strong>{workflowResult.matchedMessageCount}</strong></div>
            <div><span>Access level</span><strong>{workflowResult.accessLevel}</strong></div>
            <div><span>Status</span><strong>{workflowResult.execution?.status || "-"}</strong></div>
            <div><span>Trace</span><strong>{workflowResult.execution?.id ? <Link to={`/executions/${workflowResult.execution.id}`}>Open</Link> : "-"}</strong></div>
          </div>
          <pre className="light-pre">{workflowResult.execution?.finalOutput || "No final output returned."}</pre>
        </section>
      )}
    </AppLayout>
  );
}
