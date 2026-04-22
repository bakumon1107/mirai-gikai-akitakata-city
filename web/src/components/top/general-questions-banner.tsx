import { ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";

type GeneralQuestionsBannerProps = {
  sessionSlug: string;
};

export function GeneralQuestionsBanner({
  sessionSlug,
}: GeneralQuestionsBannerProps) {
  return (
    <Link
      href={routes.sessionQuestions(sessionSlug)}
      className="flex items-center justify-between gap-4 bg-card border border-border rounded-lg px-5 py-4 hover:border-primary-accent transition-colors"
    >
      <div className="flex items-start gap-3">
        <MessageSquare className="w-6 h-6 text-primary-accent shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-mirai-text">議員による一般質問</p>
          <p className="mt-0.5 text-sm text-mirai-text-secondary">
            各議員の質疑応答をチャット形式でわかりやすく確認できます
          </p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-mirai-text-muted shrink-0" />
    </Link>
  );
}
