"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

export async function updateDisplayName(formData: FormData) {
  const sessionUser = await requireUser();
  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 1 || name.length > 60) {
    redirect("/settings?error=name");
  }

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email! },
    select: { id: true },
  });
  if (!user) redirect("/sign-in");

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  redirect("/settings?success=name");
}

export async function deleteAccount() {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email! },
    select: { id: true },
  });
  if (!user) redirect("/sign-in");

  await prisma.user.delete({ where: { id: user.id } });
  await signOut({ redirectTo: "/" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
