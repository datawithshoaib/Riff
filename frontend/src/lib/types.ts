export type HealthResponse = {
  status: string;
  version: string;
  environment: string;
  mode: "live" | "demo";
  vision_provider: string;
  generation_provider: string;
  database: string;
  similarity_threshold: number;
};

export type UploadResponse = {
  upload_id: string;
  raw_text: string;
  core_insight: string;
  tone: string | null;
  created_at: string | null;
};

export type Draft = {
  text: string;
  flagged: boolean;
  similarity: number;
  phrase_overlap: number;
  word_count: number;
};

export type GenerationResponse = {
  generation_id: string;
  upload_id: string;
  core_insight: string;
  tone: string | null;
  drafts: Draft[];
  created_at: string | null;
};

export type GenerationSummary = {
  generation_id: string;
  upload_id: string;
  core_insight: string;
  tone: string | null;
  draft_count: number;
  flagged_count: number;
  preview: string;
  created_at: string | null;
};

export type GenerationList = {
  items: GenerationSummary[];
  total: number;
  limit: number;
  offset: number;
};

export type VoiceProfile = {
  voice_profile_id: string;
  user_id: string;
  past_posts: string[];
  post_count: number;
  created_at: string | null;
};

export type VoiceProfileInput = {
  user_id: string;
  past_posts: string[];
};
