---
name: bill-registration-akitakata
description: 安芸高田市議会の新しい定例会の議案をDBに追加登録する。市議会URLから議案一覧を取得してseedスクリプトを作成・実行し、AI解説（bill_contents）まで生成する。
---

# 安芸高田市 議案追加登録スキル

## 固定値（変わらない限り使い回す）

> **新しい定例会を追加するたびに、下記セッションIDテーブルを更新すること。**
> IDはDBから取得する:
> ```bash
> source .env.production && curl -s \
>   "$SUPABASE_URL/rest/v1/council_sessions?select=slug,id,name&order=created_at.desc" \
>   -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
>   -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -m json.tool
> ```

### セッションID
| slug | id | 定例会名 |
|---|---|---|
| r8-3 | `8b52966d-8bda-4254-bbb0-9f5516eeeff6` | 令和8年第3回定例会 |
| r8-2 | `83116aa6-1678-4f7e-8343-5c1c4fea1f08` | 令和8年第2回定例会 |
| r8-1 | `7e80877e-961d-43db-9baa-8ef0a2bbd99d` | 令和8年第1回定例会 |
| r7-4 | `fd76e4ec-cd1c-482b-8e92-58f7f28b26f6` | 令和7年第4回定例会 |

### 委員会ID
| 名称 | id |
|---|---|
| 総務文教常任委員会 | `bf7b0596-a28f-4074-af9e-10b7c09e7dae` |
| 産業厚生常任委員会 | `0b0384f5-387a-4fbb-88fe-526151f29aaf` |
| 予算決算常任委員会 | `5fea66aa-c920-4705-9e76-bad67f1a30bd` |

## 呼び出しパターン

```
/bill-registration-akitakata <URL>           # 通常登録（メインフロー）
/bill-registration-akitakata dryrun <URL>    # ドライラン（DB差分確認のみ・ファイル作成・実行なし）
```

`dryrun` の場合: 手順 1〜2 だけ実行して差分レポートを出し、手順 3 以降は行わない。
スキルの品質確認・登録前の事前チェックに使う。

---

## 手順

### 1. 市議会URLから議案一覧を取得

`WebFetch` は表を要約して落とすので**使わない**。生HTMLを取得して全行パースすること。

```bash
curl -sL "<議案及び議決結果のURL>" -o /tmp/giketu.html
```

抽出対象は議案だけでなく **認定・承認・同意・諮問・発議のすべての行**。
各行の「議案原文PDF」と「＜説明資料＞PDF」を取り違えないよう、リンクテキストで区別する。

#### 会期（start_date / end_date）の調べ方
議決結果ページに会期は載っていない。`本会議日程` ページ
（`/ja/parliament/nittei/<id>/`）を見るが、**日程表は本文ではなくJPG画像で貼られている**。
`src=` の画像URLを落として `Read` で読む。開会日は議案PDF1ページ目の提出日とも一致する。

### 2. DBの現状確認

```bash
source .env.production && curl -s "$SUPABASE_URL/rest/v1/bills?select=id,bill_number,name&council_session_id=eq.<SESSION_ID>&order=bill_number.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -m json.tool
```

### 3. PDFダウンロード

先に手順4の `bills-<session>-data.ts`（PDF URLを含むメタデータ）を作り、
`download-pdfs-<session>.ts` でそこからダウンロードする。
URLをシェルスクリプトに書き写さないこと（二重管理になり、ずれても気付けない）。

- 保存先: `/tmp/akitakata-pdfs-<session>/gian<number>.pdf`
- 発議は `gianh<number>.pdf`、認定は `giannin<number>.pdf`
- 説明資料は `<pdfKey>-setsu.pdf`
- 参考: `download-pdfs-r8-3.ts`

```bash
pnpm --filter @mirai-gikai/seed exec tsx akitakata/download-pdfs-<session>.ts
```

### 4. seedスクリプト作成（分割必須）

**AI生成と同時にDBへ書き込むスクリプトを本番DBに向けて実行してはいけない。**
必ずローカルにJSONを書き出し、レビューを通してから投入する。r8-3 一式を雛形にする。

| ファイル | 役割 |
|---|---|
| `bills-<session>-data.ts` | 議案メタデータ（会期・委員会・PDF URL）。他3本が参照する |
| `download-pdfs-<session>.ts` | `BILLS` からPDFを一括ダウンロード |
| `generate-bill-contents-<session>.ts` | AI解説を `/tmp/bill-contents-<session>/` にJSON出力。**DB書き込みなし** |
| `ingest-bills-<session>.ts` | レビュー後にセッション・議案・bill_contents をDB投入。`--dry-run` 対応 |

共通処理（`extractPdfText` / `callClaude` / `ensureSession` / `ensureBill` /
`insertContent` 等）は `packages/seed/akitakata/lib/bill-pipeline.ts` にある。
**新しい定例会で書き写すのはデータ定義だけ**にし、ロジックはlibに足すこと。

どれも出力済み/登録済みはスキップするので、途中で止まっても再実行で続きから進む。

#### PDFのURLはデータ定義に一本化する
ダウンロード用スクリプトにURLを書き写すと、DBの `pdf_url` が指すPDFと
AIが読んだPDFがずれるという気付きにくい事故になる。
`BillMeta.pdfUrl` / `BillMeta.setsuUrl` を唯一の情報源にし、
ダウンロードはそこから組み立てる。

#### `pdf_url` の設定（必須）
議案詳細ページに「議案原文（PDF）」ボタンを表示するため、INSERT 時に `pdf_url` を設定すること。
URLは手順3で作成したダウンロードスクリプトの各議案のURLをそのまま使う
（`bills-<session>-data.ts` の `pdfUrl` に持たせ、ingest 側でそのまま渡す）。

```typescript
await supabase.from("bills").insert({
  name: meta.name,
  bill_number: meta.billNumber,
  council_session_id: SESSION_ID,
  committee_id: meta.committeeId,
  status: "submitted",
  publish_status: "published",
  published_at: new Date("20XX-XX-XX").toISOString(),
  pdf_url: meta.pdfUrl,  // ← 必ず設定する
});
```

PDFが存在しない議案（同意案件・諮問案件など）は `null` でよい。
**過去にスクリプトで `pdf_url` を設定し忘れた場合は、PATCH で直接更新する:**
```bash
source .env.production && curl -s -X PATCH "$SUPABASE_URL/rest/v1/bills?id=eq.<BILL_ID>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"pdf_url": "<URL>"}'
```

#### pdftotext は必ず `-layout` を付ける（重要）
議案書の本体は新旧対照表・予算表などの表組みで、`-layout` なしだと列が混ざり
**AIが金額を取り違える**。実際に議案第48号で手当額を「1,080円→1,440円」ではなく
「2,160円→2,880円」と誤記した。決算書は大部なので `-l 30` でページ数も絞る。

```typescript
execSync(`pdftotext -layout -l 30 "${pdfPath}" -`, { maxBuffer: 64 * 1024 * 1024 });
```

#### プロンプトに入れる制約
- 金額・条番号・日付は与えられたテキストにある値だけを使わせる。
- 法令名・規則番号は資料に明記されたものだけ。推測で番号を補わせない
  （「人事院規則」としか書かれていないのに `人事院規則9-30` と書いた実績あり）。
- PDF未公開の案件は専用プロンプトで制度の一般論だけを書かせ、
  候補者名・金額・期日などの固有情報を一切書かせない。

#### 生成後のレビュー（省略不可）
JSONの数値をPDFと突き合わせる。特に補正予算は
「既定の総額から歳入歳出それぞれ N 千円を減額し、総額を M 千円とする」の N と M を確認する。

#### bill_number の命名規則
- 通常議案: 議案番号そのまま（例: "64", "65"）
- 発議: "h" + 番号（例: "h5"）
- 承認案件（専決処分）: "sho" + 番号（例: "sho2", "sho3"）
- 同意案件: "doi" + 番号（例: "doi3"）
- 認定案件（決算認定）: "nin" + 番号（例: "nin1"）
- 諮問案件: "shi" + 番号（例: "shi4"）

表示は `web/src/features/bills/shared/utils/format-bill-number.ts` が
プレフィックスを見て「認定第1号」等に変換する。**新しいプレフィックスを増やしたら
このユーティリティとテストにも追加すること**（未対応だと生の `nin1` がそのまま出る）。

#### 委員会の割り当て目安
- 給与・組織・火災予防・議員報酬・行政手続き・教育施設工事 → 総務文教
- 福祉・産業・財産区・施設・下水道・火入れ・国保・体育施設 → 産業厚生
- 補正予算・本予算 → 予算決算
- **決算認定（認定第N号）は財産区分も含めてすべて予算決算**（日程表の「決算審査」が予算決算常任委員会になっている）

#### bill_contents が無い議案は一覧に出ない
リポジトリの取得クエリが `bill_contents!inner` なので、AI解説が1件も無い議案は
議案一覧にも詳細にも出てこない。PDF未公開の案件も必ず解説を用意すること。

同意（人事案件）・諮問は個人情報を含むため市議会HPに原文が載らない。
取りこぼした場合はセッション非依存の以下で埋める（議案名と定例会名はDBから引くので
引数に書き写す必要はない）。

```bash
# 解説が欠けている議案を自動検出して生成（DB書き込みなし）
pnpm --filter @mirai-gikai/seed exec tsx akitakata/generate-no-pdf-contents.ts <slug> [議案番号...]

# レビュー後に投入
pnpm --filter @mirai-gikai/seed exec tsx akitakata/ingest-no-pdf-contents.ts <slug> [議案番号...] [--dry-run]
```

**登録後に `generate-no-pdf-contents.ts <slug>` を引数なしで実行し、
「解説が欠けている議案はありません」と出ることを確認すること**（取りこぼし検出に使える）。

#### 新セッション登録時の is_active 管理（重要）
新しいセッションを `is_active: true` で作成する前に、**必ず既存のアクティブセッションを `is_active: false` に更新してから**新セッションを INSERT すること。

`findActiveCouncilSession` は `.maybeSingle()` を使用しており、`is_active: true` が複数存在すると **null を返す**（全セッションの議案が表示される）。

```bash
# 1. 旧セッションを先に非アクティブ化
source .env.production && curl -s -X PATCH "$SUPABASE_URL/rest/v1/council_sessions?is_active=eq.true" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'

# 2. 新セッションを is_active: true で INSERT
```

### 5. 実行（必ずこの順番・このコマンドパターンで）

```bash
# 5-0. PDFダウンロード
pnpm --filter @mirai-gikai/seed exec tsx akitakata/download-pdfs-<session>.ts

# 5-1. AI解説をローカル生成（DBに触れないので env 不要）
pnpm --filter @mirai-gikai/seed exec tsx akitakata/generate-bill-contents-<session>.ts

# 5-2. 生成JSONをPDFと突き合わせてレビュー（省略不可）

# 5-3. 投入内容の確認
source .env.production && \
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
pnpm --filter @mirai-gikai/seed exec tsx akitakata/ingest-bills-<session>.ts --dry-run

# 5-4. 本番DBへ投入
source .env.production && \
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
pnpm --filter @mirai-gikai/seed exec tsx akitakata/ingest-bills-<session>.ts
```

5-1 は議案数×2回 `claude` CLI を呼ぶので30分〜1時間かかる。
バックグラウンド実行し、クレジット切れ等で落ちても再実行すれば続きから進む。

**ポイント:**
- `.env.production` の変数名は `SUPABASE_URL` だがスクリプトは `NEXT_PUBLIC_SUPABASE_URL` を参照するため再マップ必須
- `tsx` はグローバルに入っていないので `pnpm --filter @mirai-gikai/seed exec` 経由で実行
- パスは seed パッケージルートからの相対パス（`packages/seed/akitakata/...` ではなく `akitakata/...`）

## PDF変換ツール

PDFテキスト抽出には `pdftotext` を使用（`poppler-utils` パッケージ）。
表組みを読む用途なので **`-layout` を必ず付ける**。

```bash
pdftotext -layout "/tmp/akitakata-pdfs-<session>/gian64.pdf" -
```

## トラブルシューティング

### Claude CLI が "Execution error" になる

**原因**: `~/.local/bin/claude` に古いバージョンが残っており、nvm 経由でインストールした新版より優先されていた。

**確認方法**:
```bash
claude --version   # 現在のバージョン
which claude       # どのパスが使われているか
```

**修正方法**:
```bash
npm install -g @anthropic-ai/claude-code   # 最新版をインストール
# which claude で表示されたパスと nvm版のパスを symlink で合わせる
claude --version  # 2.1.143以上になっていることを確認
```

### Claude CLI のレスポンスが ` ```json {...} ``` ` 形式になりJSON抽出が失敗する

新バージョンの Claude はコードブロックで JSON を返すことがある。`callClaude` の正規表現を以下のように修正する:

```typescript
// コードブロック内のJSONも拾う
const jsonMatch = raw.match(/```json\s*(\{[\s\S]*?\})\s*```/) ?? raw.match(/\{[\s\S]*\}/);
if (!jsonMatch) return null;
const jsonStr = jsonMatch[1] ?? jsonMatch[0];
return JSON.parse(jsonStr) as BillContentResult;
```
