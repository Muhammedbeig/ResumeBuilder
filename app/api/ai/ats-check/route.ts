import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { requirePaidAiAccess } from "@/lib/ai-access";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require("pdf2json");

export async function POST(req: NextRequest) {
  const access = await requirePaidAiAccess();
  if (access) return access;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";
    
    if (file.type === "application/pdf") {
      const pdfParser = new PDFParser(null, 1); // 1 = text only

      text = await new Promise((resolve, reject) => {
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
          // Check if it's raw text or JSON
          // When constructor second arg is 1, it emits text content in `pdfParser_dataReady`?
          // Actually, looking at docs/examples, getRawTextContent() is simpler if available, 
          // or we parse the JSON.
          // Let's assume standard behavior: dataReady returns the data.
          // If we pass 1 to constructor, it should be text.
          
          // Re-checking standard usage:
          // For text extraction:
          const rawText = pdfParser.getRawTextContent();
          resolve(rawText);
        });

        pdfParser.parseBuffer(buffer);
      });
    } else {
      // Fallback for plain text
      text = buffer.toString("utf-8");
    }

    if (!text || !text.trim()) {
       // If empty, try to see if JSON content has text
       // But for now return error
       if (!text) return NextResponse.json({ error: "Could not extract text from file (empty)" }, { status: 400 });
    }

    const model = await getGeminiModel();
    
    const prompt = `
      You are an expert ATS (Applicant Tracking System) scanner and professional resume reviewer. 
      Analyze the following resume text extracted from a document. 
      
      Provide a detailed ATS score and analysis in the following strict JSON format:
      {
        "score": number, // Overall score out of 100
        "summary": "string", // A brief executive summary of the resume's quality
        "breakdown": {
          "contact_info": { "score": number, "feedback": ["string"] },
          "professional_summary": { "score": number, "feedback": ["string"] },
          "experience": { "score": number, "feedback": ["string"] },
          "education": { "score": number, "feedback": ["string"] },
          "skills": { "score": number, "feedback": ["string"] }
        },
        "strengths": ["string"], // List of strong points
        "weaknesses": ["string"], // List of areas for improvement
        "missing_keywords": ["string"], // Important industry keywords that seem missing
        "formatting_issues": ["string"] // Potential formatting issues detected from the text structure (e.g. widely spaced characters, unusual symbols)
      }

      Ensure the "score" is realistic and critical. A perfect 100 should be rare.
      
      RESUME TEXT:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // Extract JSON from the response
    const jsonMatch = textResponse.match(/```json([\s\S]*?)```/) || textResponse.match(/```([\s\S]*?)```/);
    let jsonData;
    if (jsonMatch) {
      jsonData = JSON.parse(jsonMatch[1]);
    } else {
      try {
        jsonData = JSON.parse(textResponse);
      } catch (e) {
        // Fallback if strict JSON parsing fails
        console.error("Failed to parse JSON", e);
        return NextResponse.json({ error: "Failed to analyze resume" }, { status: 500 });
      }
    }

    return NextResponse.json(jsonData);

  } catch (error) {
    console.error("Error in ATS check:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

