"use client";

import { Sparkles, Plus, ArrowRight, Layers, FileSignature, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CustomBuilderWidget() {
  return (
    <div className="flex h-full flex-col justify-between p-2">
      <div>
        <div className="flex items-center gap-2 text-brand-600">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-black uppercase tracking-widest">Custom builder</span>
        </div>
        <h3 className="mt-4 text-xl font-bold text-brand-900 leading-tight">
          Assemble a bespoke report in minutes.
        </h3>
        <p className="mt-2 text-[13px] text-accent-600 leading-relaxed">
          Mix benchmarks, compliance checks, and executive summaries into a single narrative. Save layouts for recurring board packs.
        </p>
        
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-brand-800">Drag-and-drop blocks</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileSignature className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-brand-800">Collaboration notes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Share2 className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-brand-800">Direct stakeholder sharing</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <Button className="h-11 justify-center gap-2 font-black uppercase tracking-widest text-xs">
          <Plus className="h-4 w-4" />
          Start custom report
        </Button>
        <button className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black uppercase tracking-widest text-brand-600 hover:bg-brand-50 transition-colors">
          Learn more
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
