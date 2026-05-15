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

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

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

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message, action: data.action },
      ]);
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
