---
name: general-questions
description: 安芸高田市議会の一般質問データを速報版PDFからAIで生成してDBに登録する。新定例会の議案登録後に使う。
---

# 一般質問データ作成スキル

## 呼び出しパターン

```
/general-questions <PDF_URL>           # 新規作成（メインフロー）
/general-questions dryrun <PDF_URL>    # ドライラン（DB書き込みなし・スキル品質確認用）
/general-questions review <氏名>       # AI生成コンテンツのレビュー・修正
/general-questions publish <slug>      # 全件を published に変更
```

引数なしで呼ばれた場合はユーザーにどの操作をしたいか確認する。

**PDFが渡された場合**: URLから定例会（session_slug）を推定し、不明な場合はユーザーに確認する。`session_day` はPDF内の日付・日程から判断する（同一定例会で日が異なる速報版は別 `session_day` で管理する必要があるため、複数日ある場合はユーザーに確認する）。

---

## メインフロー（create）

### ステップ 1: PDFを取得してテキスト化

```bash
# WebFetch でPDFをダウンロード（/tmp に保存される）
# 保存先パスを確認してから pdftotext を実行
pdftotext -layout /tmp/<downloaded>.pdf /tmp/gijiroku.txt
```

`pdftotext` がない場合: `sudo apt-get install -y poppler-utils`

### ステップ 2: ドライランで質問者リストを確認

```bash
source .env.production && \
pnpm --filter @mirai-gikai/seed exec tsx akitakata/seed-general-questions.ts \
  /tmp/gijiroku.txt <session_slug> <session_day> --dry-run
```

**確認ポイント:**
- 検出された質問者数がPDF（速報版）の質問者数と一致しているか
- 議員番号・氏名が正しく抽出されているか（誤マッチがないか）
- 問題があれば `seed-general-questions.ts` の `splitByQuestioner` を調査する

### ステップ 3: 本登録（draft として挿入）

```bash
source .env.production && \
pnpm --filter @mirai-gikai/seed exec tsx akitakata/seed-general-questions.ts \
  /tmp/gijiroku.txt <session_slug> <session_day>
```

- `publish_status: "draft"` で挿入される（公開にはステップ 5 が必要）
- upsert なので再実行しても既存レコードを上書きする
  - conflict key: `(council_session_id, session_day, question_order)`

### ステップ 4: 登録結果を確認

```bash
source .env.production && curl -s \
  "$SUPABASE_URL/rest/v1/general_questions?select=questioner_name,questioner_number,question_order,publish_status,topics&council_session_id=eq.<SESSION_ID>&session_day=eq.<SESSION_DAY>&order=question_order.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -c "
import json, sys
qs = json.load(sys.stdin)
print(f'件数: {len(qs)}件')
for q in qs:
    topics = q['topics'] or []
    print(f'  {q[\"questioner_name\"]:10} [{q[\"publish_status\"]}] topics:{len(topics)}件')
"
```

- topics が 0 件のレコードがあればAI生成が失敗している → 単体で再実行を検討

### ステップ 5: AI生成コンテンツをレビューしてから公開

各議員のトピックを **必ずレビュー** してから publish する（`review` アクション参照）。
レビュー・修正が完了したら `publish` アクションで公開する。

---

## dryrun アクション（スキル品質確認用）

`/general-questions dryrun <PDF_URL>` で呼ばれた場合のフロー。DB書き込みは行わない。
スキルの精度改善・新定例会の初回確認時に使う。

1. ドライランを実行して質問者リストを出力（`--dry-run` フラグ）
2. PDFの実際の質問者一覧と突合して誤検知・漏れを確認
3. DBに既存データがある場合はAI生成結果と比較してスキルの品質を評価:

```bash
# 既存DBデータを取得して比較
source .env.production && curl -s \
  "$SUPABASE_URL/rest/v1/general_questions?select=questioner_name,summary,topics&council_session_id=eq.<SESSION_ID>&session_day=eq.<SESSION_DAY>&order=question_order.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -m json.tool
```

品質チェック観点:
- 質問者の分割が正しいか（1人の質問が複数に分かれていないか）
- トピック数・タイトルが内容と一致しているか
- answerer_role が適切か（局長名・市長名が含まれているか）

---

## レビュー（review）

```bash
source .env.production && curl -s \
  "$SUPABASE_URL/rest/v1/general_questions?select=id,topics,summary&questioner_name=eq.<NAME>&council_session_id=eq.<SESSION_ID>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -m json.tool
```

レビュー観点（**PATCH前に必ずユーザーに確認を得る**）:
1. 日本語の自然さ（語尾・助詞・文体）
2. 答弁者の役職と担当内容が一致しているか
3. 中国語漢字の混入がないか
4. 複数トピックをまたいでA質問の情報がB質問に混入していないか
5. タイトルにカテゴリキーワードが含まれているか（含まれないと「その他」に落ちる）

修正内容をユーザーが承認したら PATCH 実行:

```bash
source .env.production && curl -s -X PATCH \
  "$SUPABASE_URL/rest/v1/general_questions?id=eq.<ID>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"topics": <修正後のJSON>, "summary": "<修正後のサマリー>"}' | python3 -c "
import json, sys; r = json.load(sys.stdin); print(f'更新: {r[0][\"questioner_name\"]}')"
```

---

## 公開（publish）

1. 全件レビュー完了後に実行
2. `status` で現状確認してからユーザーに提示

```bash
# 現状確認
source .env.production && curl -s \
  "$SUPABASE_URL/rest/v1/general_questions?select=questioner_name,publish_status&council_session_id=eq.<SESSION_ID>&order=question_order.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -c "
import json, sys
qs = json.load(sys.stdin)
draft = [q['questioner_name'] for q in qs if q['publish_status'] == 'draft']
pub = [q['questioner_name'] for q in qs if q['publish_status'] == 'published']
print(f'draft: {len(draft)}件  published: {len(pub)}件')
if draft: print('  draft:', ', '.join(draft))
"
```

3. 確認を得てから PATCH:

```bash
source .env.production && curl -s -X PATCH \
  "$SUPABASE_URL/rest/v1/general_questions?council_session_id=eq.<SESSION_ID>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"publish_status": "published"}' | python3 -c "
import json, sys; print(f'更新: {len(json.load(sys.stdin))}件')"
```

---

## セッションID

```bash
source .env.production && curl -s \
  "$SUPABASE_URL/rest/v1/council_sessions?select=slug,id,name&order=created_at.desc&limit=5" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -m json.tool
```

| slug | id | 定例会名 |
|---|---|---|
| r8-1 | `7e80877e-961d-43db-9baa-8ef0a2bbd99d` | 令和8年第1回定例会 |
| r7-4 | `fd76e4ec-cd1c-482b-8e92-58f7f28b26f6` | 令和7年第4回定例会 |

---

## AI生成コンテンツの品質基準

`seed-general-questions.ts` の `buildPrompt` が生成に使う制約と同じ基準で確認する。

### タイトルの書き方
- **会議録に登場する語は変えない**: 行政略語・専門用語はそのまま（誤った言い換えは事実誤認になる）
- **カテゴリキーワードを含める**: タイトルにキーワードがないと「その他」に落ちる
  - NG: 「プッシュ型情報発信の強化」（防災の話題でも「その他」になる）
  - OK: 「**火災警報**のプッシュ型情報発信強化」

### Qサマリーの文体
- NG: 「〜を**質した**」「〜を**問いただした**」（議会報告調・対立的ニュアンス）
- OK: 「〜を確認した」「〜を求めた」「〜について質問した」

### answerer_role の書き方
- 「○○局長（氏名）・市長（氏名）」のように役職と氏名をセットで格納
- `answerer_name` は **空にする**（UIで `answerer_role` と連結表示するため二重になる）

---

## カテゴリ分類（8カテゴリ）

`web/src/features/general-questions/shared/utils/build-topic-groups.ts` の `CATEGORY_MAP` が参照する。

| カテゴリ | 代表キーワード |
|---|---|
| 子育て・教育 | 保育, 学校, 教育, 不登校, 教員 |
| 健康・医療 | ワクチン, コロナ, 健康, HPV |
| 防災・安全 | 防災, 耐震, 火災, 発令, 警報 |
| 高齢者・福祉 | 高齢者, 介護, 老人, 孤立 |
| 交通・まちづくり | 交通, 道路, まちづくり, 再開発 |
| 環境・脱炭素 | 環境, 太陽光, 温室効果, ごみ |
| スポーツ・文化 | スポーツ, 博物館, 公民館, スタジアム |
| 地域・国際交流 | 地域, 農業, 観光, 外国人, 動物 |

> キーワードを追加・削除すると**既存の全トピックの分類に影響する**。変更後はテーマ別ビューを目視確認すること。

---

## 関連ファイル

```
packages/seed/akitakata/
  seed-general-questions.ts   # 作成スクリプト（PDFテキスト→AI構造化→DB登録）

web/src/features/general-questions/
├── shared/utils/build-topic-groups.ts   # カテゴリ分類ロジック
├── server/repositories/general-questions-repository.ts
└── client/components/
    ├── question-chat-view.tsx          # チャット形式（採用デザイン）
    └── question-view-toggle.tsx        # 要約/原文切り替えトグル（採用デザイン）
```
