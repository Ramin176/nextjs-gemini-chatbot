import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const MODEL = "gemini-3.8-flash";

async function generateWithRetry(
  ai: GoogleGenAI,
  contents: any[],
  maxRetries = 4
) {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
      });

      return response;
    } catch (error: any) {
      lastError = error;

      const message = error?.message || "";
      const isTemporary =
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("high demand");

      // اگر خطا موقتی نیست، دوباره تلاش نکن
      if (!isTemporary || attempt === maxRetries) {
        throw error;
      }

      // 1s → 2s → 4s → 8s
      const delay = Math.pow(2, attempt) * 1000;

      console.log(
        `Gemini temporarily unavailable. Retry ${
          attempt + 1
        }/${maxRetries} in ${delay}ms`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }

  throw lastError;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      prompt,
      fileBase64,
      fileMimeType,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    if (!prompt && !fileBase64) {
      return NextResponse.json(
        {
          error:
            "Prompt or file is required.",
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const parts: any[] = [];

    if (fileBase64 && fileMimeType) {
      parts.push({
        inlineData: {
          data: fileBase64,
          mimeType: fileMimeType,
        },
      });
    }

    parts.push({
      text:
        prompt ||
        "Please analyze the attached document and provide a clear summary.",
    });

    const response = await generateWithRetry(
      ai,
      [
        {
          role: "user",
          parts,
        },
      ]
    );

    const result = response.text;

    if (!result) {
      return NextResponse.json(
        {
          error:
            "Gemini returned an empty response.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result,
      model: MODEL,
    });

  } catch (error: any) {
    console.error(
      "Gemini API Error:",
      error
    );

    const message =
      error?.message ||
      "Failed to generate response.";

    // 503 را به پیام قابل فهم تبدیل کن
    if (
      message.includes("503") ||
      message.includes("UNAVAILABLE") ||
      message.includes("high demand")
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini is temporarily busy. Please try again in a few seconds.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}