export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateAndSaveGapAnalysis } from "@/lib/gap-analysis/generate-gap-analysis";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { setupProfileId } = body as { setupProfileId?: string };

  if (!setupProfileId) {
    return NextResponse.json({ error: "setupProfileId is required" }, { status: 400 });
  }

  // Verify the setup profile belongs to the requesting user
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const setup = await prisma.setupProfile.findFirst({
    where: { id: setupProfileId, userId: dbUser.id },
    select: { id: true },
  });

  if (!setup) {
    return NextResponse.json({ error: "Setup profile not found" }, { status: 404 });
  }

  const result = await generateAndSaveGapAnalysis(setupProfileId);

  if (!result) {
    return NextResponse.json({ error: "Failed to generate gap analysis" }, { status: 500 });
  }

  return NextResponse.json(result, { status: 200 });
}
