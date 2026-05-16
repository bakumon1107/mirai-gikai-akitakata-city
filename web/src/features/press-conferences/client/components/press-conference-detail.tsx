"use client";

import { ExternalLink, Mic, PlayCircle } from "lucide-react";
import type { PressConference } from "../../shared/types";
import { QaItem } from "./qa-item";

type Props = {
  pressConference: PressConference;
};

export function PressConferenceDetail({ pressConference }: Props) {
  const announcements = pressConference.items.filter(
    (item) => item.itemType === "announcement"
  );
  const qaItems = pressConference.items.filter(
    (item) => item.itemType === "qa"
  );

  const formattedDate = new Date(pressConference.heldAt).toLocaleDateString(
    "ja-JP",
    { year: "numeric", month: "long", day: "numeric", weekday: "short" }
  );

  return (
    <div className="flex flex-col gap-8">
      {/* ヘッダー */}
      <div className="rounded-2xl bg-gradient-to-br from-mirai-gradient-start to-mirai-gradient-end px-6 py-6 flex flex-col gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-accent bg-white/70 rounded-full px-3 py-1 w-fit">
          📅 {formattedDate}
        </span>
        <h1 className="text-lg font-bold text-mirai-text leading-snug">
          {pressConference.title}
        </h1>
        <p className="text-sm text-mirai-text-secondary leading-relaxed">
          藤本市長が記者の皆さんと直接やりとりした内容を、わかりやすくお届けします。
        </p>
        {pressConference.youtubeUrl && (
          <a
            href={pressConference.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-primary-accent hover:bg-primary-accent/90 transition-colors rounded-full px-4 py-2 w-fit"
          >
            <PlayCircle className="w-4 h-4" />
            動画で見る
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        )}
      </div>

      {/* 市からの発表 */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📣</span>
          <h2 className="text-base font-bold text-mirai-text">市からの発表</h2>
          <span className="text-xs text-mirai-text-muted bg-mirai-surface-muted rounded-full px-2 py-0.5">
            {announcements.length}件
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {announcements.map((item, i) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border-l-4 border-primary shadow-sm px-5 py-4 flex flex-col gap-2"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-mirai-gradient-start text-primary-accent text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <h3 className="text-sm font-bold text-mirai-text">
                  {item.title}
                </h3>
              </div>
              {item.summary && (
                <p className="text-sm text-mirai-text-secondary leading-relaxed pl-9">
                  {item.summary}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 質疑応答 */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary-accent" />
          <h2 className="text-base font-bold text-mirai-text">
            記者との質疑応答
          </h2>
          <span className="text-xs text-mirai-text-muted bg-mirai-surface-muted rounded-full px-2 py-0.5">
            {qaItems.length}件
          </span>
        </div>
        <p className="text-xs text-mirai-text-muted -mt-2">
          タップすると詳しいやりとりが読めます
        </p>
        <div className="flex flex-col gap-2">
          {qaItems.map((item, i) => (
            <QaItem key={item.id} item={item} defaultOpen={i === 0} />
          ))}
        </div>
      </section>
    </div>
  );
}
