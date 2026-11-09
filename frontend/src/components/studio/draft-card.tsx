"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, ShieldCheck, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { copyText } from "@/lib/format";
import type { Draft } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DraftCard({
  draft,
  index,
  style,
}: {
  draft: Draft;
  index: number;
  style?: React.CSSProperties;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    await copyText(draft.text);
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  }

  const similarity = Math.round(draft.similarity * 100);

  return (
    <Card
      style={style}
      className={cn(
        "group/draft animate-rise gap-0 overflow-hidden border-border/70 bg-card/70 py-0 backdrop-blur-sm transition-colors",
        draft.flagged
          ? "border-signal/35 hover:border-signal/50"
          : "hover:border-border",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Draft {String(index + 1).padStart(2, "0")}
          </span>
          {draft.flagged ? (
            <Badge
              variant="outline"
              className="border-signal/40 bg-signal-soft text-signal"
            >
              <TriangleAlert />
              Review
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
            >
              <ShieldCheck />
              Original
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={copy}
          className="text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="text-signal" />
              Copied
            </>
          ) : (
            <>
              <Copy />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="px-5 py-5 text-[15px] leading-[1.75] whitespace-pre-wrap text-foreground/90 sm:text-[15.5px]">
        {draft.text}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 px-5 py-2.5 text-[11px] text-muted-foreground">
        <span>{draft.word_count} words</span>
        <span className="hidden sm:inline">{draft.text.length} chars</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground/80">source similarity</span>
          <Progress
            value={similarity}
            aria-label={`Source similarity ${similarity}%`}
            className={cn(
              "h-1 w-16 bg-muted-foreground/15 sm:w-24",
              draft.flagged && "[&_[data-slot=progress-indicator]]:bg-signal",
            )}
          />
          <span className="w-8 font-mono text-[10.5px] tabular-nums text-foreground/70">
            {similarity}%
          </span>
        </div>
      </div>

      {draft.flagged && (
        <p className="border-t border-signal/20 bg-signal-soft/60 px-5 py-2.5 text-[11.5px] leading-relaxed text-signal">
          Close to the source phrasing. Rewrite a line or two before posting to keep it fully
          your own.
        </p>
      )}
    </Card>
  );
}
