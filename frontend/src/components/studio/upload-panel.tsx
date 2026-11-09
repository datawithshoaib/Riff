"use client";

import { useEffect, useRef, useState } from "react";
import { FileImage, ImageUp, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

type UploadPanelProps = {
  file: File | null;
  previewUrl: string | null;
  isAnalyzing: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
};

function validate(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) {
    return "Use a PNG, JPG or WebP screenshot.";
  }
  if (file.size > MAX_BYTES) {
    return "That image is larger than 10 MB.";
  }
  return null;
}

export function UploadPanel({
  file,
  previewUrl,
  isAnalyzing,
  onFile,
  onRemove,
}: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) =>
        entry.type.startsWith("image/"),
      );
      if (!item) return;
      const pasted = item.getAsFile();
      if (!pasted) return;
      const problem = validate(pasted);
      if (problem) {
        setLocalError(problem);
        return;
      }
      event.preventDefault();
      setLocalError(null);
      onFile(pasted);
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onFile]);

  function handleFiles(files: FileList | null) {
    const selected = files?.[0];
    if (!selected) return;
    const problem = validate(selected);
    if (problem) {
      setLocalError(problem);
      return;
    }
    setLocalError(null);
    onFile(selected);
  }

  return (
    <Card className="relative gap-0 overflow-hidden border-border/70 bg-card/70 py-0 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Step 01 · The screenshot
        </p>
        {file ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <FileImage className="size-3.5" />
            {isAnalyzing ? "Reading image" : "Ready"}
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
            png · jpg · webp
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {!file ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload a screenshot"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          className={cn(
            "group relative m-3 cursor-pointer rounded-xl border border-dashed p-8 text-center transition-all sm:p-12",
            dragging
              ? "border-signal/70 bg-signal-soft"
              : "border-border/80 hover:border-signal/40 hover:bg-signal-soft/40",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(60%_80%_at_50%_0%,var(--glow-2),transparent_70%)] opacity-0 transition-opacity group-hover:opacity-100"
          />
          <div className="relative mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-border/70 bg-background/60 text-signal shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5">
            <ImageUp className="size-5" />
          </div>
          <p className="relative text-[15px] font-medium">
            Drop a screenshot here
          </p>
          <p className="relative mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
            Or click to browse. Paste with{" "}
            <kbd className="rounded border border-border/80 bg-background/70 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80">
              Ctrl
            </kbd>{" "}
            <kbd className="rounded border border-border/80 bg-background/70 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80">
              V
            </kbd>{" "}
            straight from your clipboard.
          </p>
          <div className="relative mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-muted-foreground/70">
            <span className="rounded-full border border-border/60 px-2 py-0.5">PNG</span>
            <span className="rounded-full border border-border/60 px-2 py-0.5">JPG</span>
            <span className="rounded-full border border-border/60 px-2 py-0.5">WebP</span>
            <span className="px-1">up to 10 MB</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 p-4 sm:grid-cols-[168px_minmax(0,1fr)] sm:p-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border/70 bg-muted">
            {/* Object URL preview; next/image is unnecessary for a local blob. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl ?? ""}
              alt="Uploaded screenshot preview"
              className="size-full object-cover object-top"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-[2px]">
                <span className="flex items-end gap-0.5" aria-hidden>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <span
                      key={index}
                      className="h-3 w-[2px] animate-bar rounded-full bg-signal"
                      style={{ animationDelay: `${index * 120}ms` }}
                    />
                  ))}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/80">
                  Reading
                </span>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatBytes(file.size)} · {file.type.replace("image/", "").toUpperCase()}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80">
                {isAnalyzing
                  ? "Extracting the text and distilling the core idea…"
                  : "Source text stays here. Only the abstracted idea reaches the writer."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={isAnalyzing}
              >
                <RefreshCw />
                Replace
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                disabled={isAnalyzing}
                className="text-muted-foreground"
              >
                <X />
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {localError && (
        <p className="border-t border-destructive/20 bg-destructive/5 px-5 py-2.5 text-xs text-destructive">
          {localError}
        </p>
      )}
    </Card>
  );
}
