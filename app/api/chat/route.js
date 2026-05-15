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
7. **YouTube References** - Exam wise YouTube search links milte hain

## Your Job:
1. User ko greet karo aur unhe batao app mein kya-kya features hain
2. User se poocho kya banana chahte hain (notes, flashcards, ya YouTube se notes)
3. Unhe guide karo - kaunsa exam, subject, topic select karein
4. Agar user confuse hai to suggestions do
5. Jab user decide kar le to unhe exact steps batao app mein kaise generate karein
6. Quick tips do exam preparation ke liye

## Response Rules:
- Always respond in Hindi/Hinglish
- Keep responses concise but helpful (3-5 lines mostly)
- Use emojis naturally
- If user asks to generate something, tell them to use the main app (left side) with specific settings
- Be encouraging and motivating for exam preparation
- When suggesting action, use this JSON format at the END of your message (on a new line):
  ACTION:{"type":"notes"|"flashcards"|"youtube","exam":"exam_name","subject":"subject_name","topic":"topic_if_any"}
  Only include ACTION when you're recommending they generate something specific.`;

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

    const response = await fetch(SAMBANOVA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Meta-Llama-3.3-70B-Instruct",
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Chat API error:", errorData);
      return NextResponse.json(
        { error: `AI API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let action = null;
    const actionMatch = content.match(/ACTION:\s*(\{[^}]+\})/);
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
      } catch {
        // ignore parse errors
      }
    }

    const cleanContent = content.replace(/ACTION:\s*\{[^}]+\}/, "").trim();

    return NextResponse.json({ message: cleanContent, action });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Chat failed. Please try again." },
      { status: 500 }
    );
  }
}
