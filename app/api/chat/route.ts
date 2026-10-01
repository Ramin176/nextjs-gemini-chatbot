import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, fileBase64, fileMimeType } = body;

    if (!prompt) {
      return new Response("Prompt is required", { status: 400 });
    }

    const parts: any[] = [];
    if (fileBase64 && fileMimeType) {
      parts.push({ inlineData: { data: fileBase64, mimeType: fileMimeType } });
    }
    parts.push({ text: prompt });

    // استفاده از متد Stream گوگل
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.0-flash",
      contents: parts,
    });

    // ساخت یک جریان داده (ReadableStream) برای ارسال تک‌تک کلمات به مرورگر
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
    
  } catch (error) {
    console.error("API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}