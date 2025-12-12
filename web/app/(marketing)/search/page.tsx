import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <div className="rounded-3xl border border-border/80 bg-white px-6 py-8 shadow-sm">
        <div className="flex items-center gap-3 text-brand-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Search />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Search benchmarks</h1>
            <p className="text-sm text-brand-800/80">
              Enter a role and location to preview how results will look.
            </p>
          </div>
        </div>
        <form action="/preview" className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Input name="role" placeholder="e.g., Product Manager in Riyadh" fullWidth />
          <Button type="submit" className="sm:w-36">
            Search
          </Button>
        </form>
        <div className="mt-6 rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-brand-700/80">
          <p>Results will appear here after you run a search.</p>
        </div>
      </div>
    </div>
  );
}

