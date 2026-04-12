import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import WordExtractor from "word-extractor";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

function detectExtension(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".doc")) return "doc";
  if (lower.endsWith(".txt")) return "txt";
  return "unsupported";
}

async function extractTextFromDocBuffer(buffer: Buffer) {
  const extractor = new WordExtractor();
  const tempPath = path.join(os.tmpdir(), `roleready-${randomUUID()}.doc`);

  await fs.writeFile(tempPath, buffer);
  try {
    const document = await extractor.extract(tempPath);
    return document.getBody();
  } finally {
    await fs.unlink(tempPath).catch(() => undefined);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File is too large (max 8MB)." }, { status: 400 });
    }

    const extension = detectExtension(file.name);
    if (extension === "unsupported") {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF, DOC, DOCX, or TXT." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";

    if (extension === "pdf") {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (extension === "docx") {
      const parsed = await mammoth.extractRawText({ buffer });
      text = parsed.value;
    } else if (extension === "doc") {
      text = await extractTextFromDocBuffer(buffer);
    } else {
      text = buffer.toString("utf8");
    }

    const normalized = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();

    if (!normalized) {
      return NextResponse.json({ error: "Could not extract readable text." }, { status: 422 });
    }

    return NextResponse.json({ text: normalized });
  } catch (error) {
    console.error("extract-text error:", error);
    return NextResponse.json({ error: "Failed to extract text from file." }, { status: 500 });
  }
}
