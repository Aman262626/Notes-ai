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
    const subjectInfo = subject !== "All Subjects" ? subject : "all subjects covering History, Geography, Polity, Science, Math, Economics, Current Affairs";

    const systemPrompt = `You are an expert Indian competitive exam preparation assistant. Create flashcards for exam preparation.

Output ONLY a valid JSON array of flashcard objects. Each object must have:
- "question": the question in Hindi (Hinglish where needed)
- "answer": the answer in Hindi (Hinglish where needed)
- "subject": the subject category
- "difficulty": "easy", "medium", or "hard"

Generate 30-50 flashcards covering the most important questions for the exam.
Focus on questions that are most likely to appear in the exam.
Include a mix of easy, medium, and hard questions.

IMPORTANT: Output ONLY the JSON array, no other text. Example format:
[{"question":"...","answer":"...","subject":"History","difficulty":"medium"}]`;

    const userPrompt = `Create flashcards for:
Exam: ${exam}
Subject: ${subjectInfo}
${topicInfo}

Focus on the most frequently asked questions in ${exam} exam.
Include questions from recent exams and previous year patterns.
Cover all important topics that are likely to appear.`;

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

    let flashcards;
    try {
      let jsonStr = content.trim();

      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      jsonStr = jsonStr
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      flashcards = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse flashcards JSON:", content);
      return NextResponse.json(
        { error: "Failed to parse generated flashcards. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error("Generate flashcards error:", error);
    return NextResponse.json(
      { error: "Failed to generate flashcards. Please try again." },
      { status: 500 }
    );
  }
}
