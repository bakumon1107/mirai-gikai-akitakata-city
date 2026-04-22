import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { getCouncilSessionBySlug } from "@/features/council-sessions/server/loaders/get-council-session-by-slug";
import { QuestionList } from "@/features/general-questions/server/components/question-list";
import { getGeneralQuestionsBySession } from "@/features/general-questions/server/loaders/get-general-questions";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const session = await getCouncilSessionBySlug(slug);
  if (!session) return { title: "定例会が見つかりません" };
  return {
    title: `${session.name} 一般質問 | ${siteConfig.siteName}`,
    description: `${session.name}の一般質問一覧です。`,
  };
}

export default async function SessionQuestionsPage({ params }: Props) {
  const { slug } = await params;
  const session = await getCouncilSessionBySlug(slug);
  if (!session) notFound();

  const questions = await getGeneralQuestionsBySession(session.id);

  return (
    <Container className="py-8">
      <div className="mb-6">
        <Link
          href={routes.sessionBills(slug) as Route}
          className="text-sm text-muted-foreground hover:opacity-80"
        >
          ← 議案一覧に戻る
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-2">{session.name}</h1>
      <h2 className="text-lg font-medium text-muted-foreground mb-6">
        一般質問
      </h2>
      <QuestionList questions={questions} sessionSlug={slug} />
    </Container>
  );
}
