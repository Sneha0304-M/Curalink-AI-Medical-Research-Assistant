import React from "react";

export default function LLMResponse({ response, onFollowUp }) {
  if (!response) return null;

  return (
    <div
      className="animate-in"
      style={{
        background: "linear-gradient(135deg, rgba(56,189,248,0.06) 0%, rgba(167,139,250,0.06) 100%)",
        border: "1px solid rgba(56,189,248,0.2)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        marginBottom: 16,
      }}
    >
      {/* Condition Overview */}
      {response.conditionOverview && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--mono)" }}>
            ◈ Condition Overview
          </p>
          <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>
            {response.conditionOverview}
          </p>
        </div>
      )}

      {/* Research Insights */}
      {response.researchInsights?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "var(--mono)" }}>
            ◈ Research Insights
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {response.researchInsights.map((insight, i) => (
              <div key={i} style={{ background: "var(--bg2)", borderRadius: "var(--radius-sm)", padding: "12px 14px", borderLeft: "2px solid var(--teal)" }}>
                <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 4 }}>{insight.finding}</p>
                {insight.significance && (
                  <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5, marginBottom: 4 }}>→ {insight.significance}</p>
                )}
                {insight.source && (
                  <p style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>{insight.source}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trial Highlights */}
      {response.trialHighlights?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--purple)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "var(--mono)" }}>
            ◈ Trial Highlights
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {response.trialHighlights.map((t, i) => (
              <div key={i} style={{ background: "var(--bg2)", borderRadius: "var(--radius-sm)", padding: "12px 14px", borderLeft: "2px solid var(--purple)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--purple)", background: "var(--purple-dim)", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", fontFamily: "var(--mono)", flexShrink: 0, marginTop: 2 }}>
                  {t.status}
                </span>
                <div>
                  <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, marginBottom: 3 }}>{t.trial}</p>
                  {t.relevance && <p style={{ fontSize: 12, color: "var(--text2)" }}>{t.relevance}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalized Advice */}
      {response.personalizedAdvice && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--mono)" }}>
            ◈ Personalized Context
          </p>
          <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>{response.personalizedAdvice}</p>
        </div>
      )}

      {/* ── CLICKABLE Follow-up suggestions ── */}
      {response.followUpSuggestions?.length > 0 && onFollowUp && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, fontFamily: "var(--mono)" }}>
            💬 Suggested follow-ups — click to ask:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {response.followUpSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onFollowUp(s)}
                style={{
                  textAlign: "left",
                  fontSize: 12,
                  color: "var(--accent)",
                  background: "var(--accent-dim)",
                  border: "1px solid rgba(56,189,248,0.25)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  lineHeight: 1.4,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(56,189,248,0.2)";
                  e.target.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "var(--accent-dim)";
                  e.target.style.borderColor = "rgba(56,189,248,0.25)";
                }}
              >
                ↗ {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {response.disclaimer && (
        <p style={{ fontSize: 11, color: "var(--text3)", borderTop: "1px solid var(--border)", paddingTop: 10, lineHeight: 1.6, fontStyle: "italic" }}>
          ⚕ {response.disclaimer}
        </p>
      )}
    </div>
  );
}
