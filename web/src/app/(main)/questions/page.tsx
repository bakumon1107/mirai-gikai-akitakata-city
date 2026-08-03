import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { QuestionSessionList } from "@/features/general-questions/server/components/question-session-list";
import { getQuestionSessionSummaries } from "@/features/general-questions/server/loaders/get-question-session-summaries";

export const metadata: Metadata = {
  title: `一般質問一覧 | ${siteConfig.siteName}`,
  description: "定例会ごとの一般質問の一覧です。",
};

export default async function QuestionsPage() {
  const summaries = await getQuestionSessionSummaries();

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-mirai-text">一般質問一覧</h1>
        <p className="mt-2 text-sm text-mirai-text-muted">
          定例会ごとに、議員が問い、市が答えた内容をご覧いただけます。
        </p>
      </div>

      <QuestionSessionList summaries={summaries} />
    </Container>
  );
}
