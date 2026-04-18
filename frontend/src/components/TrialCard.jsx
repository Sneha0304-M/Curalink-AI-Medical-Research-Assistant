import React, { useState } from "react";

const statusConfig = {
  RECRUITING: { label: "Recruiting", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  COMPLETED: { label: "Completed", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  ACTIVE_NOT_RECRUITING: { label: "Active", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  UNKNOWN: { label: "Unknown", color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

export default function TrialCard({ trial, index }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[trial.status] || statusConfig.UNKNOWN;

  return (
    <div
      className="animate-in"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${status.color}`,
        borderRadius: "var(--radius)",
        padding: "16px",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Status badge */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: status.color,
            background: status.bg,
            padding: "2px 8px",
            borderRadius: 4,
            fontFamily: "var(--mono)",
          }}
        >
          ● {status.label}
        </span>
        {trial.nctId && (
          <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
            {trial.nctId}
          </span>
        )}
      </div>

      {/* Title */}
      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", lineHeight: 1.5, marginBottom: 8 }}>
        {trial.title}
      </p>

      {/* Location */}
      {trial.locations?.length > 0 && (
        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>
          📍 {trial.locations.slice(0, 2).join(" · ")}
        </p>
      )}

      {/* Expand for details */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none",
          border: "none",
          color: "var(--accent)",
          fontSize: 12,
          cursor: "pointer",
          padding: 0,
          fontFamily: "var(--font)",
        }}
      >
        {expanded ? "▲ Hide details" : "▼ Show details"}
      </button>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          {/* Summary */}
          {trial.summary && trial.summary !== "No summary available." && (
            <p
              style={{
                fontSize: 12,
                color: "var(--text2)",
                lineHeight: 1.7,
                background: "var(--bg2)",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                marginBottom: 8,
              }}
            >
              {trial.summary.slice(0, 400)}
              {trial.summary.length > 400 ? "…" : ""}
            </p>
          )}

          {/* Eligibility snippet */}
          {trial.eligibility && trial.eligibility !== "See trial listing for criteria." && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Eligibility:</p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text2)",
                  lineHeight: 1.6,
                  background: "var(--bg2)",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {trial.eligibility.slice(0, 300)}
                {trial.eligibility.length > 300 ? "…" : ""}
              </p>
            </div>
          )}

          {/* Contact */}
          {trial.contact && (trial.contact.email || trial.contact.phone) && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Contact:</p>
              <p style={{ fontSize: 11, color: "var(--text2)" }}>
                {trial.contact.name && <span>{trial.contact.name} · </span>}
                {trial.contact.email && (
                  <a
                    href={`mailto:${trial.contact.email}`}
                    style={{ color: "var(--accent)" }}
                  >
                    {trial.contact.email}
                  </a>
                )}
                {trial.contact.phone && <span> · {trial.contact.phone}</span>}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ClinicalTrials.gov link */}
      {trial.url && (
        <a
          href={trial.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: 10,
            fontSize: 11,
            color: status.color,
            textDecoration: "none",
            fontFamily: "var(--mono)",
          }}
        >
          View on ClinicalTrials.gov →
        </a>
      )}
    </div>
  );
}
