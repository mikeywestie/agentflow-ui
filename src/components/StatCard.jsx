import React from "react";

export default function StatCard(props) {
  return (
    <article className="stat-card">
      <span>{props.title}</span>
      <strong>{props.value}</strong>
      <p>{props.description}</p>
    </article>
  );
}
