import type { Route } from "next";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import type { ComingSoonBill } from "@/features/bills/shared/types";
import { Card, CardContent } from "../ui/card";

interface ComingSoonSectionProps {
  bills: ComingSoonBill[];
}

export function ComingSoonSection({ bills }: ComingSoonSectionProps) {
  return (
    <section className="flex flex-col gap-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[22px] font-bold text-black leading-[1.48]">
          これから掲載される議案
        </h2>
        <p className="text-xs text-mirai-text-secondary">
          {siteConfig.siteName}は、順次更新されていきます
        </p>
      </div>

      {/* Coming soonカードリスト */}
      {bills.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <p className="text-2xl font-bold text-gray-300">Coming soon</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {bills.map((bill) => (
            <ComingSoonBillCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}

      {/* 議会情報へのリンク */}
      <div className="text-right text-sm text-mirai-text-secondary">
        <Link
          href={siteConfig.councilBillsDetailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 inline-flex items-center gap-1"
        >
          {siteConfig.councilName}のすべての議案は{" "}
          <span className="underline">{siteConfig.councilName}情報へ</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}

function ComingSoonBillCard({ bill }: { bill: ComingSoonBill }) {
  // タイトルがあればそれを表示、なければ正式名称を表示
  const displayTitle = bill.title || bill.name;
  // 正式名称（タイトルがある場合のみ別途表示）
  const officialName = bill.title ? bill.name : null;

  const content = (
    <Card
      className={`border border-black ${
        bill.council_url
          ? "hover:bg-gray-50 transition-colors cursor-pointer"
          : ""
      }`}
    >
      <CardContent className="flex items-center justify-between py-4 px-5">
        <div className="flex flex-col gap-1 min-w-0 pr-3">
          <h3 className="font-bold text-base text-black leading-tight">
            {displayTitle}
          </h3>
          {officialName && (
            <p className="text-xs text-mirai-text-subtle">{officialName}</p>
          )}
        </div>
        {bill.council_url && (
          <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
      </CardContent>
    </Card>
  );

  // council_url がある場合は外部リンク
  if (bill.council_url) {
    return (
      <Link
        href={bill.council_url as Route}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </Link>
    );
  }

  return content;
}
