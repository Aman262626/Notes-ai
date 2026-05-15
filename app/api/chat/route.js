import { NextResponse } from "next/server";

const SAMBANOVA_API_URL = "https://api.sambanova.ai/v1/chat/completions";

const SYSTEM_PROMPT = `You are "NotesAI Helper" - a friendly AI assistant for an Indian competitive exam preparation app called "AI Notes Maker". You speak in Hindi/Hinglish naturally.

## App Features You Know About:
1. **Notes Generation** - Exam aur subject select karke comprehensive study notes generate hote hain (Hindi mein)
2. **Flashcards** - Interactive flip cards with questions & answers
3. **YouTube Video Notes** - YouTube video ka link paste karo, transcript extract hoga aur usse notes ban jayenge
4. **HTML Download** - Notes aur flashcards dono HTML file mein download ho sakte hain
5. **Multiple Exams** - RRB NTPC, SSC CGL, SSC CHSL, SSC MTS, RRB Group D, UPSC, State PSC, CTET, NDA, CDS, Banking exams
6. **Multiple Subjects** - History, Geography, Polity, Economics, Science, Math, Reasoning, English, Hindi, Current Affairs, Computer Knowledge

## Your Job:
1. Jab user koi notes ya content maange (e.g. "NTPC me citizenship ke notes banao", "Mughal Empire explain karo", "Constitution ke articles batao") to TURANT notes generate karo - user ko redirect mat karo.
2. User se poocho kya banana chahte hain agar unclear hai
3. Quick tips do exam preparation ke liye
4. Be helpful and generate content directly when asked

## Response Rules:
- Always respond in Hindi/Hinglish
- Use emojis naturally
- Be encouraging and motivating for exam preparation
- IMPORTANT: When user asks to generate/create/explain any topic, you MUST include GENERATE_NOTES at the END of your message to trigger inline note generation. Format:
  GENERATE_NOTES:{"exam":"exam_name","subject":"subject_name","topic":"specific_topic"}
  Use this whenever user asks for notes, explanation, details, or any study content. The system will generate detailed notes and show them in the chat.
  Keep your text response short (2-3 lines) when using GENERATE_NOTES - just acknowledge what you're generating.
- For general questions/greetings/tips where no content generation is needed, respond normally without GENERATE_NOTES.`;

async function callSambaNova(key, messages, maxTokens = 1024) {
  const response = await fetch(SAMBANOVA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "Meta-Llama-3.3-70B-Instruct",
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
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

function buildNotesPrompt() {
  return `You are an expert Indian competitive exam preparation assistant. You create comprehensive, detailed study notes in Hindi (Hinglish where needed) for exam preparation.

Your notes should be extremely detailed, covering every important concept, formula, date, fact, and trick.

Output ONLY the HTML body content (no <html>, <head>, or <body> tags). Use these special CSS classes for beautiful handwritten-style notes:

IMPORTANT FORMATTING RULES:
- Use <h1> for main title with emoji
- Use <h2> for section headers with emojis
- Use <h3> for sub-sections
- Use <div class="important-box"> for important concepts (red border box)
- Use <div class="tip-box"> for tips and tricks (green box)
- Use <div class="warning-box"> for common mistakes/warnings (orange box)
- Use <div class="formula-box"> for formulas and key data (blue box)
- Use <div class="remember-box"> for must-remember facts (purple box)
- Use <mark> for highlighted key terms
- Use <span class="underline-imp"> for important underlined text
- Use <strong> for bold important terms
- Use <table> for data/comparisons
- Use <ul>/<ol> for lists
- Use <blockquote> for quotes and important statements

Include these sections:
1. Complete Notes - Thorough explanation of ALL topics
2. Key Points - Most important facts and figures (use <div class="important-box">)
3. PYQ Analysis - Previous Year Questions pattern analysis
4. Most Important Questions (90%+ chances) - Questions likely to appear (use <div class="remember-box">)
5. Memory Tricks - Mnemonics and easy ways to remember (use <div class="tip-box">)
6. Important Charts & Tables - Data in tabular format
7. One-liner Facts - Quick revision points
8. Important Formulas (if applicable) - Use <div class="formula-box">

Use <mark> and <span class="underline-imp"> generously to highlight key facts. Put critical facts in <div class="important-box"> and tips in <div class="tip-box">. Use <div class="warning-box"> for common mistakes students make.

Make the notes VERY comprehensive. Cover EVERY important topic thoroughly. Write in Hindi with English terms where appropriate (technical terms, formulas, etc.)`;
}

export async function POST(request) {
  try {
    const { messages, apiKey } = await request.json();

    const key = apiKey || process.env.SAMBANOVA_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "SambaNova API key required" },
        { status: 400 }
      );
    }

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-10),
    ];

    const content = await callSambaNova(key, apiMessages, 1024);

    const generateMatch = content.match(/GENERATE_NOTES:\s*(\{[^}]+\})/);
    const cleanContent = content
      .replace(/GENERATE_NOTES:\s*\{[^}]+\}/, "")
      .trim();

    if (generateMatch) {
      let params;
      try {
        params = JSON.parse(generateMatch[1]);
      } catch {
        return NextResponse.json({ message: cleanContent });
      }

      const { exam, subject, topic } = params;
      const topicInfo = topic ? `Specific Topic: ${topic}` : "";
      const subjectInfo = subject || "all subjects";
      const examName = exam || "Competitive Exam";

      const systemPrompt = buildNotesPrompt();
      const userPrompt = `Create comprehensive study notes for:
Exam: ${examName}
Subject: ${subjectInfo}
${topicInfo}

Analyze the latest ${examName} exam pattern. Focus on:
1. Questions that appeared in the most recent ${examName} exam
2. Most frequently asked topics in ${examName}
3. Subject-wise detailed notes covering every important concept
4. Previous year question analysis with explanations
5. Memory tricks and shortcuts

Make the notes VERY detailed and exam-focused. Cover every topic that has been asked or is likely to be asked in ${examName} exam. Include specific dates, facts, formulas, and explanations.`;

      const notesHtml = await callSambaNova(
        key,
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        8192
      );

      let html = notesHtml;
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) html = bodyMatch[1];
      html = html
        .replace(/```html\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      return NextResponse.json({
        message: cleanContent,
        generatedHtml: html,
        notesMeta: {
          exam: examName,
          subject: subjectInfo,
          topic: topic || "",
        },
      });
    }

    return NextResponse.json({ message: cleanContent });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Chat failed. Please try again." },
      { status: 500 }
    );
  }
}
