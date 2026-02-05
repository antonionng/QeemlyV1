import { redirect } from "next/navigation";

// Redirect the main dashboard to the Company Overview page
export default function DashboardPage() {
  redirect("/dashboard/overview");
}
