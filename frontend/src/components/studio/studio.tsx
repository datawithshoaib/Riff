"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Copy,
  ImagePlus,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

import { useHealth } from "@/components/health-provider";
import { DraftCard } from "@/components/studio/draft-card";
import { InsightPanel } from "@/components/studio/insight-panel";
import { UploadPanel } from "@/components/studio/upload-panel";
import { GeneratePanel, VoicePicker } from "@/components/studio/voice-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { copyText, pluralize } from "@/lib/format";
import { getActiveVoiceId, getUserId, setActiveVoiceId } from "@/lib/storage";
import type { GenerationResponse, UploadResponse, VoiceProfile } from "@/lib/types";

export function Studio() {
  const { health } = useHealth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadResponse | null>(null);
  const [generation, setGeneration] = useState<GenerationResponse | null>(null);
  const [busy, setBusy] = useState<"analyzing" | "generating" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [voiceId, setVoiceId] = useState("");

  const draftsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    const userId = getUserId();

    api
      .listVoiceProfiles(userId)
      .then((list) => {
        if (cancelled) return;
        setProfiles(list);
        const stored = getActiveVoiceId();
        const nextId =
          stored && list.some((profile) => profile.voice_profile_id === stored)
            ? stored
            : (list[0]?.voice_profile_id ?? "");
        setVoiceId(nextId);
      })
      .catch(() => {
        // The health banner already explains an unreachable API.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = useCallback(
    async (nextFile: File) => {
      setError(null);
      setUpload(null);
      setGeneration(null);
      setBusy("analyzing");
      setFile(nextFile);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(nextFile);
      });

      try {
        const result = await api.uploadScreenshot(nextFile);
        setUpload(result);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Something went wrong reading that image.";
        setError(message);
        setFile(null);
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return null;
        });
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  async function handleGenerate() {
    if (!upload) return;
    setBusy("generating");
    setError(null);

    try {
      const result = await api.createGeneration({
        upload_id: upload.upload_id,
        voice_profile_id: voiceId || null,
        draft_count: 3,
      });
      const isFirst = generation === null;
      setGeneration(result);
      if (result.drafts.some((draft) => draft.flagged)) {
        window.setTimeout(() => {
          draftsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
      } else if (isFirst) {
        window.setTimeout(() => {
          draftsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "The drafts could not be written. Try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setUpload(null);
    setGeneration(null);
    setError(null);
    setFile(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  function changeVoice(next: string) {
    setVoiceId(next);
    setActiveVoiceId(next || null);
  }

  async function copyAll() {
    if (!generation) return;
    const all = generation.drafts.map((draft) => draft.text).join("\n\n---\n\n");
    await copyText(all);
  }

  const isGenerating = busy === "generating";
  const isAnalyzing = busy === "analyzing";
  const demo = health?.mode === "demo";

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="max-w-3xl animate-fade-up">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
          <span className="size-1.5 rounded-full bg-signal" />
          Screenshot to original post
        </div>
        <h1 className="font-serif text-[2.7rem] leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[4.2rem]">
          Keep the idea.
          <br />
          <span className="italic text-signal">Lose the words.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted-foreground sm:text-[15px]">
          Drop a screenshot of any post. Riff extracts the underlying insight, strips the
          original phrasing, and writes three drafts that sound like you — never like the
          source.
        </p>
      </section>

      {error && (
        <Alert variant="destructive" className="animate-fade-in border-destructive/30 bg-destructive/5">
          <TriangleAlert />
          <AlertTitle className="flex items-center justify-between gap-4">
            That didn&apos;t work
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Dismiss error"
              onClick={() => setError(null)}
              className="-mr-1 text-destructive"
            >
              <X />
            </Button>
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_304px] lg:gap-8">
        <div className="min-w-0 space-y-5">
          <UploadPanel
            file={file}
            previewUrl={previewUrl}
            isAnalyzing={isAnalyzing}
            onFile={(nextFile) => void handleFile(nextFile)}
            onRemove={reset}
          />

          {upload && <InsightPanel upload={upload} />}

          {upload && !generation && (
            <Card className="gap-0 border-dashed border-border/70 bg-card/30 py-0">
              <div className="flex items-center justify-between border-b border-dashed border-border/60 px-5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Step 03 · Your drafts
                </p>
                <span className="text-[11px] text-muted-foreground/70">
                  {isGenerating ? "Writing…" : "Waiting"}
                </span>
              </div>
              <div className="space-y-3 p-5">
                {isGenerating ? (
                  <>
                    <DraftSkeleton delay={0} />
                    <DraftSkeleton delay={120} />
                    <DraftSkeleton delay={240} />
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <div className="grid size-10 place-items-center rounded-xl border border-border/70 bg-background/50 text-signal">
                      <Sparkles className="size-4" />
                    </div>
                    <p className="text-sm font-medium">Pick a voice, then write</p>
                    <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                      Three distinct angles will appear here. Each one is scored against the
                      original before you ever see it.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {generation && (
            <section ref={draftsRef} className="scroll-mt-24 space-y-3 animate-fade-up">
              <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Step 03 · Your drafts
                  </p>
                  <h2 className="mt-1 font-serif text-2xl tracking-tight">
                    {pluralize(generation.drafts.length, "draft")} in your voice
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={copyAll}>
                    <Copy />
                    Copy all
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="text-muted-foreground"
                  >
                    <RefreshCw className={isGenerating ? "animate-spin" : ""} />
                    Redo
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {generation.drafts.map((draft, index) => (
                  <DraftCard
                    key={`${generation.generation_id}-${index}`}
                    draft={draft}
                    index={index}
                    style={{ animationDelay: `${index * 90}ms` }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8">
          <Card className="gap-0 overflow-hidden border-border/70 bg-card/70 py-0 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Writer settings
              </p>
              {upload && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={reset}
                  aria-label="Start over"
                  className="text-muted-foreground"
                  disabled={isAnalyzing || isGenerating}
                >
                  <RotateCcw />
                </Button>
              )}
            </div>

            <div className="space-y-4 p-4">
              <VoicePicker
                profiles={profiles}
                value={voiceId}
                disabled={isGenerating}
                onChange={changeVoice}
              />

              <div className="h-px bg-border/60" />

              <GeneratePanel
                canGenerate={Boolean(upload)}
                isGenerating={isGenerating}
                hasGeneration={Boolean(generation)}
                demo={demo}
                onGenerate={handleGenerate}
                onRegenerate={handleGenerate}
              />

              {!upload && !isAnalyzing && (
                <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-muted-foreground/70">
                  <ImagePlus className="size-3.5 shrink-0" />
                  Add a screenshot to unlock writing.
                </p>
              )}

              {isAnalyzing && (
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin text-signal" />
                  Reading your screenshot…
                </p>
              )}
            </div>
          </Card>

          <div className="flex gap-3 rounded-xl border border-border/60 bg-card/40 p-3.5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-signal" />
            <div className="space-y-1">
              <p className="text-xs font-medium">Originality, by design</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Source text is isolated from the writer. Every draft is checked for lexical
                similarity and verbatim phrasing before it&apos;s shown.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DraftSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className="space-y-3 rounded-xl border border-border/60 bg-background/30 p-4 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-[92%]" />
      <Skeleton className="h-3.5 w-[78%]" />
      <div className="flex gap-3 pt-1">
        <Skeleton className="h-2.5 w-12" />
        <Skeleton className="h-2.5 w-12" />
      </div>
    </div>
  );
}
