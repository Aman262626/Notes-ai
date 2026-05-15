"use client";

import { useState, useRef } from "react";

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

      setVideoInfo({
        title: extractData.title,
        author: extractData.author,
        transcriptLength: extractData.transcriptLength,
      });

      setLoadingStatus(
        `Transcript extracted (${Math.round(extractData.transcriptLength / 1000)}K chars). Generating comprehensive notes...`
      );

      const notesRes = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeTranscript: extractData.transcript,
          videoTitle: extractData.title,
          exam: selectedExam || "",
          apiKey: apiKey || undefined,
        }),
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
<title>Notes \u2014 ${title}</title>
<style>
  body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:20px 30px;background:#fff;color:#333;line-height:1.8}
  h1{color:#1a237e;border-bottom:3px solid #3949ab;padding-bottom:8px;font-size:1.5em;margin-top:20px}
  h2{color:#1a237e;border-bottom:2px solid #e8eaf6;padding-bottom:6px;font-size:1.25em;margin-top:25px}
  h3{color:#283593;font-size:1.1em;margin-top:20px}
  ul,ol{padding-left:20px} li{margin:4px 0}
  table{border-collapse:collapse;width:100%;margin:15px 0}
  th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}
  th{background:#e8eaf6;font-weight:600;color:#1a237e}
  tr:nth-child(even){background:#f8f9ff}
  code{background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:0.9em;font-family:monospace}
  blockquote{border-left:4px solid #3949ab;padding:10px 15px;background:#f8f9ff;margin:15px 0}
  strong{color:#1a237e}
  mark{background:#fff9c4;padding:2px 4px;border-radius:3px}
  p{margin:8px 0;line-height:1.8}
  @media print{body{padding:10px}}
</style></head><body>
${notesHtml}
<footer style="margin-top:40px;padding-top:15px;border-top:2px solid #e8eaf6;color:#888;font-size:0.85em;text-align:center">
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
body{font-family:system-ui;background:#0f172a;padding:20px;min-height:100vh}
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
    <div className="min-h-screen p-4 md:p-8">
      <header className="text-center mb-8 slide-up">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          AI Notes Maker
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Exam Analysis &amp; Smart Notes Generator
        </p>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* API Key Input */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50 slide-up">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            SambaNova API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API key (or set SAMBANOVA_API_KEY env var)"
            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Input Mode Toggle */}
        <div className="flex gap-3 mb-6 slide-up">
          <button
            onClick={() => setInputMode("exam")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              inputMode === "exam"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-slate-800/50 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
            }`}
          >
            Exam &amp; Subject
          </button>
          <button
            onClick={() => setInputMode("youtube")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              inputMode === "youtube"
                ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                : "bg-slate-800/50 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
            }`}
          >
            YouTube Video Link
          </button>
        </div>

        {/* YouTube URL Input */}
        {inputMode === "youtube" && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-red-500/30 slide-up">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              YouTube Video URL
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            <p className="text-slate-400 text-sm mb-4">
              Video ka transcript extract karke AI se detailed notes generate
              honge. Sabhi questions, options, aur explanations cover honge.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Related Exam (Optional)
              </label>
              <select
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                loading
                  ? "bg-slate-600 cursor-not-allowed generating"
                  : "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
              }`}
            >
              {loading
                ? loadingStatus || "Processing..."
                : "Extract &amp; Generate Notes from Video"}
            </button>
          </div>
        )}

        {/* Exam & Subject Selection */}
        {inputMode === "exam" && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50 slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Exam
                </label>
                <select
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full mt-2 bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Specific Topic (Optional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Mughal Empire, Trigonometry, Indian Constitution..."
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Mode Selection */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setMode("notes")}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  mode === "notes"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setMode("flashcards")}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  mode === "flashcards"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Flashcards
              </button>
            </div>

            <button
              onClick={generateNotes}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                loading
                  ? "bg-slate-600 cursor-not-allowed generating"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
              }`}
            >
              {loading
                ? loadingStatus || "Generating... Please wait"
                : mode === "flashcards"
                  ? "Generate Flashcards"
                  : "Generate Notes"}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-4 mb-6 text-red-300 slide-up">
            {error}
          </div>
        )}

        {/* Video Info */}
        {videoInfo && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-green-500/30 slide-up">
            <div className="flex items-center gap-3">
              <span className="text-green-400 text-xl">&#10003;</span>
              <div>
                <p className="text-white font-medium">{videoInfo.title}</p>
                <p className="text-slate-400 text-sm">
                  {videoInfo.author} &middot; Transcript:{" "}
                  {Math.round(videoInfo.transcriptLength / 1000)}K characters
                </p>
              </div>
            </div>
          </div>
        )}

        {/* YouTube Links */}
        {youtubeLinks.length > 0 && inputMode === "exam" && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/50 slide-up">
            <h3 className="text-lg font-semibold text-white mb-3">
              YouTube References
            </h3>
            <div className="space-y-2">
              {youtubeLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl hover:bg-slate-700/50 transition-colors group"
                >
                  <span className="text-red-500 text-2xl">&#9654;</span>
                  <span className="text-slate-300 group-hover:text-white transition-colors">
                    {link.title}
                  </span>
                  <span className="ml-auto text-slate-500 text-sm">
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
              <button
                onClick={downloadHtml}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20"
              >
                Download HTML Notes
              </button>
              {inputMode === "exam" && (
                <button
                  onClick={() => {
                    setMode("flashcards");
                    generateNotes();
                  }}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20"
                >
                  Generate Flashcards Too
                </button>
              )}
            </div>
            <div
              ref={notesRef}
              className="notes-content bg-white rounded-2xl p-6 md:p-8 text-gray-800 shadow-xl"
              dangerouslySetInnerHTML={{ __html: notesHtml }}
            />
          </div>
        )}

        {/* Flashcards Viewer */}
        {flashcards.length > 0 && (
          <div className="slide-up">
            <div className="flex gap-3 mb-4">
              <button
                onClick={downloadFlashcardsHtml}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20"
              >
                Download Flashcards HTML
              </button>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4 text-center">
              Flashcards ({flashcards.length})
            </h3>
            <p className="text-slate-400 text-center mb-4 text-sm">
              Click to flip
            </p>
            <div className="flashcard-grid">
              {flashcards.map((card, i) => (
                <div
                  key={i}
                  className={`flashcard ${flippedCards[i] ? "flipped" : ""}`}
                  onClick={() => toggleFlashcard(i)}
                  style={{
                    "--grad": GRADIENTS[i % GRADIENTS.length],
                  }}
                >
                  <div className="flashcard-inner">
                    <div
                      className="flashcard-front"
                      style={{
                        background: GRADIENTS[i % GRADIENTS.length],
                      }}
                    >
                      <span className="text-xs font-bold opacity-70 tracking-wider mb-2">
                        Q{i + 1}
                      </span>
                      <p className="text-sm leading-relaxed">{card.question}</p>
                      <span className="text-xs opacity-60 mt-auto pt-2">
                        {card.subject || subject} &middot;{" "}
                        {card.difficulty || "medium"}
                      </span>
                    </div>
                    <div
                      className="flashcard-back"
                      style={{
                        background: GRADIENTS[i % GRADIENTS.length],
                        filter: "brightness(1.15)",
                      }}
                    >
                      <span className="text-xs font-bold opacity-70 tracking-wider mb-2">
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
        <footer className="text-center text-slate-500 text-sm mt-12 pb-8">
          <p>
            AI Notes Maker &mdash; Powered by SambaNova AI
          </p>
          <p className="mt-1">
            Comprehensive exam preparation with AI-generated study material
          </p>
        </footer>
      </div>
    </div>
  );
}
