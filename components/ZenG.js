// components/ZenG.js
// Floating AI career assistant mascot — bottom-left corner
// Click the cartoon to open/close the speech bubble chat

import { useState, useRef, useEffect } from "react";

const MODES = [
  { id: "interview",  icon: "🎯", label: "Interview"   },
  { id: "networking", icon: "🤝", label: "Networking"  },
  { id: "salary",     icon: "💰", label: "Salary"      },
];

const QUICK_PROMPTS = {
  interview:  "Generate 5 interview questions for a Finance Analyst role",
  networking: "Write a LinkedIn message to connect with a hiring manager at Google",
  salary:     "Help me negotiate a ₹8L offer — I'm targeting ₹11L with 4 years experience",
};

const WELCOME = {
  interview:  "Hey! 👋 Paste a job description and I'll give you 5 interview questions with full STAR frameworks.",
  networking: "Hey! 👋 Tell me the company you're targeting and I'll write you a killer LinkedIn outreach message.",
  salary:     "Hey! 👋 Share the offer details and I'll give you word-for-word scripts to negotiate more.",
};

// ─── ZenG SVG face ────────────────────────────────────────────────────────────
function ZenGFace({ size = 56, talking = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" fill="#1e1b4b" stroke="#facc15" strokeWidth="2.5" />
      <path d="M14 20 Q20 16 28 18 Q36 16 42 20" stroke="#4338ca" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M12 26 Q18 22 28 24 Q38 22 44 26" stroke="#4338ca" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4"/>
      <ellipse cx="20" cy="27" rx="4" ry={talking ? "4.5" : "4"} fill="#facc15" />
      <ellipse cx="36" cy="27" rx="4" ry={talking ? "4.5" : "4"} fill="#facc15" />
      <circle cx="21" cy="26" r="1.5" fill="#1e1b4b" />
      <circle cx="37" cy="26" r="1.5" fill="#1e1b4b" />
      <circle cx="22" cy="25" r="0.8" fill="white" opacity="0.8" />
      <circle cx="38" cy="25" r="0.8" fill="white" opacity="0.8" />
      {talking ? (
        <ellipse cx="28" cy="37" rx="5" ry="3.5" fill="#facc15" opacity="0.9" />
      ) : (
        <path d="M21 36 Q28 42 35 36" stroke="#facc15" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      <rect x="16" y="9" width="24" height="3" rx="1" fill="#facc15" />
      <polygon points="28,4 16,9 40,9" fill="#facc15" />
      <line x1="40" y1="9" x2="42" y2="14" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="42" cy="15" r="1.5" fill="#facc15" />
      {talking && (
        <circle cx="28" cy="28" r="26" fill="none" stroke="#facc15" strokeWidth="1.5" opacity="0.3">
          <animate attributeName="r" from="26" to="32" dur="0.9s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.3" to="0" dur="0.9s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "9px 13px", background: "#1e293b", borderRadius: 14, width: "fit-content" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "#facc15",
          animation: "zBounce 1s infinite", animationDelay: `${i * 0.18}s`,
        }} />
      ))}
    </div>
  );
}

// ─── Bot message renderer ─────────────────────────────────────────────────────
function BotMessage({ text }) {
  return (
    <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#e2e8f0" }}>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 5 }} />;
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^(\d+)/)[1];
          return (
            <div key={i} style={{ display: "flex", gap: 7, marginBottom: 4 }}>
              <span style={{ minWidth: 17, height: 17, borderRadius: "50%", background: "#facc1520", color: "#facc15", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 3, flexShrink: 0 }}>{num}</span>
              <span>{bold(line.replace(/^\d+\.\s/, ""))}</span>
            </div>
          );
        }
        if (/^[-•]\s/.test(line)) return (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
            <span style={{ color: "#facc15", flexShrink: 0, marginTop: 1 }}>•</span>
            <span>{bold(line.replace(/^[-•]\s/, ""))}</span>
          </div>
        );
        if (line.endsWith(":") && line.length < 55 && line === line.toUpperCase()) return (
          <div key={i} style={{ color: "#facc15", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", marginTop: 10, marginBottom: 3 }}>{line.replace(/:$/, "")}</div>
        );
        return <p key={i} style={{ margin: "0 0 3px" }}>{bold(line)}</p>;
      })}
    </div>
  );
}

function bold(text) {
  return text.split(/\*\*(.*?)\*\*/g).map((p, i) =>
    i % 2 === 1 ? <strong key={i} style={{ color: "#facc15", fontWeight: 600 }}>{p}</strong> : p
  );
}

// ─── Main ZenG ────────────────────────────────────────────────────────────────
export default function ZenG() {
  const [open, setOpen]         = useState(false);
  const [mode, setMode]         = useState("interview");
  const [msgs, setMsgs]         = useState({ interview: [], networking: [], salary: [] });
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [nudge, setNudge]       = useState(true);
  const bottomRef               = useRef(null);
  const taRef                   = useRef(null);

  const curMsgs = msgs[mode];

  useEffect(() => { const t = setTimeout(() => setNudge(false), 6000); return () => clearTimeout(t); }, []);
  useEffect(() => { if (open) setNudge(false); }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading, open]);
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 96) + "px";
    }
  }, [input]);

  async function send(override) {
    const text = (override || input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const next = [...curMsgs, userMsg];
    setMsgs(p => ({ ...p, [mode]: next }));
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/career-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMsgs(p => ({ ...p, [mode]: [...next, { role: "assistant", content: data.reply }] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes zBounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes zPop     { 0%{transform:scale(0.85) translateY(12px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes zWiggle  { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-7deg)} 75%{transform:rotate(7deg)} }
        @keyframes zFadeIn  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes zPulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>

        {/* ── CHAT WINDOW ── */}
        {open && (
          <div style={{
            width: 330, maxHeight: 540, background: "#0f172a",
            border: "1.5px solid #facc1535", borderRadius: 20,
            display: "flex", flexDirection: "column", overflow: "hidden",
            animation: "zPop 0.22s ease-out",
            boxShadow: "0 12px 48px #000000a0",
          }}>
            {/* Header */}
            <div style={{ background: "#1e1b4b", padding: "11px 13px 9px", borderBottom: "1px solid #facc1520", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ZenGFace size={30} talking={loading} />
                  <div>
                    <div style={{ color: "#facc15", fontWeight: 700, fontSize: 14, letterSpacing: "0.02em" }}>ZenG</div>
                    <div style={{ color: "#64748b", fontSize: 10, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: loading ? "#facc15" : "#22c55e", display: "inline-block", animation: loading ? "zPulse 1s infinite" : "none" }} />
                      {loading ? "Thinking..." : "Career AI • Online"}
                    </div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 2px" }}>×</button>
              </div>

              {/* Mode tabs */}
              <div style={{ display: "flex", gap: 4 }}>
                {MODES.map(m => (
                  <button key={m.id} onClick={() => { setMode(m.id); setInput(""); setError(""); }} style={{
                    flex: 1, padding: "5px 3px", borderRadius: 8,
                    border: `1px solid ${mode === m.id ? "#facc15" : "#1e293b"}`,
                    background: mode === m.id ? "#facc1518" : "transparent",
                    color: mode === m.id ? "#facc15" : "#475569",
                    fontSize: 10.5, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                  }}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "11px 11px 4px", display: "flex", flexDirection: "column", gap: 9, minHeight: 0 }}>

              {/* Welcome */}
              {curMsgs.length === 0 && (
                <div style={{ animation: "zFadeIn 0.3s ease" }}>
                  <div style={{ display: "flex", gap: 7, alignItems: "flex-end", marginBottom: 10 }}>
                    <ZenGFace size={26} />
                    <div style={{ background: "#1e293b", borderRadius: "14px 14px 14px 3px", padding: "9px 11px", fontSize: 12.5, color: "#cbd5e1", lineHeight: 1.5, maxWidth: "84%", border: "1px solid #facc1515" }}>
                      {WELCOME[mode]}
                    </div>
                  </div>
                  <div style={{ marginLeft: 34 }}>
                    <div style={{ fontSize: 9.5, color: "#334155", marginBottom: 5, letterSpacing: "0.06em" }}>TRY AN EXAMPLE</div>
                    <button onClick={() => send(QUICK_PROMPTS[mode])} style={{
                      background: "#facc1510", border: "1px solid #facc1528", borderRadius: 10,
                      padding: "7px 10px", fontSize: 11, color: "#facc15", cursor: "pointer",
                      textAlign: "left", lineHeight: 1.45, width: "100%",
                    }}>
                      {QUICK_PROMPTS[mode]}
                    </button>
                  </div>
                </div>
              )}

              {/* Message list */}
              {curMsgs.map((msg, i) => (
                <div key={i} style={{
                  display: "flex", gap: 7, flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-end", animation: "zFadeIn 0.2s ease",
                }}>
                  {msg.role === "assistant" && <ZenGFace size={22} />}
                  <div style={{
                    maxWidth: "83%",
                    background: msg.role === "user" ? "#312e81" : "#1e293b",
                    borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                    padding: "8px 11px",
                    border: msg.role === "user" ? "1px solid #4338ca38" : "1px solid #facc1512",
                  }}>
                    {msg.role === "assistant"
                      ? <BotMessage text={msg.content} />
                      : <div style={{ fontSize: 12.5, color: "#e2e8f0" }}>{msg.content}</div>
                    }
                  </div>
                </div>
              ))}

              {/* Typing */}
              {loading && (
                <div style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
                  <ZenGFace size={22} talking />
                  <TypingDots />
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ fontSize: 11, color: "#f87171", background: "#ef444418", border: "1px solid #ef444430", borderRadius: 8, padding: "6px 10px" }}>
                  ⚠️ {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "7px 9px 9px", borderTop: "1px solid #facc1515", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 6, background: "#1e293b", borderRadius: 11, border: "1px solid #facc1522", padding: "5px 7px" }}>
                <textarea
                  ref={taRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Ask ZenG anything..."
                  rows={1}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: 12.5, resize: "none", lineHeight: 1.5, padding: 0, fontFamily: "inherit" }}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  style={{
                    background: input.trim() && !loading ? "#facc15" : "transparent",
                    border: "none", borderRadius: 8, padding: "3px 9px",
                    color: input.trim() && !loading ? "#0f172a" : "#334155",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                    transition: "all 0.15s", alignSelf: "flex-end",
                  }}
                >↑</button>
              </div>
              <div style={{ textAlign: "center", fontSize: 9, color: "#1e293b", marginTop: 4 }}>
                Enter to send • Shift+Enter for new line
              </div>
            </div>
          </div>
        )}

        {/* ── NUDGE BUBBLE ── */}
        {nudge && !open && (
          <div style={{
            position: "relative", background: "#1e1b4b",
            border: "1.5px solid #facc1545", borderRadius: "12px 12px 12px 3px",
            padding: "8px 11px", maxWidth: 190, animation: "zFadeIn 0.4s ease", marginLeft: 6,
          }}>
            <div style={{ fontSize: 11.5, color: "#facc15", fontWeight: 700, marginBottom: 2 }}>Hi, I'm ZenG! 👋</div>
            <div style={{ fontSize: 10.5, color: "#94a3b8", lineHeight: 1.45 }}>
              Your AI career coach — interview prep, networking scripts & salary negotiation!
            </div>
          </div>
        )}

        {/* ── MASCOT BUTTON ── */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            animation: !open ? "zWiggle 3s ease-in-out 2s 1" : "none",
            filter: open
              ? "drop-shadow(0 0 14px #facc1560)"
              : "drop-shadow(0 4px 14px #00000070)",
            transition: "filter 0.2s",
            position: "relative",
          }}
          title="Chat with ZenG"
        >
          <ZenGFace size={62} talking={loading} />

          {/* Unread dot */}
          {!open && (
            <span style={{
              position: "absolute", top: 2, right: 2,
              width: 13, height: 13, borderRadius: "50%",
              background: "#facc15", border: "2px solid #0f172a",
              animation: "zBounce 2s infinite",
              display: "block",
            }} />
          )}
        </button>

      </div>
    </>
  );
}