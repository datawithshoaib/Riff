import { VoiceStudio } from "@/components/voice/voice-studio";

export const metadata = {
  title: "Your voice",
  description: "Teach Riff how you write using a few of your own past posts.",
};

export default function VoicePage() {
  return <VoiceStudio />;
}
