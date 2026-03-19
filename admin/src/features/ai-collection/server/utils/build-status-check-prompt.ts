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

statusの値: "submitted" | "in_committee" | "plenary_session" | "approved" | "rejected"
ステータスが不明な場合は現在のステータスをそのまま維持してください。

ファイルへの書き込みが完了したら「収集完了」とだけ返してください。`;
}
