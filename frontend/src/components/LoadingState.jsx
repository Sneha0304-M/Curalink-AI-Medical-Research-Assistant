import React from "react";

export default function LoadingState() {
  return (
    <div style={{ padding: "4px 0" }}>
      {/* Thinking indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          padding: "12px 16px",
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
                animation: "pulse 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        <div>
          <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 2 }}>
            Curalink is researching...
          </p>
          <p style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
            Querying PubMed · OpenAlex · ClinicalTrials.gov
          </p>
        </div>
      </div>

      {/* Skeleton cards */}
      {[180, 140, 120].map((h, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: h,
            borderRadius: "var(--radius)",
            marginBottom: 10,
            opacity: 1 - i * 0.2,
          }}
        />
      ))}
    </div>
  );
}
