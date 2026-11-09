"use client";

import { AudioLines, Plus, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { useHealth } from "@/components/health-provider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pluralize, voiceProfileLabel } from "@/lib/format";
import type { VoiceProfile } from "@/lib/types";

export function VoicePicker({
  profiles,
  value,
  disabled,
  onChange,
}: {
  profiles: VoiceProfile[];
  value: string;
  disabled?: boolean;
  onChange: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="voice-picker"
          className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
        >
          Write as
        </label>
        <Link
          href="/voice"
          className="text-[11px] font-medium text-signal underline-offset-4 hover:underline"
        >
          Manage voice
        </Link>
      </div>

      {profiles.length === 0 ? (
        <Link
          href="/voice"
          className="flex items-start gap-2.5 rounded-lg border border-dashed border-border/80 bg-background/30 p-3 transition-colors hover:border-signal/40 hover:bg-signal-soft/30"
        >
          <AudioLines className="mt-0.5 size-4 shrink-0 text-signal" />
          <span className="space-y-0.5">
            <span className="block text-xs font-medium text-foreground">
              Add your writing style
            </span>
            <span className="block text-[11px] leading-relaxed text-muted-foreground">
              Paste a few past posts so drafts sound like you.
            </span>
          </span>
          <Plus className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
        </Link>
      ) : (
        <Select value={value || "none"} onValueChange={(next) => onChange(next === "none" ? "" : next)}>
          <SelectTrigger
            id="voice-picker"
            disabled={disabled}
            className="h-9 w-full bg-background/40"
          >
            <SelectValue placeholder="Neutral voice" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Neutral · no profile</SelectItem>
            {profiles.map((profile, index) => (
              <SelectItem key={profile.voice_profile_id} value={profile.voice_profile_id}>
                {voiceProfileLabel(profile.past_posts, index)} ·{" "}
                {pluralize(profile.post_count, "post")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function GeneratePanel({
  canGenerate,
  isGenerating,
  hasGeneration,
  demo,
  onGenerate,
  onRegenerate,
}: {
  canGenerate: boolean;
  isGenerating: boolean;
  hasGeneration: boolean;
  demo: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
}) {
  const { health } = useHealth();
  const isDemo = demo || health?.mode === "demo";

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        onClick={hasGeneration ? onRegenerate : onGenerate}
        disabled={!canGenerate || isGenerating}
        className="group h-11 w-full gap-2 bg-signal text-signal-foreground shadow-[0_10px_30px_-12px_var(--signal)] transition-all hover:bg-signal/90 disabled:shadow-none"
      >
        {isGenerating ? (
          <>
            <span className="flex items-end gap-0.5" aria-hidden>
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="h-3 w-[2px] animate-bar rounded-full bg-current"
                  style={{ animationDelay: `${index * 140}ms` }}
                />
              ))}
            </span>
            Writing drafts…
          </>
        ) : (
          <>
            <Sparkles className="transition-transform group-hover:rotate-12" />
            {hasGeneration ? "Regenerate 3 drafts" : "Write 3 drafts"}
          </>
        )}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground/80">
        3 angles · originality checked · {health?.generation_provider ?? "groq"}
      </p>

      {isDemo && (
        <div className="flex gap-2.5 rounded-lg border border-signal/25 bg-signal-soft/50 p-3">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-signal" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-signal">Demo mode.</span> Drafts are sample
            content. Add <code className="font-mono text-[10px] text-foreground">GROQ_API_KEY</code>{" "}
            to <code className="font-mono text-[10px] text-foreground">.env</code> and restart the
            API for live results.
          </p>
        </div>
      )}
    </div>
  );
}
