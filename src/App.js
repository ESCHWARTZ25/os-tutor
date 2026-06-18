import { useState, useRef, useEffect } from "react";

const API_URL = api; 

const SUGGESTIONS = [
  "I think the OS loads it from disk?",
  "Is this related to virtual memory?",
  "I'm not sure where to start"
];

export default function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: [{ text: "Welcome. Let's work through Operating Systems concepts together. I won't give you answers directly — you'll reason through each problem first.\n\nTo start: walk me through what happens, step by step, when a process accesses a virtual address that isn't currently mapped to physical memory." }] }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const content = text || input;
    if (!content.trim() || loading) return;

    const updated = [...messages, { role: "user", content: [{ text: content }] }];
    setMessages(updated);
    setInput("");
    setLoading(true);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updated })
    });

    const raw = await res.json();
    console.log("API response:", raw); // add this
    const { reply } = raw;

    setMessages([...updated, { role: "assistant", content: [{ text: reply }] }]);
    setLoading(false);
  };

  const resetSession = () => {
    setMessages([{ role: "assistant", content: [{ text: "New session started. What OS concept would you like to work through?" }] }]);
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 720, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "#1D9E75", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14 }}>⬡</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>OS Tutor</div>
            <div style={{ fontSize: 11, color: "#888" }}>Socratic learning · Amazon Bedrock</div>
          </div>
        </div>
        <button onClick={resetSession} style={{ fontSize: 12, padding: "5px 12px", border: "1px solid #ddd", borderRadius: 6, background: "white", cursor: "pointer", color: "#555" }}>
          New session
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16, background: "#f9f9f9" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.role === "user" ? "#EEEDFE" : "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, flexShrink: 0, color: m.role === "user" ? "#3C3489" : "#0F6E56" }}>
              {m.role === "user" ? "E" : "AI"}
            </div>
            <div style={{ maxWidth: "80%" }}>
              <div style={{ padding: "10px 14px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.6, background: m.role === "user" ? "#1D9E75" : "#fff", color: m.role === "user" ? "white" : "#111", border: m.role === "user" ? "none" : "1px solid #e5e5e5", borderTopLeftRadius: m.role === "assistant" ? 4 : 12, borderTopRightRadius: m.role === "user" ? 4 : 12, whiteSpace: "pre-wrap" }}>
                {m.content[0].text}
              </div>
              {/* Suggestion pills on first assistant message only */}
              {m.role === "assistant" && i === 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {SUGGESTIONS.map((s, j) => (
                    <button key={j} onClick={() => sendMessage(s)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: "1px solid #ddd", background: "white", cursor: "pointer", color: "#555" }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "#0F6E56" }}>AI</div>
            <div style={{ padding: "10px 14px", borderRadius: 12, background: "#fff", border: "1px solid #e5e5e5", fontSize: 13.5, color: "#888", borderTopLeftRadius: 4 }}>Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e5e5", background: "#fff", display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Reason through it..."
          rows={1}
          style={{ flex: 1, resize: "none", fontSize: 13.5, padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", outline: "none", fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}
        />
        <button onClick={() => sendMessage()} disabled={loading} style={{ width: 36, height: 36, borderRadius: 8, background: loading ? "#ccc" : "#1D9E75", border: "none", cursor: loading ? "default" : "pointer", color: "white", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          ↑
        </button>
      </div>
    </div>
  );
}