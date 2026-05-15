import { NextResponse } from "next/server";

const SAMBANOVA_API_URL = "https://api.sambanova.ai/v1/chat/completions";

function buildYouTubeSystemPrompt() {
  return `You are an expert Indian competitive exam preparation assistant. You analyze YouTube video transcripts and create EXTREMELY detailed and comprehensive study notes in Hindi (Hinglish where needed).

IMPORTANT RULES:
1. Extract EVERY SINGLE question discussed in the video
2. For each question, list ALL options (A, B, C, D) if mentioned
3. Explain the correct answer in detail with full explanation
4. Also explain WHY other options are wrong
5. Do NOT skip any question - cover 100% of the content
6. Make notes as LONG as needed - there is NO length limit
7. Cover every single topic mentioned in the video

Output ONLY the HTML body content (no <html>, <head>, or <body> tags). Use proper HTML formatting:
- Use <h1> for main title with emoji
- Use <h2> for section headers with emojis (each subject/topic gets its own section)
- Use <h3> for individual questions
- Use <table> for data/comparisons/options
- Use <ul>/<ol> for lists
- Use <strong> for important terms and correct answers
- Use <mark> for key facts to remember
- Use <blockquote> for important tips/tricks
- Use <div style="background:#f5f5f5;padding:12px;border-left:4px solid #fdd835"> for highlighted sections
- Use <div style="background:#e8f5e9;padding:12px;border-left:4px solid #4caf50"> for correct answers
- Use <div style="background:#ffebee;padding:12px;border-left:4px solid #f44336"> for wrong answer explanations

Structure:
1. 📚 Video Summary - What the video covers
2. 📝 Subject-wise Questions & Notes - Each question with full explanation
3. 🎯 Key Concepts Explained - Important topics explained in detail
4. 🧠 Quick Revision Points - One-liner facts from all questions
5. 📊 Summary Table - All questions with correct answers in a table

Write in Hindi with English terms where appropriate.`;
}

function buildStandardSystemPrompt() {
  return `You are an expert Indian competitive exam preparation assistant. You create comprehensive, detailed study notes in Hindi (Hinglish where needed) for exam preparation.

Your notes should be extremely detailed, covering every important concept, formula, date, fact, and trick.

Output ONLY the HTML body content (no <html>, <head>, or <body> tags). Use proper HTML formatting:
- Use <h1> for main title with emoji
- Use <h2> for section headers with emojis
- Use <h3> for sub-sections
- Use <table> for data/comparisons
- Use <ul>/<ol> for lists
- Use <strong> for important terms
- Use <mark> for key facts to remember
- Use <blockquote> for important tips/tricks
- Use <div style="background:#f5f5f5;padding:12px;border-left:4px solid #fdd835"> for highlighted sections

Include these sections:
1. 📚 Complete Notes - Thorough explanation of ALL topics
2. 🎯 Key Points - Most important facts and figures
3. 📝 PYQ Analysis - Previous Year Questions pattern analysis
4. ⚡ Most Important Questions (90%+ chances) - Questions likely to appear
5. 🧠 Memory Tricks - Mnemonics and easy ways to remember
6. 📊 Important Charts & Tables - Data in tabular format
7. 🔥 One-liner Facts - Quick revision points

Make the notes VERY comprehensive. Cover EVERY important topic thoroughly. Write in Hindi with English terms where appropriate (technical terms, formulas, etc.)`;
}

function cleanHtml(content) {
  let html = content;
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    html = bodyMatch[1];
  }
  return html
    .replace(/```html\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

async function callSambaNova(key, systemPrompt, userPrompt) {
  const response = await fetch(SAMBANOVA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "Meta-Llama-3.3-70B-Instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("SambaNova API error:", errorData);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function splitTranscript(transcript, maxChunkSize = 6000) {
  if (transcript.length <= maxChunkSize) return [transcript];

  const chunks = [];
  const sentences = transcript.split(/(?<=[।.!?])\s+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += sentence + " ";
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [transcript];
}

export async function POST(request) {
  try {
    const { exam, subject, topic, apiKey, youtubeTranscript, videoTitle } =
      await request.json();

    const key = apiKey || process.env.SAMBANOVA_API_KEY;
    if (!key) {
      return NextResponse.json(
        {
          error:
            "SambaNova API key is required. Please provide it in the form or set SAMBANOVA_API_KEY environment variable.",
        },
        { status: 400 }
      );
    }

    if (youtubeTranscript) {
      const systemPrompt = buildYouTubeSystemPrompt();
      const chunks = splitTranscript(youtubeTranscript);
      let allHtml = "";

      for (let i = 0; i < chunks.length; i++) {
        const chunkLabel =
          chunks.length > 1
            ? `(Part ${i + 1} of ${chunks.length})`
            : "";

        const userPrompt = `Analyze this YouTube video transcript and create COMPLETE detailed notes.

Video Title: ${videoTitle || "Exam Analysis Video"}
${exam ? `Exam: ${exam}` : ""}
${chunkLabel}

TRANSCRIPT:
${chunks[i]}

INSTRUCTIONS:
1. Extract EVERY question from this transcript
2. For each question, show ALL options (A, B, C, D)
3. Mark the CORRECT answer clearly
4. Explain WHY it is correct in detail
5. Explain the topic behind each question thoroughly
6. Do NOT skip anything - be 100% comprehensive
7. Make the notes as LONG and DETAILED as needed
8. Cover every single concept mentioned`;

        const content = await callSambaNova(key, systemPrompt, userPrompt);
        allHtml += cleanHtml(content) + "\n";
      }

      return NextResponse.json({ html: allHtml });
    }

    if (!exam) {
      return NextResponse.json(
        { error: "Exam name is required" },
        { status: 400 }
      );
    }

    const topicInfo = topic ? `Specific Topic: ${topic}` : "";
    const subjectInfo = subject !== "All Subjects" ? subject : "all subjects";

    const systemPrompt = buildStandardSystemPrompt();
    const userPrompt = `Create comprehensive study notes for:
Exam: ${exam}
Subject: ${subjectInfo}
${topicInfo}

Analyze the latest ${exam} exam pattern. Focus on:
1. Questions that appeared in the most recent ${exam} exam
2. Most frequently asked topics in ${exam}
3. Subject-wise detailed notes covering every important concept
4. Previous year question analysis with explanations
5. Memory tricks and shortcuts

Make the notes VERY detailed and exam-focused. Cover every topic that has been asked or is likely to be asked in ${exam} exam. Include specific dates, facts, formulas, and explanations.`;

    const content = await callSambaNova(key, systemPrompt, userPrompt);
    const html = cleanHtml(content);

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Generate notes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate notes. Please try again." },
      { status: 500 }
    );
  }
}
