import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, fileBase64, fileMimeType } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const parts: any[] = [];
    if (fileBase64 && fileMimeType) {
      parts.push({ inlineData: { data: fileBase64, mimeType: fileMimeType } });
    }
    parts.push({ text: prompt });

    // استفاده از متد استاندارد و پایدار generateContent برای محیط ابری
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: parts,
    });

    return new Response(JSON.stringify({ result: response.text }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("API error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}