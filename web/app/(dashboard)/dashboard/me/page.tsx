import { getEmployeeDashboardData } from "@/lib/employee";
import { redirect } from "next/navigation";
import { MyCompensationClient } from "./client";

export default async function MyCompensationPage() {
  const data = await getEmployeeDashboardData();

  if (!data) {
    redirect("/login");
  }

  return <MyCompensationClient data={data} />;
}
