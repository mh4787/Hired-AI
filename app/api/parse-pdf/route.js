import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse PDF using pdf-parse v1 (CommonJS module - use dynamic require)
    let pdfData;
    try {
      const pdfParse = (await import("pdf-parse")).default;
      pdfData = await pdfParse(buffer);
    } catch (parseError) {
      console.error("PDF parse import/execution error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse PDF. The file may be corrupted or password-protected." },
        { status: 500 }
      );
    }

    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "No text could be extracted from this PDF. It may be a scanned image." },
        { status: 400 }
      );
    }

    // --- Gemini AI Analysis ---
    const apiKey = process.env.GEMINI_API_KEY;
    let aiAnalysis = null;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0,
            topP: 0.95,
            topK: 40,
            responseMimeType: "application/json",
          }
        });

        const prompt = `You are a strict, top-tier ATS Resume Analyzer. Be extremely harsh. Most standard resumes should score between 40-70 initially. Deduct points heavily for generic verbs, missing keywords, and poor formatting.
Analyze this resume and extract its content. Use these strict scoring guidelines: 20 pts contact info, 30 pts skills, 50 pts experience.

CRITICAL INSTRUCTION: You MUST extract the REAL data from the RESUME below. DO NOT copy the dummy values (like "John Doe" or "2020-2022") from the example schema below. Output exact names, dates, and bullets from the text.

Respond ONLY with valid JSON matching this exact structure:
{
  "score": 65,
  "missing_keywords": ["JavaScript", "React"],
  "job_title": "Software Engineer",
  "suggestions": [
    {
      "type": "experience",
      "original_text": "Did some coding.",
      "suggestion": "Developed a full-stack application resulting in a 20% increase in efficiency."
    }
  ],
  "resume_data": {
    "personalInfo": { "name": "John Doe", "email": "john@example.com", "phone": "1234567890", "linkedin": "linkedin.com/in/johndoe" },
    "skills": ["Python", "C++"],
    "experience": [ { "title": "Developer", "company": "Tech Corp", "date": "2020-2022", "description": ["Built scalable APIs."] } ],
    "education": [ { "degree": "BS Computer Science", "school": "University", "date": "2020", "location": "NY" } ],
    "projects": [ { "name": "AI Bot", "date": "2021", "description": ["Integrated LLMs into a chatbot."] } ],
    "extracurricular": ["Hackathon Winner"],
    "certificates": ["AWS Certified"]
  }
}

RESUME:
${extractedText.substring(0, 5000)}`;

        let result;
        let retries = 3;
        let delay = 1000;
        for (let i = 0; i < retries; i++) {
          try {
            result = await model.generateContent(prompt);
            break;
          } catch (error) {
            if (i === retries - 1) throw error;
            const isRateLimitOrUnavailable = error.status === 429 || error.status === 503 || 
              (error.message && (error.message.includes("429") || error.message.includes("503") || error.message.includes("Service Unavailable")));
            if (isRateLimitOrUnavailable) {
              console.log(`Gemini API overloaded. Retrying ${i + 1} after ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2;
            } else {
              throw error;
            }
          }
        }
        const responseText = result.response.text();

        let cleanJson = responseText.trim();
        const fence = '```';
        if (cleanJson.startsWith(fence)) {
          cleanJson = cleanJson.slice(cleanJson.indexOf('\n') + 1);
          if (cleanJson.endsWith(fence)) {
            cleanJson = cleanJson.slice(0, cleanJson.lastIndexOf(fence));
          }
          cleanJson = cleanJson.trim();
        }

        aiAnalysis = JSON.parse(cleanJson);

        // Make score a number if it came back as a string
        if (typeof aiAnalysis.score === "string") {
          aiAnalysis.score = parseInt(aiAnalysis.score, 10);
        }

        // Validate the structure safely
        if (!aiAnalysis || typeof aiAnalysis.score !== "number" || isNaN(aiAnalysis.score)) {
          throw new Error("Invalid AI response structure");
        }

        // Ensure defaults for arrays to prevent UI crashes
        aiAnalysis.missing_keywords = Array.isArray(aiAnalysis.missing_keywords) ? aiAnalysis.missing_keywords : [];
        aiAnalysis.job_title = typeof aiAnalysis.job_title === "string" ? aiAnalysis.job_title : "Analyst";
        aiAnalysis.suggestions = Array.isArray(aiAnalysis.suggestions) ? aiAnalysis.suggestions : [];
        aiAnalysis.resume_data = aiAnalysis.resume_data || {};

        // Clamp score
        aiAnalysis.score = Math.max(0, Math.min(100, Math.round(aiAnalysis.score)));
      } catch (aiError) {
        console.error("Gemini AI error:", aiError);
        if (aiError.status === 429 || (aiError.message && aiError.message.includes("429"))) {
          return NextResponse.json(
            { error: "Server busy. API rate limit exceeded." },
            { status: 429 }
          );
        } else if (aiError.status === 503 || (aiError.message && aiError.message.includes("503"))) {
          aiAnalysis = {
            error: "The AI service is currently experiencing high demand. Please try again in a few moments.",
          };
        } else {
          aiAnalysis = {
            error: "AI analysis failed. The text was extracted successfully.",
          };
        }
      }
    } else {
      aiAnalysis = {
        error: "Gemini API key not configured. Add GEMINI_API_KEY to .env.local",
      };
    }

    return NextResponse.json({
      text: extractedText,
      pages: pdfData.numpages,
      info: pdfData.info,
      analysis: aiAnalysis,
    });
  } catch (error) {
    console.error("PDF parsing error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to process the file. Please make sure it is a valid PDF.",
      },
      { status: 500 }
    );
  }
}
