import { getEmployeeDashboardData } from "@/lib/employee";
import { redirect } from "next/navigation";
import { ProfileClient } from "./client";

export default async function MyProfilePage() {
  const data = await getEmployeeDashboardData();

  if (!data) {
    redirect("/login");
  }

  return <ProfileClient data={data} />;
}
