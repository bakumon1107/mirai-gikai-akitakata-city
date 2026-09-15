import Image from "next/image";
import { siteConfig } from "@/config/site.config";

export function ReportProblemButton() {
  // 報告フォームURLが未設定の場合は導線ごと非表示にする
  if (!siteConfig.externalLinks.report) {
    return null;
  }

  return (
    <a
      href={siteConfig.externalLinks.report}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 py-2 text-base font-bold"
    >
      <Image
        src="/icons/report-error.svg"
        alt="報告アイコン"
        width={20}
        height={20}
        className="shrink-0"
      />
      問題を報告する
    </a>
  );
}
