import "server-only";

// ---- 型定義 ----

export type BillForEval = {
  id: string;
  bill_number: string;
  name: string;
  title: string;
  summary: string;
  content: string;
};

export type EvalResult = {
  bill_number: string;
  score: number;
  excluded: boolean;
  reason: string;
  breakdown: {
    influence_range: number;
    life_impact: number;
    interest: number;
  };
};

export const FEATURE_THRESHOLD = 75;
export const EVAL_BATCH_SIZE = 5;

// ---- プロンプトビルド（純粋関数） ----

export function buildEvalPrompt(bills: BillForEval[]): string {
  const billsText = bills
    .map(
      (b) =>
        `【${b.bill_number}】${b.name}\nタイトル: ${b.title}\n概要: ${b.summary}\n本文:\n${b.content.slice(0, 800)}`
    )
    .join("\n\n---\n\n");

  return `あなたは安芸高田市議会の議案を市民目線で評価する専門家です。
以下の議案それぞれについて、市民への影響度を評価してください。

## 評価基準（100点満点）

### 1. 市民への直接影響範囲（45点満点）
- 45点: 安芸高田市民全体に広く影響する（医療・福祉・教育・交通・税など）
- 30点: 特定の世代や状況の市民に影響する（子育て世代、高齢者、移住者など）
- 15点: 一部の市民・事業者に影響する
- 0点:  市役所内部や特定業者のみ、一般市民への影響がほぼない

### 2. 生活への具体的変化（35点満点）
高く評価するのは「市民自身の」行動・選択肢・費用・受けられるサービスが変わる場合。
行政や業者・専門職の手続きや権限が変わるだけで、市民の日常に変化が生じない場合は低く評価すること。

- 35点: 市民自身の家計・日常生活に直接的・具体的な変化をもたらす
- 20点: 市民が受けられるサービスや手続きに変化が生じる
- 10点: 市民生活に間接的に影響する可能性がある
-  0点: 行政・業者・専門職側の手続きや権限・体制が変わるだけで、
        市民自身の行動・生活は変わらない

### 3. 話題性・関心度（20点満点）
- 20点: 移住・定住・過疎対策・医療・農林業・環境・子育てなど市民関心が高いテーマ
- 10点: 住宅・道路・産業・インフラなど一定の関心があるテーマ
- 0点:  行政内部の手続き・人事・会計処理など関心が低いテーマ

## 除外ルール
以下に該当する議案は、スコアに関係なく excluded: true にしてください：
- 予算案・補正予算案（条例・制度の変更を伴わないもの、および一般会計・特別会計・各財産区の予算案全般）
- 職員給与・定数・特殊勤務手当等の内部調整
- 和解・契約締結・外部監査契約のみの議案
- 法令改正に伴う形式的な規定整備のみ

## 出力形式
必ずJSON配列のみを出力してください。説明文は不要です。

\`\`\`json
[
  {
    "bill_number": "第〇号",
    "breakdown": {
      "influence_range": <0-45の整数>,
      "life_impact": <0-35の整数>,
      "interest": <0-20の整数>
    },
    "score": <合計点>,
    "excluded": <true|false>,
    "reason": "<50文字以内で評価理由>"
  }
]
\`\`\`

## 評価対象議案

${billsText}`;
}

// ---- JSON抽出（純粋関数） ----

export function extractEvalResults(text: string): EvalResult[] {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) {
    return JSON.parse(match[1]) as EvalResult[];
  }
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]) as EvalResult[];
  }
  throw new Error("JSON が見つかりませんでした");
}
