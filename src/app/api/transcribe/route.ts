import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Groq not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;

  if (!audio) {
    return NextResponse.json({ error: "No audio file" }, { status: 400 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const result = await groq.audio.transcriptions.create({
    file: audio,
    model: "whisper-large-v3",
    response_format: "json",
    language: "en",
  });

  return NextResponse.json({ text: result.text });
}
