"use client";

import { useState, useRef, useEffect } from "react";

const QUICK_ACTIONS = [
  { label: "NTPC Notes banao", text: "Mujhe RRB NTPC ke notes chahiye" },
  { label: "SSC CGL Flashcards", text: "SSC CGL ke flashcards generate karo" },
  { label: "YouTube se notes", text: "YouTube video se notes kaise banau?" },
  { label: "Features batao", text: "Is app mein kya kya features hain?" },
  { label: "Best subject?", text: "Kaunsa subject pehle padhu NTPC ke liye?" },
  { label: "Preparation tips", text: "Exam preparation ke tips do" },
];

const WELCOME_MESSAGE = {
  role: "assistant",
  content: `Namaste! Main hoon NotesAI Helper 🤖

Main tumhari exam preparation mein madad karunga. Yeh app kya-kya kar sakta hai:

📚 **Notes** - Kisi bhi exam ka subject-wise detailed notes
🃏 **Flashcards** - Interactive question-answer cards
🎬 **YouTube Notes** - Video link se automatic notes
📥 **Download** - HTML file mein download karo

Batao kya banana chahte ho? Ya koi sawaal hai?`,
};

export default function ChatBot({ apiKey, onAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const downloadNotesHtml = (html, meta) => {
    const title = meta
      ? `${meta.exam} - ${meta.subject}${meta.topic ? " - " + meta.topic : ""} Notes`
      : "AI Generated Notes";

    const fullHtml = `<!DOCTYPE html>
<html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=Caveat:wght@400;600;700&display=swap" rel="stylesheet">
<title>Notes — ${title}</title>
<style>
  :root{--red:#e53e3e;--green:#38a169;--blue:#3182ce;--orange:#dd6b20;--purple:#805ad5}
  body{font-family:'Kalam','Caveat',cursive,system-ui,sans-serif;margin:0;padding:24px 32px;background:#fffdf7;background-image:linear-gradient(#e8e4dd 1px,transparent 1px);background-size:100% 32px;color:#2d3748;line-height:2;font-size:1.05rem}
  h1{font-family:'Caveat',cursive;color:#1a202c;font-size:2.2em;margin:20px 0 12px;padding:10px 16px;background:linear-gradient(135deg,#667eea22,#764ba222);border-radius:12px;border-left:6px solid #667eea;position:relative}
  h1::after{content:'';position:absolute;bottom:0;left:16px;right:16px;height:3px;background:linear-gradient(90deg,#667eea,#764ba2,#f093fb);border-radius:2px}
  h2{font-family:'Caveat',cursive;font-size:1.6em;margin:28px 0 10px;padding:8px 14px;color:#fff;border-radius:10px}
  h2:nth-of-type(6n+1){background:linear-gradient(135deg,#667eea,#764ba2)}
  h2:nth-of-type(6n+2){background:linear-gradient(135deg,#f093fb,#f5576c)}
  h2:nth-of-type(6n+3){background:linear-gradient(135deg,#4facfe,#00f2fe)}
  h2:nth-of-type(6n+4){background:linear-gradient(135deg,#43e97b,#38f9d7)}
  h2:nth-of-type(6n+5){background:linear-gradient(135deg,#fa709a,#fee140)}
  h2:nth-of-type(6n+6){background:linear-gradient(135deg,#a18cd1,#fbc2eb)}
  h3{font-family:'Caveat',cursive;color:#2d3748;font-size:1.3em;margin:20px 0 8px;padding-bottom:4px;border-bottom:2px dashed #cbd5e0}
  ul,ol{padding-left:22px;margin:8px 0} li{margin:6px 0}
  ul li::marker{color:var(--purple);font-size:1.2em} ol li::marker{color:var(--blue);font-weight:700}
  table{border-collapse:separate;border-spacing:0;width:100%;margin:16px 0;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)}
  th{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:12px 16px;font-weight:700;text-align:left}
  td{padding:10px 16px;border-bottom:1px solid #e2e8f0}
  tr:nth-child(even){background:#f0ebff} tr:nth-child(odd){background:#fff} tr:hover{background:#e9e0ff}
  blockquote{border-left:5px solid var(--purple);padding:14px 18px;background:linear-gradient(135deg,#faf5ff,#f3e8ff);margin:16px 0;border-radius:0 12px 12px 0;font-style:italic}
  strong{color:#1a202c;background:linear-gradient(transparent 60%,#fef08a 60%);padding:0 2px}
  mark{background:linear-gradient(135deg,#fef08a,#fbbf24);padding:2px 8px;border-radius:6px;font-weight:600;color:#744210;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
  .underline-imp{text-decoration:underline wavy var(--red);text-underline-offset:4px;font-weight:600}
  .important-box{background:linear-gradient(135deg,#fff5f5,#fee2e2);border:2px solid #fc8181;border-left:6px solid var(--red);border-radius:12px;padding:16px 20px;margin:16px 0}
  .important-box::before{content:'\\2757 Important';font-family:'Caveat',cursive;font-size:0.85em;font-weight:700;color:var(--red);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
  .tip-box{background:linear-gradient(135deg,#f0fff4,#c6f6d5);border:2px solid #68d391;border-left:6px solid var(--green);border-radius:12px;padding:16px 20px;margin:16px 0}
  .tip-box::before{content:'\\1F4A1 Tip / Trick';font-family:'Caveat',cursive;font-size:0.85em;font-weight:700;color:var(--green);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
  .warning-box{background:linear-gradient(135deg,#fffaf0,#feebc8);border:2px solid #f6ad55;border-left:6px solid var(--orange);border-radius:12px;padding:16px 20px;margin:16px 0}
  .warning-box::before{content:'\\26A0\\FE0F Warning';font-family:'Caveat',cursive;font-size:0.85em;font-weight:700;color:var(--orange);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
  .formula-box{background:linear-gradient(135deg,#ebf8ff,#bee3f8);border:2px solid #63b3ed;border-left:6px solid var(--blue);border-radius:12px;padding:16px 20px;margin:16px 0}
  .formula-box::before{content:'\\1F4D0 Formula';font-family:'Caveat',cursive;font-size:0.85em;font-weight:700;color:var(--blue);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
  .remember-box{background:linear-gradient(135deg,#faf5ff,#e9d8fd);border:2px solid #b794f4;border-left:6px solid var(--purple);border-radius:12px;padding:16px 20px;margin:16px 0}
  .remember-box::before{content:'\\1F9E0 Remember';font-family:'Caveat',cursive;font-size:0.85em;font-weight:700;color:var(--purple);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
  p{margin:8px 0;line-height:2}
  @media print{body{padding:10px;background-image:none}}
  @media(max-width:600px){body{padding:12px 14px;font-size:0.95rem}h1{font-size:1.6em}h2{font-size:1.3em}}
</style></head><body>
${html}
<footer style="margin-top:40px;padding-top:15px;border-top:3px dashed #cbd5e0;color:#a0aec0;font-size:0.85em;text-align:center;font-family:'Caveat',cursive">
  Generated by AI Notes Maker | ${new Date().toLocaleDateString("hi-IN")}
</footer>
</body></html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9\u0900-\u097F\s-]/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setLoadingStatus("Soch raha hoon...");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          apiKey: apiKey || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Chat failed");
      }

      const msgObj = {
        role: "assistant",
        content: data.message,
      };

      if (data.generatedHtml) {
        msgObj.generatedHtml = data.generatedHtml;
        msgObj.notesMeta = data.notesMeta;
      }

      if (data.action) {
        msgObj.action = data.action;
      }

      setMessages((prev) => [...prev, msgObj]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, error aa gaya: ${err.message}. Dubara try karo!`,
        },
      ]);
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAction = (action) => {
    if (onAction && action) {
      onAction(action);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-toggle"
        aria-label="Open AI Helper"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window slide-up">
          {/* Header */}
          <div className="chat-header">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                AI
              </div>
              <div>
                <p className="text-white font-semibold text-sm">NotesAI Helper</p>
                <p className="text-emerald-400 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role === "user" ? "chat-msg-user" : "chat-msg-bot"}`}>
                <div
                  className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-bot"}`}
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br/>"),
                  }}
                />

                {/* Generated Notes Inline */}
                {msg.generatedHtml && (
                  <div className="chat-notes-container">
                    <div className="chat-notes-header">
                      <span>&#128218; Generated Notes</span>
                      <button
                        onClick={() => downloadNotesHtml(msg.generatedHtml, msg.notesMeta)}
                        className="chat-notes-download"
                      >
                        &#11015; Download HTML
                      </button>
                    </div>
                    <div
                      className="chat-notes-content"
                      dangerouslySetInnerHTML={{ __html: msg.generatedHtml }}
                    />
                  </div>
                )}

                {msg.action && (
                  <button
                    onClick={() => handleAction(msg.action)}
                    className="chat-action-btn"
                  >
                    &#9889; {msg.action.type === "notes"
                      ? "Notes Generate Karo"
                      : msg.action.type === "flashcards"
                        ? "Flashcards Generate Karo"
                        : "YouTube Notes Banao"}
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-msg chat-msg-bot">
                <div className="chat-bubble chat-bubble-bot">
                  <div className="chat-typing">
                    <span /><span /><span />
                  </div>
                  {loadingStatus && (
                    <p className="text-xs text-slate-400 mt-1">{loadingStatus}</p>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="chat-quick-actions">
              {QUICK_ACTIONS.map((qa, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(qa.text)}
                  className="chat-quick-btn"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Kuch bhi poocho..."
              className="chat-input"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="chat-send-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
