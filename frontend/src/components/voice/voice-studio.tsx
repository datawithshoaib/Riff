"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AudioLines,
  Check,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";
import { formatRelative, pluralize, voiceProfileLabel } from "@/lib/format";
import { getActiveVoiceId, getUserId, setActiveVoiceId } from "@/lib/storage";
import type { VoiceProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_SAMPLES = 20;
const MAX_CHARS = 5000;

export function VoiceStudio() {
  const [userId, setUserId] = useState("");
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [posts, setPosts] = useState<string[]>([""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = getUserId();
    let cancelled = false;

    api
      .listVoiceProfiles(id)
      .then((list) => {
        if (cancelled) return;
        setProfiles(list);
        const stored = getActiveVoiceId();
        const active =
          list.find((profile) => profile.voice_profile_id === stored) ?? list[0] ?? null;
        if (active) {
          setActiveId(active.voice_profile_id);
          setPosts(active.past_posts);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load profiles.");
      })
      .finally(() => {
        if (!cancelled) {
          setUserId(id);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filledPosts = useMemo(() => posts.map((post) => post.trim()).filter(Boolean), [posts]);
  const canSave = filledPosts.length > 0 && !saving;

  function selectProfile(profile: VoiceProfile) {
    setActiveId(profile.voice_profile_id);
    setPosts(profile.past_posts);
    setActiveVoiceId(profile.voice_profile_id);
    setDirty(false);
    setError(null);
  }

  function newProfile() {
    setActiveId(null);
    setPosts([""]);
    setActiveVoiceId(null);
    setDirty(false);
    setError(null);
  }

  function updatePost(index: number, value: string) {
    setPosts((current) => current.map((post, i) => (i === index ? value : post)));
    setDirty(true);
  }

  function addPost() {
    if (posts.length >= MAX_SAMPLES) return;
    setPosts((current) => [...current, ""]);
    setDirty(true);
  }

  function removePost(index: number) {
    setPosts((current) => (current.length === 1 ? [""] : current.filter((_, i) => i !== index)));
    setDirty(true);
  }

  async function save() {
    if (!canSave || !userId) return;
    setSaving(true);
    setError(null);

    try {
      const profile = activeId
        ? await api.updateVoiceProfile(activeId, filledPosts)
        : await api.createVoiceProfile({ user_id: userId, past_posts: filledPosts });

      setProfiles((current) => {
        const without = current.filter(
          (item) => item.voice_profile_id !== profile.voice_profile_id,
        );
        return [profile, ...without];
      });
      setActiveId(profile.voice_profile_id);
      setPosts(profile.past_posts);
      setActiveVoiceId(profile.voice_profile_id);
      setDirty(false);
      toast.success(activeId ? "Voice updated" : "Voice profile created");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "That voice profile could not be saved.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 lg:space-y-10">
      <PageHeader
        eyebrow="Voice lab"
        title="Write like you."
        accent="Because it is you."
        description="Paste a few posts you've actually written. Riff learns the rhythm — the sentence length, the openings, the way you land a point — and uses it as style reference only."
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_304px] lg:gap-8">
        <div className="min-w-0 space-y-5">
          <Card className="gap-0 overflow-hidden border-border/70 bg-card/70 py-0 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Writing samples
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/80">
                  {filledPosts.length} of {MAX_SAMPLES} samples · up to {MAX_CHARS.toLocaleString()}{" "}
                  characters each
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                {saving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-signal" />
                    <span className="text-muted-foreground">Saving…</span>
                  </>
                ) : dirty ? (
                  <>
                    <span className="size-1.5 rounded-full bg-signal" />
                    <span className="text-muted-foreground">Unsaved changes</span>
                  </>
                ) : activeId ? (
                  <>
                    <Check className="size-3.5 text-emerald-500" />
                    <span className="text-muted-foreground">Saved</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/70">New profile</span>
                )}
              </span>
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              {loading ? (
                <>
                  <Skeleton className="h-36 w-full rounded-xl" />
                  <Skeleton className="h-28 w-full rounded-xl" />
                </>
              ) : (
                posts.map((post, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-xl border border-border/70 bg-background/30 transition-colors focus-within:border-signal/40"
                  >
                    <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-3 py-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Sample {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] tabular-nums text-muted-foreground/60">
                          {post.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Remove sample ${index + 1}`}
                          onClick={() => removePost(index)}
                          disabled={posts.length === 1}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={post}
                      maxLength={MAX_CHARS}
                      onChange={(event) => updatePost(index, event.target.value)}
                      placeholder="Paste a post you wrote. The more natural the better — this is a style reference, not a template."
                      className="min-h-32 resize-y rounded-none border-0 bg-transparent px-4 py-3.5 text-[14px] leading-relaxed shadow-none focus-visible:border-0 focus-visible:ring-0"
                    />
                  </div>
                ))
              )}

              <Button
                variant="outline"
                onClick={addPost}
                disabled={posts.length >= MAX_SAMPLES || loading}
                className="w-full border-dashed text-muted-foreground"
              >
                <Plus />
                Add another sample
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-5 py-3">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5 text-signal" />
                Used as style reference only. Never copied, never sent as source.
              </p>
              <Button
                onClick={save}
                disabled={!canSave}
                className="bg-signal text-signal-foreground hover:bg-signal/90"
              >
                {saving ? <Loader2 className="animate-spin" /> : <AudioLines />}
                {activeId ? "Save changes" : "Create voice"}
              </Button>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Not a template",
                body: "Riff reads cadence and structure, not specific sentences.",
              },
              {
                title: "A few is enough",
                body: "Three to five posts usually capture a voice well.",
              },
              {
                title: "Yours to change",
                body: "Update samples any time; drafts adapt on the next riff.",
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="rounded-xl border border-border/60 bg-card/40 p-3.5"
              >
                <Sparkles className="mb-2 size-3.5 text-signal" />
                <p className="text-xs font-medium">{tip.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {tip.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8">
          <Card className="gap-0 overflow-hidden border-border/70 bg-card/70 py-0 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Your profiles
              </p>
              <Button variant="ghost" size="icon-xs" onClick={newProfile} aria-label="New profile">
                <Plus />
              </Button>
            </div>

            <div className="space-y-1.5 p-2.5">
              {loading ? (
                <>
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </>
              ) : profiles.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs leading-relaxed text-muted-foreground">
                  No profiles yet. Add a few writing samples and save your first one.
                </p>
              ) : (
                profiles.map((profile) => {
                  const active = profile.voice_profile_id === activeId;
                  return (
                    <button
                      key={profile.voice_profile_id}
                      type="button"
                      onClick={() => selectProfile(profile)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-signal/40 bg-signal-soft/50"
                          : "border-transparent hover:border-border/70 hover:bg-accent/50",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium">
                          {voiceProfileLabel(profile.past_posts)}
                        </span>
                        {active && (
                          <span className="size-1.5 shrink-0 rounded-full bg-signal" />
                        )}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-muted-foreground">
                        {pluralize(profile.post_count, "sample")} ·{" "}
                        {formatRelative(profile.created_at)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-border/60 p-3">
              <Button
                variant="outline"
                onClick={newProfile}
                className="w-full border-dashed text-muted-foreground"
              >
                <Plus />
                New profile
              </Button>
            </div>
          </Card>

          <div className="flex gap-3 rounded-xl border border-border/60 bg-card/40 p-3.5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-signal" />
            <div className="space-y-1">
              <p className="text-xs font-medium">Private by default</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Profiles are tied to a browser-local ID and stored in your own Riff database.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
