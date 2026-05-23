---
name: chiiki-kondankai-akitakata
description: 安芸高田市議会の地域懇談会データをDBに追加登録する。住民意見PDFから意見・会場情報を抽出してseedスクリプトを作成・実行し、AI解説まで生成する。
---

# 安芸高田市 地域懇談会登録スキル

## 固定値（変わらない限り使い回す）

> **新しい年度を追加するたびに、下記テーブルを更新すること。**
> IDはDBから取得する:
> ```bash
> source .env.production && curl -s \
>   "$SUPABASE_URL/rest/v1/community_consultations?select=id,fiscal_year,fiscal_year_label,total_opinions" \
>   -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
>   -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -m json.tool
> ```

### 登録済み年度
| fiscal_year | id | 年度名 | 意見数 |
|---|---|---|---|
| r7 | `b39f80a6-060c-4a7b-8efe-6065d37bd122` | 令和7年度 | 373件 |

## 呼び出しパターン

```
/chiiki-kondankai-akitakata <PDF_URL>           # 通常登録（メインフロー）
/chiiki-kondankai-akitakata dryrun <PDF_URL>    # ドライラン（DB差分確認のみ・ファイル作成・実行なし）
```

`dryrun` の場合: 手順 1〜3 だけ実行して差分レポートを出し、手順 4 以降は行わない。

---

## 手順

### 1. PDFをダウンロードしてテキスト抽出

```bash
# PDFダウンロード
curl -L -o /tmp/kondankai.pdf "<PDF_URL>"

# テキスト抽出（-layout フラグなし）
pdftotext /tmp/kondankai.pdf /tmp/kondankai.txt

# テキスト冒頭確認（年度・会場情報を把握）
head -100 /tmp/kondankai.txt
```

### 2. 年度を特定する

テキスト冒頭から「令和X年」を読み取り、fiscal_year を決定する。

| 年度 | fiscal_year | fiscal_year_label |
|---|---|---|
| 令和7年 | r7 | 令和7年度 |
| 令和8年 | r8 | 令和8年度 |

### 3. DBの現状確認・差分レポート

```bash
source .env.production && curl -s \
  "$SUPABASE_URL/rest/v1/community_consultations?select=id,fiscal_year,fiscal_year_label,total_opinions&fiscal_year=eq.<FISCAL_YEAR>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -m json.tool
```

**dryrunの場合: ここで終了。以下を出力する。**
- 検出した年度
- PDFから解析した意見数（次のコマンドで計算）
- DBに既に存在するかどうか

```bash
python3 packages/seed/akitakata/parse-consultation-pdf.py /tmp/kondankai.txt | python3 -c "
import json, sys
opinions = json.load(sys.stdin)
from collections import Counter
counts = Counter(op['department'] for op in opinions)
print(f'合計: {len(opinions)}件')
for dept, n in sorted(counts.items(), key=lambda x: -x[1]):
    print(f'  {dept}: {n}件')
"
```

### 4. 会場情報（MEETINGS）をPDFから抽出する

テキスト冒頭に会場・日時・参加者数・テーマが記載されていることが多い。
AIが `head -200 /tmp/kondankai.txt` の内容から以下を抽出する：

```json
[
  { "location_name": "八千代町", "held_at": "2025-07-23", "participant_count": 20, "theme": "フリーテーマ" },
  ...
]
```

**抽出できない・不確かな場合**: ユーザーに確認する。必要な情報は：
- 会場名（地区名）
- 開催日（YYYY-MM-DD）
- 参加者数
- テーマ（任意）

合わせて以下も確認：
- 開催期間（`held_from`, `held_to`）
- 総参加者数（`total_participants`）

### 5. 意見JSONを生成する

```bash
python3 packages/seed/akitakata/parse-consultation-pdf.py /tmp/kondankai.txt > /tmp/opinions.json
```

エラーがある場合や意見数が異常に少ない（10件未満）場合は、テキストを確認して `parse-consultation-pdf.py` のDEPARTMENTS定義が現在のPDFと一致しているか確認する。

### 6. seedスクリプト作成

`packages/seed/akitakata/seed-community-consultations-<fiscal_year>.ts` を作成する。
`seed-community-consultations.ts` をコピーし、以下を更新する：

- `CONSULTATION` オブジェクト（fiscal_year, fiscal_year_label, title, held_from, held_to, total_participants）
- `MEETINGS` 配列（手順4で抽出した会場情報）

#### CONSULTATION の設定例（r8の場合）
```typescript
const CONSULTATION = {
  fiscal_year: "r8",
  fiscal_year_label: "令和8年度",
  title: "令和8年度 地域懇談会",
  pdf_url: "<PDF_URL>",
  status: "published",
  held_from: "2026-07-XX",
  held_to: "2026-08-XX",
  total_participants: XX,
  total_opinions: null as number | null,
};
```

### 7. 実行（必ずこのコマンドパターンを使う）

```bash
source .env.production && \
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
pnpm --filter @mirai-gikai/seed exec tsx akitakata/seed-community-consultations-<fiscal_year>.ts /tmp/opinions.json
```

**ポイント:**
- `.env.production` の変数名は `SUPABASE_URL` だがスクリプトは `NEXT_PUBLIC_SUPABASE_URL` を参照するため再マップ必須
- `tsx` はグローバルに入っていないので `pnpm --filter @mirai-gikai/seed exec` 経由で実行
- パスは seed パッケージルートからの相対パス（`packages/seed/akitakata/...` ではなく `akitakata/...`）

### 8. AI生成

意見のAI解析（要約・種別・タグ・課題カード・年度サマリー）を実行する：

```bash
source .env.production && \
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
pnpm --filter @mirai-gikai/seed exec tsx akitakata/generate-consultation-ai.ts <fiscal_year>
```

## 部署名一覧（parse-consultation-pdf.py の DEPARTMENTS と一致すること）

PDFの部署ヘッダーが以下と異なる場合は `parse-consultation-pdf.py` の `DEPARTMENTS` リストを更新すること：

- 危機管理監関係
- 総務部関係
- 企画部関係
- 市民部関係
- 福祉保健部関係
- 産業部関係
- 建設部関係
- 教育委員会関係
- 行政委員会関係
- 市全体に対しての意見
- 議会関係
- 国・県関係

## DBスキーマ

```
community_consultations        # 年度マスタ（fiscal_year がユニークキー）
community_consultation_meetings # 会場ごとの開催記録
community_consultation_opinions # 意見（部署・番号・テキスト）
community_consultation_opinion_tags # AIタグ
```
