"use server";

import { auth } from "@/auth";
import { getDashboardData } from "@/lib/dashboard/utils";
import type { DashboardData } from "@/lib/dashboard/types";

export async function getDashboardDataAction(): Promise<DashboardData | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  try {
    return await getDashboardData(session.user.email);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
}
