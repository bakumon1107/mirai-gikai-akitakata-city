"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { ConsultationOpinion } from "../../shared/types";

const OPINION_TYPE_LABELS: Record<string, string> = {
  demand: "要望",
  proposal: "提案",
  complaint: "不満",
  question: "質問",
};

const OPINION_TYPE_COLORS: Record<string, string> = {
  demand: "bg-blue-50 text-blue-700",
  proposal: "bg-green-50 text-green-700",
  complaint: "bg-red-50 text-red-700",
  question: "bg-yellow-50 text-yellow-700",
};

function OpinionCard({ opinion }: { opinion: ConsultationOpinion }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-mirai-border p-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-mirai-text-muted">
          {opinion.department}
          {opinion.opinionNumber != null ? ` #${opinion.opinionNumber}` : ""}
        </span>
        {opinion.opinionType && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${OPINION_TYPE_COLORS[opinion.opinionType] ?? ""}`}
          >
            {OPINION_TYPE_LABELS[opinion.opinionType]}
          </span>
        )}
        {opinion.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs bg-mirai-surface px-2 py-0.5 rounded-full text-mirai-text-muted"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-mirai-text">
        {opinion.aiSummary ?? opinion.text}
      </p>
      {expanded && (
        <p className="text-xs leading-relaxed text-mirai-text-secondary bg-mirai-surface rounded-xl p-3 mt-1">
          {opinion.text}
        </p>
      )}
      {opinion.aiSummary && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary-accent hover:opacity-80 transition-opacity w-fit"
        >
          {expanded ? (
            <>
              閉じる <ChevronUp className="size-3" />
            </>
          ) : (
            <>
              全文を読む <ChevronDown className="size-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

const ALL = "すべて";

interface OpinionListProps {
  opinions: ConsultationOpinion[];
  initialDepartmentFilter?: string;
  initialTagFilter?: string;
}

export function OpinionList({
  opinions,
  initialDepartmentFilter,
  initialTagFilter,
}: OpinionListProps) {
  const [deptFilter, setDeptFilter] = useState(initialDepartmentFilter ?? ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [tagFilter, setTagFilter] = useState(initialTagFilter ?? "");
  const [keyword, setKeyword] = useState("");

  const departments = [
    ALL,
    ...Array.from(new Set(opinions.map((o) => o.department))),
  ];
  const allTags = Array.from(new Set(opinions.flatMap((o) => o.tags)));

  const filtered = opinions.filter((o) => {
    if (deptFilter !== ALL && o.department !== deptFilter) return false;
    if (typeFilter !== ALL && o.opinionType !== typeFilter) return false;
    if (tagFilter && !o.tags.includes(tagFilter)) return false;
    if (
      keyword &&
      !(o.aiSummary ?? o.text).includes(keyword) &&
      !o.text.includes(keyword)
    )
      return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 p-4 bg-mirai-surface-grouped rounded-2xl">
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="text-xs border border-mirai-border rounded-lg px-2 py-1.5 bg-white text-mirai-text"
        >
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs border border-mirai-border rounded-lg px-2 py-1.5 bg-white text-mirai-text"
        >
          <option value={ALL}>すべての種類</option>
          <option value="demand">要望</option>
          <option value="proposal">提案</option>
          <option value="complaint">不満</option>
          <option value="question">質問</option>
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="text-xs border border-mirai-border rounded-lg px-2 py-1.5 bg-white text-mirai-text"
        >
          <option value="">すべてのテーマ</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="キーワード検索..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="text-xs border border-mirai-border rounded-lg px-2 py-1.5 bg-white text-mirai-text flex-1 min-w-32"
        />
      </div>

      <p className="text-xs text-mirai-text-muted">
        {filtered.length}件の意見（全{opinions.length}件中）
      </p>

      <div className="flex flex-col gap-3">
        {filtered.map((opinion) => (
          <OpinionCard key={opinion.id} opinion={opinion} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-mirai-text-muted text-center py-8">
            該当する意見がありません
          </p>
        )}
      </div>
    </div>
  );
}
