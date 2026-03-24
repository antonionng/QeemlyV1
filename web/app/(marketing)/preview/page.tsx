import { redirect } from "next/navigation";

type PreviewPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default function PreviewPage(_props: PreviewPageProps) {
  redirect("/home");
}
