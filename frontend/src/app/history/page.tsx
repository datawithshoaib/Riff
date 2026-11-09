import { HistoryList } from "@/components/history/history-list";

export const metadata = {
  title: "History",
  description: "Every riff you have generated, with drafts and originality scores.",
};

export default function HistoryPage() {
  return <HistoryList />;
}
