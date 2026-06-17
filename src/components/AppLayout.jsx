import React from "react";
import { Link } from "react-router-dom";

export default function AppLayout({ children, title = "Orchestration Dashboard" }) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">AF</div>
        <div>
          <p className="eyebrow">AgentFlow</p>
          <h1>{title}</h1>
        </div>
        <nav className="nav-list app-nav-list">
          <Link to="/">Dashboard</Link>
          <Link to="/executions">Executions</Link>
          <Link to="/agents">Agents</Link>
          <Link to="/workflows">Workflows</Link>
        </nav>
      </aside>

      <section className="content-area">
        {children}
      </section>
    </main>
  );
}
