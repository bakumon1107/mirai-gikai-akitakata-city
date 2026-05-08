import {
  Baby,
  Shield,
  Heart,
  Leaf,
  Circle,
  ArrowRight,
  Stethoscope,
  Building2,
  Trophy,
  Globe,
} from "lucide-react";
import Link from "next/link";
import type { GeneralQuestion } from "../../shared/types";
import { buildTopicGroups } from "../../shared/utils/build-topic-groups";
import type {
  TopicEntry,
  TopicGroup,
} from "../../shared/utils/build-topic-groups";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Baby,
  Shield,
  Heart,
  Stethoscope,
  Building2,
  Leaf,
  Trophy,
  Globe,
  Circle,
};

const CATEGORY_STYLE: Record<
  string,
  { card: string; header: string; text: string; iconBg: string }
> = {
  "子育て・教育": {
    card: "bg-sky-50 border-sky-200",
    header: "bg-white/60 border-sky-200",
    text: "text-sky-700",
    iconBg: "bg-sky-100",
  },
  "防災・安全": {
    card: "bg-orange-50 border-orange-200",
    header: "bg-white/60 border-orange-200",
    text: "text-orange-700",
    iconBg: "bg-orange-100",
  },
  "高齢者・福祉": {
    card: "bg-rose-50 border-rose-200",
    header: "bg-white/60 border-rose-200",
    text: "text-rose-700",
    iconBg: "bg-rose-100",
  },
  "健康・医療": {
    card: "bg-teal-50 border-teal-200",
    header: "bg-white/60 border-teal-200",
    text: "text-teal-700",
    iconBg: "bg-teal-100",
  },
  "交通・まちづくり": {
    card: "bg-violet-50 border-violet-200",
    header: "bg-white/60 border-violet-200",
    text: "text-violet-700",
    iconBg: "bg-violet-100",
  },
  "環境・脱炭素": {
    card: "bg-emerald-50 border-emerald-200",
    header: "bg-white/60 border-emerald-200",
    text: "text-emerald-700",
    iconBg: "bg-emerald-100",
  },
  "スポーツ・文化": {
    card: "bg-indigo-50 border-indigo-200",
    header: "bg-white/60 border-indigo-200",
    text: "text-indigo-700",
    iconBg: "bg-indigo-100",
  },
  "地域・国際交流": {
    card: "bg-amber-50 border-amber-200",
    header: "bg-white/60 border-amber-200",
    text: "text-amber-700",
    iconBg: "bg-amber-100",
  },
};

const DEFAULT_STYLE = {
  card: "bg-mirai-surface-muted border-border",
  header: "bg-card border-border",
  text: "text-mirai-text-secondary",
  iconBg: "bg-card",
};

function TopicCard({
  entry,
  style,
}: {
  entry: TopicEntry;
  style: typeof DEFAULT_STYLE;
}) {
  return (
    <div className={`rounded-xl border ${style.card} overflow-hidden`}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-2 mb-2">
          <h3 className={`text-base font-bold ${style.text} flex-1`}>
            {entry.title}
          </h3>
          {entry.topicCount > 1 && (
            <span
              className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full ${style.iconBg} ${style.text}`}
            >
              {entry.topicCount}件
            </span>
          )}
        </div>
        <p className="text-sm text-mirai-text leading-relaxed">
          {entry.answerSummary}
        </p>
      </div>
      <div
        className={`px-4 py-2.5 border-t ${style.header} flex items-center justify-between gap-2`}
      >
        <p className="text-xs text-mirai-text-secondary line-clamp-1 flex-1">
          {entry.questioner.name}議員の質問より
        </p>
        <Link
          href={`/questions/${entry.questioner.id}`}
          className={`inline-flex items-center gap-1 text-xs font-medium ${style.text} hover:underline shrink-0`}
        >
          質疑の詳細
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function CategorySection({ group }: { group: TopicGroup }) {
  const Icon = ICON_MAP[group.iconName] ?? Circle;
  const style = CATEGORY_STYLE[group.categoryLabel] ?? DEFAULT_STYLE;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${style.iconBg}`}
        >
          <Icon className={`h-4 w-4 ${style.text}`} />
        </div>
        <h2 className={`font-bold ${style.text}`}>{group.categoryLabel}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {group.entries.map((entry, i) => (
          <TopicCard key={`${entry.title}-${i}`} entry={entry} style={style} />
        ))}
      </div>
    </section>
  );
}

interface SessionTopicsViewProps {
  questions: GeneralQuestion[];
}

export function SessionTopicsView({ questions }: SessionTopicsViewProps) {
  if (questions.length === 0) {
    return (
      <div className="text-center py-16 text-mirai-text-secondary">
        <p>現在、一般質問のデータを準備中です。</p>
        <p className="text-sm mt-2">しばらくお待ちください。</p>
      </div>
    );
  }

  const groups = buildTopicGroups(questions);

  return (
    <div className="flex flex-col gap-10">
      {groups.map((group) => (
        <CategorySection key={group.categoryLabel} group={group} />
      ))}
    </div>
  );
}
