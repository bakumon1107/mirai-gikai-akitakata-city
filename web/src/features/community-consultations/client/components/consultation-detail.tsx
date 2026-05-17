"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import type {
  CommunityConsultation,
  ConsultationOpinion,
  DepartmentStat,
} from "../../shared/types";
import { DepartmentBar } from "./department-bar";
import { IssueCardComponent } from "./issue-card";
import { MeetingCardComponent } from "./meeting-card";
import { OpinionList } from "./opinion-list";

interface ConsultationDetailProps {
  consultation: CommunityConsultation;
  opinions: ConsultationOpinion[];
}

function buildDepartmentStats(
  opinions: ConsultationOpinion[]
): DepartmentStat[] {
  const counts: Record<string, number> = {};
  for (const o of opinions) {
    counts[o.department] = (counts[o.department] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function ConsultationDetail({
  consultation,
  opinions,
}: ConsultationDetailProps) {
  const [tagFilter, setTagFilter] = useState("");

  const departmentStats = buildDepartmentStats(opinions);

  const handleFilterByTag = (tag: string) => {
    setTagFilter(tag);
    document
      .getElementById("opinions-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const heldFromLabel = consultation.heldFrom
    ? new Date(consultation.heldFrom).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const heldToLabel = consultation.heldTo
    ? new Date(consultation.heldTo).toLocaleDateString("ja-JP", {
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col gap-10 pb-16">
      {/* ① ヒーロー */}
      <div className="bg-white rounded-b-4xl px-4 pt-8 pb-8">
        <p className="text-xs font-medium text-mirai-text-muted mb-1">
          {consultation.fiscalYearLabel}
        </p>
        <h1 className="text-2xl font-bold text-mirai-text mb-2">地域懇談会</h1>
        {consultation.aiYearSummary && (
          <p className="text-base text-mirai-text-secondary mb-4 leading-relaxed">
            {consultation.aiYearSummary}
          </p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-mirai-text-muted mb-4">
          {heldFromLabel && heldToLabel && (
            <span>
              {heldFromLabel}〜{heldToLabel}
            </span>
          )}
          {consultation.meetings.length > 0 && (
            <span>{consultation.meetings.length}会場</span>
          )}
          {consultation.totalParticipants != null && (
            <span>参加者 {consultation.totalParticipants}人</span>
          )}
          {consultation.totalOpinions != null && (
            <span>意見 {consultation.totalOpinions}件以上</span>
          )}
        </div>
        {consultation.pdfUrl && (
          <a
            href={consultation.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary-accent hover:opacity-80 transition-opacity font-medium"
          >
            <ExternalLink className="size-3.5" />
            報告書全文（PDF）を見る
          </a>
        )}
      </div>

      {/* ② 今年の課題カード */}
      {consultation.aiIssueCards.length > 0 && (
        <section className="px-4">
          <h2 className="text-lg font-bold text-mirai-text mb-1">
            市民が語った課題
          </h2>
          <p className="text-xs text-mirai-text-muted mb-4">
            AIが意見から抽出した、今年度の安芸高田市が抱える構造的な課題
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {consultation.aiIssueCards.map((card) => (
              <IssueCardComponent
                key={card.title}
                card={card}
                onClickTag={handleFilterByTag}
              />
            ))}
          </div>
        </section>
      )}

      {/* ③ 会場の声 */}
      {consultation.meetings.length > 0 && (
        <section className="px-4">
          <h2 className="text-lg font-bold text-mirai-text mb-1">
            {consultation.meetings.length}つの地域の声
          </h2>
          <p className="text-xs text-mirai-text-muted mb-4">
            各会場のテーマと、参加者の代表的な一言
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {consultation.meetings.map((meeting) => (
              <MeetingCardComponent key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </section>
      )}

      {/* 区切り */}
      {opinions.length > 0 && (
        <>
          <div className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-mirai-border" />
              <span className="text-xs text-mirai-text-muted shrink-0">
                ここから詳しく読む
              </span>
              <div className="flex-1 border-t border-mirai-border" />
            </div>
          </div>

          {/* ④ 部署別グラフ */}
          {departmentStats.length > 0 && (
            <section className="px-4">
              <h2 className="text-lg font-bold text-mirai-text mb-1">
                部署別の意見数
              </h2>
              <p className="text-xs text-mirai-text-muted mb-4">
                クリックすると該当部署の意見一覧にジャンプします
              </p>
              <DepartmentBar
                stats={departmentStats}
                onClickDepartment={() => {
                  setTagFilter("");
                  document
                    .getElementById("opinions-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </section>
          )}

          {/* ⑤ 意見一覧 */}
          <section className="px-4" id="opinions-section">
            <h2 className="text-lg font-bold text-mirai-text mb-1">
              意見を読む
            </h2>
            <OpinionList opinions={opinions} initialTagFilter={tagFilter} />
          </section>
        </>
      )}
    </div>
  );
}
