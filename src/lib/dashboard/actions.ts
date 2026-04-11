"use server";

import { auth } from "@/auth";
import { getDashboardData } from "@/lib/dashboard/utils";
import { prisma } from "@/lib/prisma";
import type { DashboardData } from "@/lib/dashboard/types";

export async function getDashboardDataAction(): Promise<DashboardData | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  try {
    // Get current job for user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, currentJobId: true },
    });

    if (!user) {
      return null;
    }

    // If no currentJobId, return empty/default data
    if (!user.currentJobId) {
      return null;
    }

    return await getDashboardData(user.id, user.currentJobId);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
}
