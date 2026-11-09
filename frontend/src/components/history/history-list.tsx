"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AudioLines,
  ChevronRight,
  Copy,
  Loader2,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { DraftCard } from "@/components/studio/draft-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { copyText, formatDateTime, formatRelative, pluralize } from "@/lib/format";
import type { GenerationResponse, GenerationSummary } from "@/lib/types";

const PAGE_SIZE = 24;

export function HistoryList() {
  const [items, setItems] = useState<GenerationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<GenerationSummary | null>(null);
  const [detail, setDetail] = useState<GenerationResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPage = useCallback(async (offset: number, append: boolean) => {
    try {
      const page = await api.listGenerations(PAGE_SIZE, offset);
      setItems((current) => (append ? [...current, ...page.items] : page.items));
      setTotal(page.total);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "History could not be loaded.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchPage(0, false);
  }, [fetchPage]);

  useEffect(() => {
    let cancelled = false;

    api
      .listGenerations(PAGE_SIZE, 0)
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setTotal(page.total);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "History could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function open(summary: GenerationSummary) {
    setSelected(summary);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await api.getGeneration(summary.generation_id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "That riff could not be opened.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function copyAll() {
    if (!detail) return;
    await copyText(detail.drafts.map((draft) => draft.text).join("\n\n---\n\n"));
    toast.success("All drafts copied");
  }

  return (
    <div className="space-y-8 lg:space-y-10">
      <PageHeader
        eyebrow="History"
        title="Everything you've riffed."
        description="Each run keeps the original insight, the drafts it produced and their originality scores — so you can come back, copy, or try a different angle."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {loading ? "Loading…" : pluralize(total, "riff")} saved
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refresh()}
            disabled={loading}
            className="text-muted-foreground"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button asChild size="sm" className="bg-signal text-signal-foreground hover:bg-signal/90">
            <Link href="/">
              <WandSparkles />
              New riff
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card className="gap-0 overflow-hidden border-border/70 bg-card/60 py-0 backdrop-blur-sm">
        {loading ? (
          <div className="space-y-5 p-5">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex gap-4">
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-2.5 w-32" />
                  <Skeleton className="h-4 w-[70%]" />
                  <Skeleton className="h-3 w-[90%]" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="grid size-12 place-items-center rounded-2xl border border-border/70 bg-background/40 text-signal">
              <AudioLines className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">No riffs yet</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Drop your first screenshot in the studio and the drafts will show up here.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="mt-1">
              <Link href="/">
                <Sparkles />
                Open the studio
              </Link>
            </Button>
          </div>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.generation_id} className="border-b border-border/50 last:border-0">
                <button
                  type="button"
                  onClick={() => void open(item)}
                  className="group flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/40 sm:px-5"
                >
                  <div className="mt-0.5 hidden size-9 shrink-0 place-items-center rounded-lg border border-border/70 bg-background/50 text-signal sm:grid">
                    <AudioLines className="size-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                      <span>{formatRelative(item.created_at)}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{pluralize(item.draft_count, "draft")}</span>
                      {item.tone && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="normal-case tracking-normal">{item.tone}</span>
                        </>
                      )}
                      {item.flagged_count > 0 && (
                        <Badge
                          variant="outline"
                          className="ml-1 h-4 border-signal/30 bg-signal-soft px-1.5 text-[9.5px] text-signal"
                        >
                          {item.flagged_count} to review
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 font-serif text-[1.1rem] leading-snug text-foreground/90">
                      {item.core_insight}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground/80">
                      {item.preview}
                    </p>
                  </div>

                  <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && items.length > 0 && items.length < total && (
          <div className="border-t border-border/60 p-3">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                setLoadingMore(true);
                void fetchPage(items.length, true);
              }}
              disabled={loadingMore}
            >
              {loadingMore ? <Loader2 className="animate-spin" /> : null}
              Load more
            </Button>
          </div>
        )}
      </Card>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setDetail(null);
          }
        }}
      >
        <DialogContent className="max-h-[86vh] gap-4 overflow-y-auto border-border/70 bg-card p-0 sm:max-w-2xl">
          <DialogHeader className="gap-2 border-b border-border/60 p-5 pr-12">
            <DialogDescription className="text-[11px] uppercase tracking-[0.12em]">
              {formatDateTime(selected?.created_at ?? null)} ·{" "}
              {selected ? pluralize(selected.draft_count, "draft") : ""}
            </DialogDescription>
            <DialogTitle className="font-serif text-xl leading-snug font-normal">
              {selected?.core_insight}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 px-5">
            {detailLoading && (
              <>
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </>
            )}
            {detail?.drafts.map((draft, index) => (
              <DraftCard key={index} draft={draft} index={index} />
            ))}
          </div>

          <DialogFooter showCloseButton>
            <Button
              variant="outline"
              onClick={copyAll}
              disabled={!detail}
              className="gap-1.5"
            >
              <Copy />
              Copy all drafts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
