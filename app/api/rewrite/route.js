import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const body = await request.json();
    const { suggestion, resumeContext } = body;

    if (!suggestion || !resumeContext) {
      return NextResponse.json(
        { error: "Suggestion and resume context are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an elite career coach. The user needs help improving their resume based on the following suggestion.

SUGGESTION TO IMPLEMENT:
"${suggestion}"

USER'S CURRENT RESUME CONTEXT:
---
${resumeContext.substring(0, 3000)}
---

Generate exactly ONE perfectly polished, high-impact bullet point (using action verbs and metrics where possible based on the context) that directly implements this suggestion. 
Do NOT include any markdown formatting, bullet symbols, quotes, or conversational text. Just the raw sentence.`;

    const result = await model.generateContent(prompt);
    const rewrittenText = result.response.text().trim().replace(/^[-•*]\s*/, "");

    return NextResponse.json({ rewrittenText });
  } catch (error) {
    console.error("AI Rewrite error:", error);
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      return NextResponse.json(
        { error: "Server busy. Please try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate rewrite. Please try again." },
      { status: 500 }
    );
  }
}
