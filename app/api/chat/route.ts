import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      prompt,
      fileBase64,
      fileMimeType,
    } = body;

    // -----------------------------------------
    // Check API Key
    // -----------------------------------------
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // Validate prompt/file
    // -----------------------------------------
    if (!prompt && !fileBase64) {
      return NextResponse.json(
        {
          error: "Prompt or file is required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // Initialize Gemini
    // -----------------------------------------
    const ai = new GoogleGenAI({
      apiKey,
    });

    // -----------------------------------------
    // Prepare multimodal parts
    // -----------------------------------------
    const parts: any[] = [];

    // File
    if (fileBase64 && fileMimeType) {
      parts.push({
        inlineData: {
          data: fileBase64,
          mimeType: fileMimeType,
        },
      });
    }

    // Text prompt
    parts.push({
      text:
        prompt ||
        "Please analyze the attached file and provide a clear, useful summary of its contents.",
    });

    // -----------------------------------------
    // Generate response
    // -----------------------------------------
    const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts,
        },
      ],
    });

    // -----------------------------------------
    // Extract response
    // -----------------------------------------
    const result = response.text;

    if (!result) {
      return NextResponse.json(
        {
          error: "Gemini returned an empty response.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result,
      model: "gemini-2.5-flash",
    });
  } catch (error: any) {
    console.error("Gemini API Error Details:", error);

    // -----------------------------------------
    // Better error messages
    // -----------------------------------------
    let errorMessage = "Failed to generate response.";

    if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}