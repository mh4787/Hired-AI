import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const { resumeData } = await request.json();

    if (!resumeData) {
      return NextResponse.json({ error: "No resume data provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      }
    });

    // Convert structured data to text for analysis
    const resumeText = `
Name: ${resumeData.personalInfo?.name || ''}
Summary: ${resumeData.summary || ''}
Skills: ${Array.isArray(resumeData.skills) ? resumeData.skills.join(', ') : resumeData.skills}
Experience: ${resumeData.experience?.map(e => `${e.title} at ${e.company}. ${Array.isArray(e.description) ? e.description.join(' ') : e.description}`).join('\n') || ''}
    `;

    const prompt = `You are a strict ATS Resume Grader.
Analyze the following updated resume text. 
Scoring guidelines: 20 pts contact info, 30 pts skills, 50 pts experience.
Respond ONLY with valid JSON matching this exact structure:
{
  "score": <0-100 number>
}

RESUME:
${resumeText}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const analysis = JSON.parse(cleanJson);

    return NextResponse.json({ score: Math.max(0, Math.min(100, Math.round(analysis.score))) });
  } catch (error) {
    console.error("Rescore error:", error);
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      return NextResponse.json({ error: "Server busy. Please try again." }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to rescore resume." }, { status: 500 });
  }
}
