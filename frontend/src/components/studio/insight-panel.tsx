"use client";

import { useState } from "react";
import { Check, Copy, Quote, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copyText } from "@/lib/format";
import type { UploadResponse } from "@/lib/types";

export function InsightPanel({ upload }: { upload: UploadResponse }) {
  const [copied, setCopied] = useState(false);

  async function copyInsight() {
    await copyText(upload.core_insight);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Card className="relative gap-0 overflow-hidden border-border/70 bg-card/70 py-0 backdrop-blur-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/50 to-transparent"
      />
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Step 02 · The idea
        </p>
        <div className="flex items-center gap-2">
          {upload.tone && (
            <Badge variant="outline" className="border-border/70 font-normal capitalize">
              {upload.tone}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={copyInsight}
            aria-label="Copy the core insight"
            className="text-muted-foreground"
          >
            {copied ? <Check className="text-signal" /> : <Copy />}
          </Button>
        </div>
      </div>

      <div className="px-5 pb-4 pt-5">
        <Quote className="mb-2 size-4 text-signal/70" aria-hidden />
        <p className="font-serif text-[1.55rem] leading-[1.3] tracking-[-0.005em] text-foreground sm:text-[1.7rem]">
          {upload.core_insight}
        </p>
      </div>

      <div className="px-5 pb-5">
        <Tabs defaultValue="source">
          <TabsList variant="line" className="mb-2">
            <TabsTrigger value="source">Source text</TabsTrigger>
            <TabsTrigger value="safety">Why this is safe</TabsTrigger>
          </TabsList>
          <TabsContent value="source">
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border/60 bg-background/40 p-3.5 text-[13px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {upload.raw_text}
            </div>
          </TabsContent>
          <TabsContent value="safety">
            <div className="flex gap-3 rounded-lg border border-border/60 bg-background/40 p-3.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-signal" />
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                The source text never goes into the writing prompt. Riff writes from the
                abstracted idea only, then scores each draft against the original so
                near-verbatim phrasing can be flagged before you publish.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
