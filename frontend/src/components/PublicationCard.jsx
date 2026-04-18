import React, { useState } from "react";

const sourceColors = {
  PubMed: { color: "#38bdf8", bg: "rgba(56,189,248,0.10)" },
  OpenAlex: { color: "#2dd4bf", bg: "rgba(45,212,191,0.10)" },
};

export default function PublicationCard({ pub, index }) {
  const [expanded, setExpanded] = useState(false);
  const src = sourceColors[pub.source] || sourceColors.PubMed;

  // Extract a clean 1-2 sentence snippet from abstract
  const getSnippet = (abstract) => {
    if (!abstract || abstract === "No abstract available.") return null;
    const text = typeof abstract === "string" ? abstract : JSON.stringify(abstract);
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(" ").trim();
  };

  const snippet = getSnippet(pub.abstract);

  return (
    <div
      className="animate-in"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "16px",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: src.color, background: src.bg, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap", fontFamily: "var(--mono)" }}>
          {pub.source}
        </span>
        <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>{pub.year}</span>
        {pub.citationCount > 0 && (
          <span style={{ fontSize: 10, color: "var(--amber)", background: "var(--amber-dim)", padding: "2px 6px", borderRadius: 4, fontFamily: "var(--mono)" }}>
            ★ {pub.citationCount.toLocaleString()} citations
          </span>
        )}
      </div>

      {/* Title */}
      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", lineHeight: 1.5, marginBottom: 8 }}>
        {pub.title}
      </p>

      {/* Authors */}
      {pub.authors?.length > 0 && (
        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10 }}>
          {pub.authors.slice(0, 3).join(", ")}{pub.authors.length > 3 ? ` +${pub.authors.length - 3} more` : ""}
        </p>
      )}

      {/* ── Supporting snippet (always visible) ── */}
      {snippet && (
        <div style={{
          background: "var(--bg2)",
          borderLeft: "2px solid var(--border2)",
          padding: "8px 12px",
          borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
          marginBottom: 10,
        }}>
          <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 3, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Supporting snippet
          </p>
          <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, fontStyle: "italic" }}>
            "{snippet}"
          </p>
        </div>
      )}

      {/* Full abstract toggle */}
      {pub.abstract && pub.abstract !== "No abstract available." && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", padding: 0, marginBottom: expanded ? 8 : 0, fontFamily: "var(--font)" }}
          >
            {expanded ? "▲ Hide full abstract" : "▼ Show full abstract"}
          </button>
          {expanded && (
            <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, background: "var(--bg2)", padding: "10px 12px", borderRadius: "var(--radius-sm)", borderLeft: "2px solid var(--border2)" }}>
              {typeof pub.abstract === "string" ? pub.abstract : JSON.stringify(pub.abstract)}
            </p>
          )}
        </>
      )}

      {/* Link */}
      {pub.url && (
        <a href={pub.url} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-block", marginTop: 10, fontSize: 11, color: "var(--accent)", textDecoration: "none", fontFamily: "var(--mono)" }}>
          View full paper →
        </a>
      )}
    </div>
  );
}
