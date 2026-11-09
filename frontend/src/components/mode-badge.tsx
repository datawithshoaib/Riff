"use client";

import { CircleDot, FlaskConical, TriangleAlert } from "lucide-react";

import { useHealth } from "@/components/health-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ModeBadge({ compact = false }: { compact?: boolean }) {
  const { health, loading, error } = useHealth();

  if (loading && !health) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
        Connecting…
      </span>
    );
  }

  if (error || !health) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-destructive">
            <TriangleAlert className="size-3.5" />
            {compact ? "Offline" : "API offline"}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          {error ?? "Start the FastAPI server on port 8000."}
        </TooltipContent>
      </Tooltip>
    );
  }

  const demo = health.mode === "demo";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] font-medium tracking-wide",
            demo
              ? "border-signal/30 bg-signal-soft text-signal"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
          )}
        >
          {demo ? <FlaskConical className="size-3" /> : <CircleDot className="size-3" />}
          {compact ? (demo ? "Demo" : "Live") : demo ? "Demo mode" : "Live"}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {demo
          ? "Running on sample content. Add GROQ_API_KEY to .env and restart the API for live vision and writing."
          : `Groq is connected · ${health.generation_provider} · v${health.version}`}
      </TooltipContent>
    </Tooltip>
  );
}
