import type {
  GenerationList,
  GenerationResponse,
  HealthResponse,
  UploadResponse,
  VoiceProfile,
  VoiceProfileInput,
} from "@/lib/types";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const API_BASE = `${API_ORIGIN}/api/v1`;

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "error") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return AbortSignal.timeout(ms);
  }
  return undefined;
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 30_000): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: init.signal ?? timeoutSignal(timeoutMs),
      headers: {
        Accept: "application/json",
        ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError("The request took too long. Please try again.", 408, "timeout");
    }
    throw new ApiError(
      "Could not reach the Riff API. Is the backend running on port 8000?",
      0,
      "network_error",
    );
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status}).`;
    let code = "error";
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
      if (typeof body?.code === "string") code = body.code;
    } catch {
      // Keep the generic message when the body is not JSON.
    }
    throw new ApiError(detail, response.status, code);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  health: () => request<HealthResponse>("/health", {}, 8_000),

  uploadScreenshot: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<UploadResponse>("/uploads", { method: "POST", body }, 90_000);
  },

  getUpload: (uploadId: string) => request<UploadResponse>(`/uploads/${uploadId}`),

  createGeneration: (input: {
    upload_id: string;
    voice_profile_id?: string | null;
    draft_count?: number;
  }) =>
    request<GenerationResponse>(
      "/generations",
      { method: "POST", body: JSON.stringify(input) },
      120_000,
    ),

  listGenerations: (limit = 24, offset = 0) =>
    request<GenerationList>(`/generations?limit=${limit}&offset=${offset}`),

  getGeneration: (generationId: string) =>
    request<GenerationResponse>(`/generations/${generationId}`),

  listVoiceProfiles: (userId: string) =>
    request<VoiceProfile[]>(`/voice-profiles?user_id=${encodeURIComponent(userId)}`),

  createVoiceProfile: (input: VoiceProfileInput) =>
    request<VoiceProfile>("/voice-profiles", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateVoiceProfile: (profileId: string, pastPosts: string[]) =>
    request<VoiceProfile>(`/voice-profiles/${profileId}`, {
      method: "PATCH",
      body: JSON.stringify({ past_posts: pastPosts }),
    }),
};
