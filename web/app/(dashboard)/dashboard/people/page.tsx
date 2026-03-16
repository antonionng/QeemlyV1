import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PeoplePageClient } from "./client";

export default function PeoplePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <PeoplePageClient />
    </Suspense>
  );
}
