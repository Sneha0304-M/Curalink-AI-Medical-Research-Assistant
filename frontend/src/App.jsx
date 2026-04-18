import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { sendMessage, clearSession } from "./utils/api";
import PublicationCard from "./components/PublicationCard";
import TrialCard from "./components/TrialCard";
import LLMResponse from "./components/LLMResponse";
import ProfileForm from "./components/ProfileForm";
import LoadingState from "./components/LoadingState";

// ── Sidebar tab button ──────────────────────────────────────────────────────
function TabBtn({ active, onClick, children, count }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "8px 4px",
      background: active ? "var(--surface2)" : "transparent",
      border: "none",
      borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
      color: active ? "var(--text)" : "var(--text3)",
      fontSize: 12, fontWeight: active ? 600 : 400,
      cursor: "pointer", fontFamily: "var(--font)",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      transition: "all 0.15s",
    }}>
      {children}
      {count > 0 && (
        <span style={{ fontSize: 10, background: active ? "var(--accent)" : "var(--surface2)", color: active ? "#000" : "var(--text3)", padding: "1px 5px", borderRadius: 10, fontFamily: "var(--mono)" }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Single chat message ─────────────────────────────────────────────────────
function ChatMessage({ msg, onFollowUp }) {
  const isUser = msg.role === "user";
  return (
    <div className="animate-in" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--teal))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, marginRight: 8, flexShrink: 0, marginTop: 2 }}>
          ⚕
        </div>
      )}
      <div style={{
        maxWidth: isUser ? "72%" : "88%",
        padding: "10px 14px",
        borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        background: isUser ? "var(--accent)" : "var(--surface)",
        color: isUser ? "#000" : "var(--text)",
        fontSize: 13, lineHeight: 1.65,
        border: isUser ? "none" : "1px solid var(--border)",
      }}>
        {msg.content && <p style={{ marginBottom: msg.llmResponse ? 12 : 0 }}>{msg.content}</p>}
        {msg.llmResponse && <LLMResponse response={msg.llmResponse} onFollowUp={onFollowUp} />}
      </div>
    </div>
  );
}

// ── Retrieval stats badge ───────────────────────────────────────────────────
function RetrievalBadge({ meta }) {
  if (!meta) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
      padding: "6px 12px", background: "var(--surface)",
      border: "1px solid var(--border)", borderRadius: 20,
      fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)",
      margin: "0 0 12px 36px",
    }}>
      <span style={{ color: "var(--teal)" }}>⬇ {meta.totalRetrieved} papers retrieved</span>
      <span>→</span>
      <span style={{ color: "var(--accent)" }}>ranked to top results</span>
      {meta.expandedQuery && (
        <>
          <span>·</span>
          <span style={{ color: "var(--text3)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={meta.expandedQuery}>
            🔍 {meta.expandedQuery}
          </span>
        </>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  "Latest treatment for lung cancer",
  "Clinical trials for diabetes",
  "Top researchers in Alzheimer's disease",
  "Recent studies on heart disease",
  "Deep brain stimulation for Parkinson's",
];

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem("curalink_session");
    if (stored) return stored;
    const id = uuidv4();
    localStorage.setItem("curalink_session", id);
    return id;
  });

  const [context, setContext] = useState(() => {
    try { return JSON.parse(localStorage.getItem("curalink_context") || "{}"); }
    catch { return {}; }
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [publications, setPublications] = useState([]);
  const [trials, setTrials] = useState([]);
  const [activeTab, setActiveTab] = useState("publications");
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lastMeta, setLastMeta] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (messages.length === 0) {
      const name = context.patientName;
      const disease = context.disease;
      let welcome = "Welcome to Curalink. I'm your AI medical research assistant.";
      if (name && disease) welcome = `Welcome back, ${name}. I'm ready to help you research ${disease}. What would you like to know?`;
      else if (name) welcome = `Welcome back, ${name}. What would you like to research today?`;
      setMessages([{ role: "assistant", content: welcome }]);
    }

  }, []);

  const saveContext = useCallback((newCtx) => {
    setContext(newCtx);
    localStorage.setItem("curalink_context", JSON.stringify(newCtx));
  }, []);

  const handleSend = useCallback(async (text) => {
    const query = (text || input).trim();
    if (!query || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: query }]);

    try {
      const result = await sendMessage(sessionId, query, context);

      if (result.publications?.length) { setPublications(result.publications); setSidebarOpen(true); }
      if (result.trials?.length) { setTrials(result.trials); }
      if (result.meta) setLastMeta(result.meta);

      // Switch to trials tab automatically if query mentions trials
      if (query.toLowerCase().includes("trial")) setActiveTab("trials");

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "",
        llmResponse: result.llmResponse,
        meta: result.meta,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please check your API keys and try again.",
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, sessionId, context]);

  const handleNewChat = async () => {
    await clearSession(sessionId).catch(() => {});
    setMessages([{ role: "assistant", content: "New session started. What would you like to research?" }]);
    setPublications([]); setTrials([]); setLastMeta(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── LEFT: Chat panel ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, borderRight: "1px solid var(--border)" }}>

        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "var(--bg2)", flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), var(--teal))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>⚕</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Curalink</p>
            <p style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>AI Medical Research Assistant</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Profile context pills */}
            {context.patientName && (
              <span style={{ fontSize: 11, color: "var(--purple)", background: "var(--purple-dim)", padding: "3px 8px", borderRadius: 10, fontFamily: "var(--mono)" }}>
                👤 {context.patientName}
              </span>
            )}
            {context.disease && (
              <span style={{ fontSize: 11, color: "var(--teal)", background: "var(--teal-dim)", padding: "3px 8px", borderRadius: 10, fontFamily: "var(--mono)" }}>
                {context.disease}
              </span>
            )}
            {context.location && (
              <span style={{ fontSize: 11, color: "var(--text3)", background: "var(--surface)", padding: "3px 8px", borderRadius: 10, fontFamily: "var(--mono)" }}>
                📍 {context.location}
              </span>
            )}
            <button onClick={() => setShowProfile(true)} title="Edit profile" style={iconBtn}>👤</button>
            <button onClick={handleNewChat} title="New chat" style={iconBtn}>✏️</button>
            <button onClick={() => setSidebarOpen((v) => !v)} title="Toggle research panel"
              style={{ ...iconBtn, color: sidebarOpen ? "var(--accent)" : "var(--text3)" }}>📋</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
          {messages.map((msg, i) => (
            <div key={i}>
              <ChatMessage msg={msg} onFollowUp={handleSend} />
              {/* Show retrieval stats below each assistant message that has meta */}
              {msg.role === "assistant" && msg.meta && (
                <RetrievalBadge meta={msg.meta} />
              )}
            </div>
          ))}

          {loading && (
            <div style={{ marginBottom: 12 }}><LoadingState /></div>
          )}
          <div ref={messagesEndRef} style={{ height: 20 }} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && !loading && (
          <div style={{ padding: "0 20px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => handleSend(s)} style={{
                fontSize: 12, color: "var(--text2)", background: "var(--surface)",
                border: "1px solid var(--border)", borderRadius: 20, padding: "5px 12px",
                cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.15s",
              }}
                onMouseEnter={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--accent)"; }}
                onMouseLeave={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text2)"; }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", background: "var(--bg2)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "4px 4px 4px 14px", transition: "border-color 0.2s" }}
            onFocusCapture={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlurCapture={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={context.disease ? `Ask about ${context.disease}...` : "Ask about any condition, treatment, or clinical trial..."}
              rows={1}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 13, fontFamily: "var(--font)", resize: "none", lineHeight: 1.6, paddingTop: 8, paddingBottom: 8, maxHeight: 120, overflowY: "auto" }}
              onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
              disabled={loading}
            />
            <button onClick={() => handleSend()} disabled={loading || !input.trim()} style={{
              width: 36, height: 36, borderRadius: "var(--radius-sm)",
              background: loading || !input.trim() ? "var(--surface2)" : "var(--accent)",
              border: "none", color: loading || !input.trim() ? "var(--text3)" : "#000",
              fontSize: 16, cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              alignSelf: "flex-end", marginBottom: 4, transition: "all 0.15s", flexShrink: 0,
            }}>
              {loading ? (
                <div style={{ width: 14, height: 14, border: "2px solid var(--text3)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              ) : "↑"}
            </button>
          </div>
          <p style={{ fontSize: 10, color: "var(--text3)", marginTop: 6, textAlign: "center" }}>
            For research purposes only · Always consult a healthcare provider
          </p>
        </div>
      </div>

      {/* ── RIGHT: Research sidebar ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div style={{ width: 400, flexShrink: 0, display: "flex", flexDirection: "column", background: "var(--bg2)", overflow: "hidden" }}>

          {/* Sidebar header */}
          <div style={{ padding: "14px 16px 0", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Research Results</p>
              {/* ── Retrieval depth badge ── */}
              {lastMeta && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: "var(--teal)", background: "var(--teal-dim)", padding: "2px 8px", borderRadius: 10, fontFamily: "var(--mono)" }}>
                    ⬇ {lastMeta.totalRetrieved} retrieved
                  </span>
                  <span style={{ fontSize: 10, color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 8px", borderRadius: 10, fontFamily: "var(--mono)" }}>
                    ✦ ranked to top
                  </span>
                </div>
              )}
            </div>

            {/* Expanded query */}
            {lastMeta?.expandedQuery && (
              <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 8, padding: "4px 8px", background: "var(--surface)", borderRadius: "var(--radius-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lastMeta.expandedQuery}>
                🔍 {lastMeta.expandedQuery}
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex" }}>
              <TabBtn active={activeTab === "publications"} onClick={() => setActiveTab("publications")} count={publications.length}>Publications</TabBtn>
              <TabBtn active={activeTab === "trials"} onClick={() => setActiveTab("trials")} count={trials.length}>Clinical Trials</TabBtn>
            </div>
          </div>

          {/* Results */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            {activeTab === "publications" && (
              publications.length === 0 ? <EmptyState type="publications" /> :
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {publications.map((pub, i) => <PublicationCard key={i} pub={pub} index={i} />)}
                </div>
            )}
            {activeTab === "trials" && (
              trials.length === 0 ? <EmptyState type="trials" /> :
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {trials.map((trial, i) => <TrialCard key={i} trial={trial} index={i} />)}
                </div>
            )}
          </div>

          {/* Sources footer */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, flexShrink: 0 }}>
            {["PubMed", "OpenAlex", "ClinicalTrials.gov"].map((src) => (
              <span key={src} style={{ fontSize: 10, color: "var(--text3)", background: "var(--surface)", padding: "2px 8px", borderRadius: 10, fontFamily: "var(--mono)" }}>{src}</span>
            ))}
          </div>
        </div>
      )}

      {/* Profile modal */}
      {showProfile && <ProfileForm context={context} onSave={saveContext} onClose={() => setShowProfile(false)} />}
    </div>
  );
}

const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "4px", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" };

function EmptyState({ type }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, color: "var(--text3)", textAlign: "center", gap: 8 }}>
      <span style={{ fontSize: 28 }}>{type === "publications" ? "📚" : "🔬"}</span>
      <p style={{ fontSize: 13 }}>{type === "publications" ? "Publications will appear here after your first query." : "Clinical trials will appear here after your first query."}</p>
    </div>
  );
}
