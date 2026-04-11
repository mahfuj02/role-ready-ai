import { NextResponse } from "next/server";
import { getGeminiClient, getGeminiModel } from "@/lib/ai/gemini-client";

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = getGeminiModel();

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured", status: "ERROR" },
        { status: 400 }
      );
    }

    const client = getGeminiClient();

    if (!client) {
      return NextResponse.json(
        { error: "Failed to initialize Gemini client", status: "ERROR" },
        { status: 400 }
      );
    }

    // Test simple prompt
    const response = await client.models.generateContent({
      model,
      contents: "Say 'Gemini is working' in JSON format: {\"message\": \"...\"}",
    });

    const text = response.text ?? "";

    return NextResponse.json({
      status: "SUCCESS",
      model,
      message: text,
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";

    return NextResponse.json(
      {
        status: "ERROR",
        error: errorMessage,
        stack: errorStack,
        apiKey: process.env.GEMINI_API_KEY ? "exists" : "missing",
      },
      { status: 500 }
    );
  }
}
