import { getEmployeeDashboardData } from "@/lib/employee";
import { redirect } from "next/navigation";
import { HistoryClient } from "./client";

export default async function MyHistoryPage() {
  const data = await getEmployeeDashboardData();

  if (!data) {
    redirect("/login");
  }

  return <HistoryClient data={data} />;
}
