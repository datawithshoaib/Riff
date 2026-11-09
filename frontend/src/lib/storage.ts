const USER_KEY = "riff:user-id";
const VOICE_KEY = "riff:voice-profile-id";

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked; the app still works for the current session.
  }
}

export function getUserId(): string {
  const existing = safeGet(USER_KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `user-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  safeSet(USER_KEY, id);
  return id;
}

export function getActiveVoiceId(): string | null {
  return safeGet(VOICE_KEY);
}

export function setActiveVoiceId(id: string | null): void {
  safeSet(VOICE_KEY, id);
}
