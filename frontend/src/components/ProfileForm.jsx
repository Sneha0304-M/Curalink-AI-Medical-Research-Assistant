import React, { useState } from "react";

export default function ProfileForm({ context, onSave, onClose }) {
  const [form, setForm] = useState({
    patientName: context?.patientName || "",
    disease: context?.disease || "",
    location: context?.location || "",
  });

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animate-in"
        style={{
          background: "var(--bg3)",
          border: "1px solid var(--border2)",
          borderRadius: "var(--radius-lg)",
          padding: "28px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            Medical Profile
          </p>
          <p style={{ fontSize: 12, color: "var(--text3)" }}>
            This context helps personalize your research results.
          </p>
        </div>

        {/* Fields */}
        {[
          { key: "patientName", label: "Patient Name", placeholder: "e.g. John Smith", type: "text" },
          { key: "disease", label: "Condition / Disease", placeholder: "e.g. Parkinson's disease", type: "text" },
          { key: "location", label: "Location (optional)", placeholder: "e.g. Toronto, Canada", type: "text" },
        ].map(({ key, label, placeholder }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "var(--text3)",
                marginBottom: 6,
                fontFamily: "var(--mono)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </label>
            <input
              type="text"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              style={{
                width: "100%",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 12px",
                color: "var(--text)",
                fontSize: 13,
                fontFamily: "var(--font)",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
        ))}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text2)",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "var(--font)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 2,
              padding: "10px",
              background: "var(--accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "#000",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font)",
            }}
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
