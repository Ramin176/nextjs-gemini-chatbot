import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, fileBase64, fileMimeType } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured on server" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const parts: any[] = [];
    if (fileBase64 && fileMimeType) {
      parts.push({
        inlineData: {
          data: fileBase64,
          mimeType: fileMimeType,
        },
      });
    }
    parts.push({ text: prompt });

  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: parts,
    });

    return NextResponse.json({ result: response.text });
    
  } catch (error: any) {
    console.error("Gemini API Error Details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}