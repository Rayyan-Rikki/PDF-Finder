import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ExtractedQuestion {
  question_text: string;
  answer_text: string;
  question_type: "short" | "multiple_choice" | "true_false";
  explanation?: string;
  source_page?: number;
}

export interface ExtractionResult {
  questions: ExtractedQuestion[];
}

export async function extractQuizFromPDF(pdfBase64: string): Promise<ExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Use gemini-1.5-flash for faster and cost-effective extraction
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `
    Extract all questions and answers from this worksheet PDF.
    You must return a JSON object with a "questions" key containing an array of objects.
    Each object in the "questions" array must have:
    - question_text (string): The full text of the question.
    - answer_text (string): The correct answer. If the answer is not provided in the PDF, try to solve it or provide a placeholder.
    - question_type (string): Use "short", "multiple_choice", or "true_false".
    - explanation (string, optional): A brief explanation of the answer.
    - source_page (number, optional): The page number where the question was found.

    Ensure the output is strictly valid JSON.
  `;

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBase64,
          mimeType: "application/pdf",
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    
    // With responseMimeType: "application/json", Gemini should return clean JSON.
    return JSON.parse(text) as ExtractionResult;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Failed to extract questions from PDF using Gemini");
  }
}
