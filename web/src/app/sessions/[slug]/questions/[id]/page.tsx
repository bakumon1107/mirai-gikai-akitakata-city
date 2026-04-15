import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { getCouncilSessionBySlug } from "@/features/council-sessions/server/loaders/get-council-session-by-slug";
import { QuestionDetail } from "@/features/general-questions/server/components/question-detail";
import { getGeneralQuestionById } from "@/features/general-questions/server/loaders/get-general-questions";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ slug: string; id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const question = await getGeneralQuestionById(id);
  if (!question) return { title: "質問が見つかりません" };
  return {
    title: `${question.questioner_name}議員の一般質問 | ${siteConfig.siteName}`,
  };
}

export default async function QuestionDetailPage({ params }: Props) {
  const { slug, id } = await params;
  const [session, question] = await Promise.all([
    getCouncilSessionBySlug(slug),
    getGeneralQuestionById(id),
  ]);

  if (!session || !question) notFound();

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-col gap-1">
        <Link
          href={routes.sessionQuestions(slug) as Route}
          className="text-sm text-muted-foreground hover:opacity-80"
        >
          ← 一般質問一覧に戻る
        </Link>
        <p className="text-sm text-muted-foreground">{session.name}</p>
      </div>
      <QuestionDetail question={question} />
    </Container>
  );
}
