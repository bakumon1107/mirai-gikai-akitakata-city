import "server-only";
import { siteConfig } from "@/config/site.config";

export function buildPrompt(
  startDate: string,
  endDate: string,
  outputFilePath: string,
  existingBillNumbers: string[] = []
): string {
  const existingSection =
    existingBillNumbers.length > 0
      ? `\n既に登録済みの議案番号（重複収集不要）:\n${existingBillNumbers.map((n) => `- ${n}`).join("\n")}\n`
      : "";

  return `${siteConfig.councilName}の${startDate}から${endDate}の期間に審議された議案と各会派の賛否について、公式サイト等から調査してください。
${existingSection}
調査サイト:
- ${siteConfig.councilBillsDetailUrl} （${siteConfig.councilName}）

収集情報:
1. 議案一覧（議案番号・議案名・提出者・審議ステータス・概要）
2. 会派見解（${siteConfig.councilFactionExamples}）

調査完了後、以下のJSON形式のデータを Writeツールを使って ${outputFilePath} に書き込んでください:
{
  "bills": [{"billNumber": null, "title": "議案名", "summary": "概要", "status": "submitted", "submitter": null, "sourceUrls": []}],
  "factionStances": [{"billTitle": "議案名", "factionName": "会派名", "stanceType": "for", "comment": null, "sourceUrls": []}],
  "sources": []
}

stanceTypeの値: "for"(賛成) | "against"(反対) | "neutral"(中立) | "absent"(欠席)
statusの値: "submitted" | "in_committee" | "plenary_session" | "approved" | "rejected"

ファイルへの書き込みが完了したら「収集完了」とだけ返してください。`;
}
