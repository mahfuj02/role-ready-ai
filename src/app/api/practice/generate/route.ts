export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPracticeSessionFromLatestSetup } from "@/lib/practice/create-practice-session";

export async function POST() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await createPracticeSessionFromLatestSetup(session.user.email);

  if (!result) {
    return NextResponse.json(
      { error: "No setup found. Save setup data first." },
      { status: 404 },
    );
  }

  return NextResponse.json(result, { status: 201 });
}
