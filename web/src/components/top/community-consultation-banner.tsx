import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";

export function CommunityConsultationBanner() {
  return (
    <Link
      href={routes.communityConsultationLatest()}
      className="flex items-center justify-between gap-4 bg-card border border-border rounded-lg px-5 py-4 hover:border-primary-accent transition-colors"
    >
      <div className="flex items-start gap-3">
        <Users className="w-6 h-6 text-primary-accent shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-mirai-text">地域懇談会</p>
          <p className="mt-0.5 text-sm text-mirai-text-secondary">
            市議会が各地域で開催する住民対話の場。市民の声を年度ごとに整理・分析しています
          </p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-mirai-text-muted shrink-0" />
    </Link>
  );
}
