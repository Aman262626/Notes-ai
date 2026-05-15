import { NextResponse } from "next/server";

const SAMBANOVA_API_URL = "https://api.sambanova.ai/v1/chat/completions";

export async function POST(request) {
  try {
    const { exam, subject, topic, apiKey } = await request.json();

    const key = apiKey || process.env.SAMBANOVA_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "SambaNova API key is required. Please provide it in the form or set SAMBANOVA_API_KEY environment variable." },
        { status: 400 }
      );
    }

    if (!exam) {
      return NextResponse.json(
        { error: "Exam name is required" },
        { status: 400 }
      );
    }

    const topicInfo = topic ? `Specific Topic: ${topic}` : "";
    const subjectInfo = subject !== "All Subjects" ? subject : "all subjects";

    const systemPrompt = `You are an expert Indian competitive exam preparation assistant. You create comprehensive, detailed study notes in Hindi (Hinglish where needed) for exam preparation.

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
      return NextResponse.json(
        { error: `AI API error: ${response.status}. Please check your API key.` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let html = content;
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      html = bodyMatch[1];
    }

    html = html
      .replace(/```html\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Generate notes error:", error);
    return NextResponse.json(
      { error: "Failed to generate notes. Please try again." },
      { status: 500 }
    );
  }
}
