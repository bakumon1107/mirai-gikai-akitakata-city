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
   - 議決結果を掲載したPDF（「議決結果」「採決結果」等のリンク）がある場合は優先的に参照してください
   - PDFは表形式で会派ごとの賛否が記載されています
   - 列名が空白の会派列がある場合は、最も議席数の多い会派として扱ってください
   - 無所属議員の情報は収集不要です

調査完了後、以下のJSON形式のデータを Writeツールを使って ${outputFilePath} に書き込んでください:
{
  "bills": [{"billNumber": null, "title": "議案名", "summary": "概要", "status": "submitted", "statusNote": null, "submitter": null, "sourceUrls": []}],
  "factionStances": [{"billTitle": "議案名", "factionName": "会派名", "stanceType": "for", "comment": null, "sourceUrls": []}],
  "sources": []
}

stanceTypeの値: "for"(賛成) | "against"(反対) | "neutral"(中立) | "absent"(欠席)

statusの値:
- "submitted": 提出・上程
- "in_committee": 委員会審査中
- "plenary_session": 本会議審議中
- "approved": 可決・承認・同意・採択（以下のstatusNoteに詳細を記載）
- "rejected": 否決・不採択

statusNoteの設定ルール（statusが "approved" の場合）:
- 「可決」→ statusNote: null
- 「原案可決」→ statusNote: "原案可決"
- 「修正可決」→ statusNote: "修正可決"
- 「承認」→ statusNote: "承認"
- 「同意」→ statusNote: "同意"
- 「採択」（請願・陳情）→ statusNote: "採択"
- 「趣旨採択」（請願）→ statusNote: "趣旨採択"

statusNoteの設定ルール（statusが "rejected" の場合）:
- 「否決」→ statusNote: null
- 「不採択」（請願・陳情）→ statusNote: "不採択"

ステータスの判定に関する注意:
- 附帯決議案は本体議案（例: 議案第XX号）とは別個に扱い、附帯決議案自体のステータスを記録してください
- 意見書案のステータスも本体議案とは独立して調査してください

ファイルへの書き込みが完了したら「収集完了」とだけ返してください。`;
}
