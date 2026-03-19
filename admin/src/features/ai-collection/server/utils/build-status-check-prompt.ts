import "server-only";

import { siteConfig } from "@/config/site.config";
import type { BillInPeriod } from "../loaders/get-bills-in-period";

export function buildStatusCheckPrompt(
  bills: BillInPeriod[],
  outputFilePath: string
): string {
  const billList = bills
    .map((b) => `- 議案番号: ${b.billNumber}　議案名: ${b.name}`)
    .join("\n");

  return `${siteConfig.councilName}の公式サイトで、以下の議案の現在の審議ステータスを調査してください。

調査サイト:
- ${siteConfig.councilBillsDetailUrl} （${siteConfig.councilName}）

調査対象の議案:
${billList}

各議案について、現在の審議ステータスのみを調べてください（概要・会派見解は不要です）。

調査完了後、以下のJSON形式のデータを Writeツールを使って ${outputFilePath} に書き込んでください:
{
  "bills": [{"billNumber": "議案番号", "title": "議案名", "summary": "", "status": "approved", "submitter": null, "sourceUrls": ["参照URL"]}],
  "factionStances": [],
  "sources": []
}

statusの値:
- "submitted": 提出
- "in_committee": 委員会審査中
- "plenary_session": 本会議審議中
- "approved": 可決（条例案・予算案など通常の議案）
- "rejected": 否決（条例案・予算案など通常の議案）
- "adopted": 採択（請願・陳情が採択された場合）
- "partially_adopted": 趣旨採択（請願の趣旨のみ採択された場合）

ステータスの判定に関する注意:
- 附帯決議案は本体議案（例: 議案第XX号）とは別個に扱い、附帯決議案自体のステータスを記録してください
- 請願・陳情は「採択」→ "adopted"、「趣旨採択」→ "partially_adopted"、「不採択」→ "rejected" を使用してください
- 意見書案のステータスも本体議案とは独立して調査してください
- ステータスが不明な場合は現在のステータスをそのまま維持してください

ファイルへの書き込みが完了したら「収集完了」とだけ返してください。`;
}
