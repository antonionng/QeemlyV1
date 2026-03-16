import { redirect } from "next/navigation";

type PersonDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PersonDetailPage({ params }: PersonDetailPageProps) {
  const { id } = await params;
  redirect(`/dashboard/people?employeeId=${encodeURIComponent(id)}`);
}
