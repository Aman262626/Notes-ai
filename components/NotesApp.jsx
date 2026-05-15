"use client";

import { useState, useRef, useCallback } from "react";
import ChatBot from "./ChatBot";

const EXAMS = [
  "RRB NTPC",
  "SSC CGL",
  "SSC CHSL",
  "SSC MTS",
  "RRB Group D",
  "UPSC CSE",
  "UPSC CAPF",
  "State PSC",
  "CTET",
  "NDA",
  "CDS",
  "Banking (IBPS PO)",
  "Banking (IBPS Clerk)",
  "Banking (SBI PO)",
  "RBI Grade B",
  "Custom",
];

const SUBJECTS = [
  "General Knowledge (GK)",
  "History",
  "Geography",
  "Polity",
  "Economics",
  "Science (Physics)",
  "Science (Chemistry)",
  "Science (Biology)",
  "Mathematics",
  "Reasoning",
  "English",
  "Hindi",
  "Current Affairs",
  "Computer Knowledge",
  "All Subjects",
];

const GRADIENTS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
  "linear-gradient(135deg, #fa709a, #fee140)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #fccb90, #d57eeb)",
  "linear-gradient(135deg, #FF3CAC, #784BA0)",
  "linear-gradient(135deg, #08AEEA, #2AF598)",
  "linear-gradient(135deg, #21D4FD, #B721FF)",
];

export default function NotesApp() {
  const [exam, setExam] = useState("RRB NTPC");
  const [customExam, setCustomExam] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [topic, setTopic] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState("notes");
  const [inputMode, setInputMode] = useState("exam");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [notesHtml, setNotesHtml] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [youtubeLinks, setYoutubeLinks] = useState([]);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState("");
  const [flippedCards, setFlippedCards] = useState({});
  const notesRef = useRef(null);

  const selectedExam = exam === "Custom" ? customExam : exam;

  const handleChatAction = useCallback((action) => {
    if (action.type === "youtube") {
      setInputMode("youtube");
      return;
    }

    setInputMode("exam");
    if (action.exam) {
      const matchedExam = EXAMS.find(
        (e) => e.toLowerCase() === action.exam.toLowerCase()
      );
      if (matchedExam) {
        setExam(matchedExam);
      } else {
        setExam("Custom");
        setCustomExam(action.exam);
      }
    }
    if (action.subject) {
      const matchedSubject = SUBJECTS.find(
        (s) => s.toLowerCase().includes(action.subject.toLowerCase())
      );
      if (matchedSubject) setSubject(matchedSubject);
    }
    if (action.topic) setTopic(action.topic);
    setMode(action.type === "flashcards" ? "flashcards" : "notes");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const generateFromYouTube = async () => {
    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube video URL");
      return;
    }

    setLoading(true);
    setError("");
    setNotesHtml("");
    setFlashcards([]);
    setVideoInfo(null);
    setLoadingStatus("Extracting video transcript...");

    try {
      const extractRes = await fetch("/api/extract-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      });

      const extractData = await extractRes.json();

      if (!extractRes.ok) {
        throw new Error(extractData.error || "Failed to extract video data");
      }

      const hasTranscript = !extractData.noTranscript && extractData.transcript;

      setVideoInfo({
        title: extractData.title,
        author: extractData.author,
        transcriptLength: hasTranscript ? extractData.transcriptLength : 0,
        noTranscript: extractData.noTranscript || false,
      });

      if (hasTranscript) {
        setLoadingStatus(
          `Transcript extracted (${Math.round(extractData.transcriptLength / 1000)}K chars). Generating comprehensive notes...`
        );
      } else {
        setLoadingStatus(
          "Transcript not available. Generating notes from video title & description..."
        );
      }

      const notesBody = {
        videoTitle: extractData.title,
        exam: selectedExam || "",
        apiKey: apiKey || undefined,
      };

      if (hasTranscript) {
        notesBody.youtubeTranscript = extractData.transcript;
      } else {
        notesBody.videoDescription = extractData.description || extractData.title || "";
      }

      const notesRes = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notesBody),
      });

      const notesData = await notesRes.json();

      if (!notesRes.ok) {
        throw new Error(notesData.error || "Failed to generate notes");
      }

      setNotesHtml(notesData.html || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const generateNotes = async () => {
    if (inputMode === "youtube") {
      return generateFromYouTube();
    }

    if (!selectedExam) {
      setError("Please select or enter an exam name");
      return;
    }

    setLoading(true);
    setError("");
    setNotesHtml("");
    setFlashcards([]);
    setLoadingStatus("Generating notes...");

    const ytQuery = `${selectedExam} exam analysis latest questions ${subject !== "All Subjects" ? subject : ""}`;
    setYoutubeLinks([
      {
        title: `${selectedExam} Latest Exam Analysis`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery + " analysis 2025")}`,
      },
      {
        title: `${selectedExam} Previous Year Questions`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery + " PYQ solved")}`,
      },
      {
        title: `${selectedExam} ${subject} Important Topics`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery + " important topics preparation")}`,
      },
    ]);

    try {
      const endpoint =
        mode === "flashcards"
          ? "/api/generate-flashcards"
          : "/api/generate-notes";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: selectedExam,
          subject,
          topic,
          apiKey: apiKey || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate content");
      }

      if (mode === "flashcards") {
        setFlashcards(data.flashcards || []);
      } else {
        setNotesHtml(data.html || "");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const downloadHtml = () => {
    const title =
      inputMode === "youtube" && videoInfo
        ? videoInfo.title || "YouTube Video Notes"
        : `${selectedExam} - ${subject}${topic ? " - " + topic : ""} Notes`;

    const fullHtml = `<!DOCTYPE html>
<html lang="hi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=Caveat:wght@400;600;700&display=swap" rel="stylesheet">
<title>Notes \u2014 ${title}</title>
<style>
  :root{--red:#e53e3e;--green:#38a169;--blue:#3182ce;--orange:#dd6b20;--purple:#805ad5;--pink:#d53f8c;--yellow:#d69e2e}
  body{font-family:'Kalam','Caveat',cursive,system-ui,sans-serif;margin:0;padding:24px 32px;background:#fffdf7;background-image:linear-gradient(#e8e4dd 1px,transparent 1px);background-size:100% 32px;color:#2d3748;line-height:2;font-size:1.05rem}
  h1{font-family:'Caveat',cursive;color:#1a202c;font-size:2.2em;margin:20px 0 12px;padding:10px 16px;background:linear-gradient(135deg,#667eea22,#764ba222);border-radius:12px;border-left:6px solid #667eea;position:relative}
  h1::after{content:'';position:absolute;bottom:0;left:16px;right:16px;height:3px;background:linear-gradient(90deg,#667eea,#764ba2,#f093fb);border-radius:2px}
  h2{font-family:'Caveat',cursive;font-size:1.6em;margin:28px 0 10px;padding:8px 14px;color:#fff;border-radius:10px;position:relative}
  h2:nth-of-type(6n+1){background:linear-gradient(135deg,#667eea,#764ba2)}
  h2:nth-of-type(6n+2){background:linear-gradient(135deg,#f093fb,#f5576c)}
  h2:nth-of-type(6n+3){background:linear-gradient(135deg,#4facfe,#00f2fe)}
  h2:nth-of-type(6n+4){background:linear-gradient(135deg,#43e97b,#38f9d7)}
  h2:nth-of-type(6n+5){background:linear-gradient(135deg,#fa709a,#fee140)}
  h2:nth-of-type(6n+6){background:linear-gradient(135deg,#a18cd1,#fbc2eb)}
  h3{font-family:'Caveat',cursive;color:#2d3748;font-size:1.3em;margin:20px 0 8px;padding-bottom:4px;border-bottom:2px dashed #cbd5e0}
  ul,ol{padding-left:22px;margin:8px 0}
  li{margin:6px 0;position:relative}
  ul li::marker{color:var(--purple);font-size:1.2em}
  ol li::marker{color:var(--blue);font-weight:700}
  table{border-collapse:separate;border-spacing:0;width:100%;margin:16px 0;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)}
  th{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:12px 16px;font-size:0.95em;text-align:left;font-weight:700}
  td{padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:0.95em}
  tr:nth-child(even){background:#f0ebff}
  tr:nth-child(odd){background:#fff}
  tr:hover{background:#e9e0ff;transition:background 0.2s}
  blockquote{border-left:5px solid var(--purple);padding:14px 18px;background:linear-gradient(135deg,#faf5ff,#f3e8ff);margin:16px 0;border-radius:0 12px 12px 0;font-style:italic;position:relative}
  blockquote::before{content:'\\201C';font-size:3em;color:#805ad544;position:absolute;top:-8px;left:8px;font-family:serif}
  strong{color:#1a202c;background:linear-gradient(transparent 60%,#fef08a 60%);padding:0 2px}
  mark{background:linear-gradient(135deg,#fef08a,#fbbf24);padding:2px 8px;border-radius:6px;font-weight:600;color:#744210;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
  .underline-imp{text-decoration:underline wavy var(--red);text-underline-offset:4px;font-weight:600}
  .important-box{background:linear-gradient(135deg,#fff5f5,#fee2e2);border:2px solid #fc8181;border-left:6px solid var(--red);border-radius:12px;padding:16px 20px;margin:16px 0;position:relative}
  .important-box::before{content:'\\2757 Important';font-family:'Caveat',cursive;font-size:0.85em;font-weight:700;color:var(--red);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
  .tip-box{background:linear-gradient(135deg,#f0fff4,#c6f6d5);border:2px solid #68d391;border-left:6px solid var(--green);border-radius:12px;padding:16px 20px;margin:16px 0;position:relative}
  .tip-box::before{content:'\\1F4A1 Tip / Trick';font-family:'Caveat',cursive;font-size:0.85em;font-weight:700;color:var(--green);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
  .warning-box{background:linear-gradient(135deg,#fffaf0,#feebc8);border:2px solid #f6ad55;border-left:6px solid var(--orange);border-radius:12px;padding:16px 20px;margin:16px 0;position:relative}
  .warning-box::before{content:'\\26A0\\FE0F Warning';font-family:'Caveat',cursive;font-size:0.85em;font-weight:700;color:var(--orange);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
  .formula-box{background:linear-gradient(135deg,#ebf8ff,#bee3f8);border:2px solid #63b3ed;border-left:6px solid var(--blue);border-radius:12px;padding:16px 20px;margin:16px 0;font-family:'Kalam',cursive}
  .formula-box::before{content:'\\1F4D0 Formula';font-family:'Caveat',cursive;font-size:0.85em;font-weight:700;color:var(--blue);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
  .remember-box{background:linear-gradient(135deg,#faf5ff,#e9d8fd);border:2px solid #b794f4;border-left:6px solid var(--purple);border-radius:12px;padding:16px 20px;margin:16px 0}
  .remember-box::before{content:'\\1F9E0 Remember';font-family:'Caveat',cursive;font-size:0.85em;font-weight:700;color:var(--purple);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
  p{margin:8px 0;line-height:2}
  @media print{body{padding:10px;background-image:none;font-size:0.9rem}}
  @media(max-width:600px){body{padding:12px 14px;font-size:0.95rem}h1{font-size:1.6em}h2{font-size:1.3em}}
</style></head><body>
${notesHtml}
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

  const downloadFlashcardsHtml = () => {
    const title = `${selectedExam} - ${subject} Flashcards`;

    const cardsHtml = flashcards
      .map((card, i) => {
        const grad = GRADIENTS[i % GRADIENTS.length];
        return `<div class="card" onclick="this.classList.toggle('flipped')" style="--grad:${grad}">
        <div class="card-inner">
          <div class="card-front"><span class="label">Q${i + 1}</span><p>${card.question}</p><span class="meta">${card.subject || subject} \u00b7 ${card.difficulty || "medium"}</span></div>
          <div class="card-back"><span class="label">ANSWER</span><p>${card.answer}</p></div>
        </div>
      </div>`;
      })
      .join("\n");

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Flashcards - ${title}</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#050816;padding:20px;min-height:100vh}
h1{color:#fff;text-align:center;margin-bottom:24px;font-size:1.5em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;max-width:1200px;margin:0 auto}
.card{perspective:1000px;height:220px;cursor:pointer}
.card-inner{position:relative;width:100%;height:100%;transition:transform 0.6s;transform-style:preserve-3d}
.card.flipped .card-inner{transform:rotateY(180deg)}
.card-front,.card-back{position:absolute;inset:0;backface-visibility:hidden;border-radius:16px;padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff}
.card-front{background:var(--grad)}
.card-back{background:var(--grad);transform:rotateY(180deg);filter:brightness(1.15)}
.label{font-size:11px;font-weight:700;opacity:0.7;letter-spacing:1px;margin-bottom:8px}
p{font-size:15px;line-height:1.5}
.meta{font-size:11px;opacity:0.6;margin-top:auto;padding-top:8px}
</style></head><body>
<h1>Flashcards (${flashcards.length})</h1>
<p style="color:#94a3b8;text-align:center;margin-bottom:20px;font-size:14px">Click to flip</p>
<div class="grid">${cardsHtml}</div>
<script>document.querySelectorAll('.card').forEach(c=>c.addEventListener('click',()=>c.classList.toggle('flipped')))</script>
</body></html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flashcards-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFlashcard = (index) => {
    setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="min-h-screen bg-grid relative">
      {/* Background glow */}
      <div className="bg-glow" />

      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto">
        {/* Hero Header */}
        <header className="text-center pt-8 pb-10 slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            AI-Powered Exam Preparation
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold gradient-text leading-tight">
            AI Notes Maker
          </h1>
          <p className="text-slate-400 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
            YouTube video ya exam select karo &mdash; AI tumhare liye
            comprehensive notes, flashcards aur PYQ analysis generate karega
          </p>
        </header>

        {/* API Key */}
        <div className="glass-card p-5 mb-5 slide-up">
          <div className="section-label">API Configuration</div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="SambaNova API Key (or set SAMBANOVA_API_KEY env var)"
            className="input-glow"
          />
        </div>

        {/* Input Mode Toggle */}
        <div className="flex gap-3 mb-5 slide-up">
          <button
            onClick={() => setInputMode("exam")}
            className={`tab-btn ${inputMode === "exam" ? "tab-active" : "tab-inactive"}`}
          >
            <span className="mr-2">&#128218;</span>
            Exam &amp; Subject
          </button>
          <button
            onClick={() => setInputMode("youtube")}
            className={`tab-btn ${inputMode === "youtube" ? "tab-active-red" : "tab-inactive"}`}
          >
            <span className="mr-2">&#9654;&#65039;</span>
            YouTube Video
          </button>
        </div>

        {/* YouTube Input */}
        {inputMode === "youtube" && (
          <div className="glass-card p-6 mb-5 slide-up" style={{ borderColor: 'rgba(220, 38, 38, 0.15)' }}>
            <div className="section-label">YouTube Video URL</div>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... ya https://youtu.be/..."
              className="input-glow mb-4"
              style={{ borderColor: youtubeUrl ? 'rgba(220, 38, 38, 0.3)' : undefined }}
            />

            <p className="text-slate-500 text-sm mb-5 leading-relaxed">
              Video ka transcript extract karke AI se detailed notes generate
              honge &mdash; sabhi questions, options aur explanations cover honge
            </p>

            <div className="mb-5">
              <div className="section-label">Related Exam (Optional)</div>
              <select
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="select-glow"
              >
                <option value="">-- Select Exam --</option>
                {EXAMS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generateFromYouTube}
              disabled={loading}
              className={`btn-youtube ${loading ? "generating" : ""}`}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  {loadingStatus || "Processing..."}
                </>
              ) : (
                "Extract & Generate Notes from Video"
              )}
            </button>
          </div>
        )}

        {/* Exam & Subject Input */}
        {inputMode === "exam" && (
          <div className="glass-card p-6 mb-5 slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="section-label">Exam</div>
                <select
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="select-glow"
                >
                  {EXAMS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
                {exam === "Custom" && (
                  <input
                    type="text"
                    value={customExam}
                    onChange={(e) => setCustomExam(e.target.value)}
                    placeholder="Enter exam name..."
                    className="input-glow mt-2"
                  />
                )}
              </div>
              <div>
                <div className="section-label">Subject</div>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="select-glow"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-5">
              <div className="section-label">Specific Topic (Optional)</div>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Mughal Empire, Trigonometry, Indian Constitution..."
                className="input-glow"
              />
            </div>

            {/* Mode Selection */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setMode("notes")}
                className={`mode-pill ${mode === "notes" ? "mode-active-indigo" : "mode-inactive"}`}
              >
                &#128221; Notes
              </button>
              <button
                onClick={() => setMode("flashcards")}
                className={`mode-pill ${mode === "flashcards" ? "mode-active-purple" : "mode-inactive"}`}
              >
                &#127183; Flashcards
              </button>
            </div>

            <button
              onClick={generateNotes}
              disabled={loading}
              className={`btn-primary ${loading ? "generating" : ""}`}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  {loadingStatus || "Generating... Please wait"}
                </>
              ) : mode === "flashcards" ? (
                "Generate Flashcards"
              ) : (
                "Generate Notes"
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-card mb-5 slide-up">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Video Info Badge */}
        {videoInfo && (
          <div className="video-badge mb-5 slide-up">
            <div className="flex items-start gap-3">
              <span className="text-emerald-400 text-xl mt-0.5">&#10003;</span>
              <div>
                <p className="text-white font-semibold text-sm">{videoInfo.title}</p>
                <p className="text-slate-400 text-xs mt-1">
                  {videoInfo.author}
                  {videoInfo.noTranscript ? (
                    <> &middot; <span className="text-yellow-400">Transcript unavailable &mdash; notes generated from video info</span></>
                  ) : (
                    <> &middot; Transcript:{" "}
                    {Math.round(videoInfo.transcriptLength / 1000)}K characters extracted</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* YouTube Reference Links */}
        {youtubeLinks.length > 0 && inputMode === "exam" && (
          <div className="glass-card p-5 mb-5 slide-up">
            <div className="section-label mb-3">YouTube References</div>
            <div className="space-y-2">
              {youtubeLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yt-link"
                >
                  <span className="text-red-500 text-lg">&#9654;</span>
                  <span className="text-slate-300 text-sm flex-1">
                    {link.title}
                  </span>
                  <span className="text-slate-600 text-xs">
                    YouTube &rarr;
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Notes Viewer */}
        {notesHtml && (
          <div className="slide-up">
            <div className="flex gap-3 mb-4">
              <button onClick={downloadHtml} className="btn-download">
                &#11015; Download HTML Notes
              </button>
              {inputMode === "exam" && (
                <button
                  onClick={() => {
                    setMode("flashcards");
                    generateNotes();
                  }}
                  className="btn-download"
                  style={{
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    color: '#c4b5fd',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1))',
                  }}
                >
                  &#127183; Generate Flashcards Too
                </button>
              )}
            </div>
            <div
              ref={notesRef}
              className="notes-content"
              dangerouslySetInnerHTML={{ __html: notesHtml }}
            />
          </div>
        )}

        {/* Flashcards Viewer */}
        {flashcards.length > 0 && (
          <div className="slide-up">
            <div className="flex gap-3 mb-5">
              <button onClick={downloadFlashcardsHtml} className="btn-download">
                &#11015; Download Flashcards HTML
              </button>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 text-center">
              Flashcards ({flashcards.length})
            </h3>
            <p className="text-slate-500 text-center mb-5 text-sm">
              Click to flip
            </p>
            <div className="flashcard-grid">
              {flashcards.map((card, i) => (
                <div
                  key={i}
                  className={`flashcard ${flippedCards[i] ? "flipped" : ""}`}
                  onClick={() => toggleFlashcard(i)}
                >
                  <div className="flashcard-inner">
                    <div
                      className="flashcard-front"
                      style={{
                        background: GRADIENTS[i % GRADIENTS.length],
                      }}
                    >
                      <span className="text-xs font-bold opacity-60 tracking-widest mb-2">
                        Q{i + 1}
                      </span>
                      <p className="text-sm leading-relaxed">{card.question}</p>
                      <span className="text-xs opacity-50 mt-auto pt-2">
                        {card.subject || subject} &middot;{" "}
                        {card.difficulty || "medium"}
                      </span>
                    </div>
                    <div
                      className="flashcard-back"
                      style={{
                        background: GRADIENTS[i % GRADIENTS.length],
                        filter: "brightness(1.1)",
                      }}
                    >
                      <span className="text-xs font-bold opacity-60 tracking-widest mb-2">
                        ANSWER
                      </span>
                      <p className="text-sm leading-relaxed">{card.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-16 pb-10">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mx-auto mb-6" />
          <p className="text-slate-600 text-sm">
            AI Notes Maker &mdash; Powered by SambaNova AI
          </p>
        </footer>
      </div>

      {/* AI Helper Chatbot */}
      <ChatBot
        apiKey={apiKey}
        onAction={handleChatAction}
      />
    </div>
  );
}
