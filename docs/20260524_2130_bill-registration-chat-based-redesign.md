# 議案登録スキル チャットベース化 設計書

作成: 2026-05-24

---

## 背景・目的

現在の `/bill-registration-akitakata` スキルは定例会ごとに `process-bills-XXX.ts` を手書き作成し、
内部で **Claude CLIを呼び出し** (`claude -p '...'`) `bill_contents` を生成している。
Claude CLI および Anthropic API が利用不可になる見込みのため、**この会話（Claude Codeチャット）自身がAI処理を担う**形に再設計する。
あわせて、定例会ごとにスクリプトを新規作成する手間を廃止し、汎用スクリプトに統一する。

---

## アーキテクチャ変更

### 現在

```
WebFetch（議案一覧）
 ↓
DBチェック（既存議案）
 ↓
download-pdfs-XXX.sh 作成・実行
 ↓
process-bills-XXX.ts 作成・実行（定例会ごとに手書き）
  内部: callClaude()（CLI子プロセス × 議案数 × 2難易度）← 廃止
 ↓
DB (bills + bill_contents)
```

### 変更後

```
WebFetch（議案一覧）
 ↓
DBチェック（既存議案）
 ↓
bills-meta.json 生成（議案リスト・委員会割り当て）← Claude が生成・Write
 ↓
download-pdfs-XXX.sh 作成・実行（Bash）
 ↓
prepare-bill-texts.ts 実行（PDF一括テキスト抽出）
 ↓
Claude（この会話）が各議案のPDFテキストを Read して bill_contents JSON を生成
 ↓
ingest-bills.ts 実行（bills + bill_contents を一括DB投入）
 ↓
DB (bills + bill_contents)
```

**ポイント**:
- `process-bills-XXX.ts`（定例会ごとの使い捨てスクリプト）が不要になる
- `ingest-bills.ts` は汎用スクリプトとして1本持ち回す
- 1議案のPDFテキストは最大6000文字（≒4000トークン）と短く、複数議案をまとめて処理できる

---

## スキル呼び出しパターン（変更なし）

```
/bill-registration-akitakata <URL>           # 通常登録
/bill-registration-akitakata dryrun <URL>    # ドライラン（差分確認のみ）
```

---

## 新規作成フロー（詳細）

### ステップ1: 議案一覧を取得

`WebFetch` で市議会URLから議案番号・議案名・PDF URLを全件取得（変更なし）。

### ステップ2: DBの現状確認（変更なし）

```bash
source .env.production && curl -s \
  "$SUPABASE_URL/rest/v1/bills?select=id,bill_number,name&council_session_id=eq.<SESSION_ID>&order=bill_number.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -m json.tool
```

### ステップ3: bills-meta.json を生成

Claude が議案一覧・委員会割り当てをまとめた `bills-meta.json` を `/tmp/akitakata-bills-<session>/` に Write する。

```json
{
  "session_slug": "r8-1",
  "council_session_id": "7e80877e-961d-43db-9baa-8ef0a2bbd99d",
  "bills": [
    {
      "billNumber": "1",
      "name": "安芸高田市○○条例の一部を改正する条例",
      "committeeId": "bf7b0596-a28f-4074-af9e-10b7c09e7dae",
      "pdfUrl": "https://www.akitakata.jp/.../gian1.pdf",
      "pdfFile": "gian1.pdf"
    }
  ]
}
```

#### 委員会割り当て目安（変更なし）

| 委員会 | 対象議案の種類 |
|---|---|
| 総務文教（`bf7b0596`） | 給与・組織改正・火災予防・議員報酬 |
| 産業厚生（`0b0384f5`） | 福祉・産業・財産区・施設・下水道・火入れ |
| 予算決算（`5fea66aa`） | 補正予算・本予算 |

### ステップ4: PDFダウンロード

```bash
# download-pdfs-<session>.sh を作成・実行（現行と同じ）
bash packages/seed/akitakata/download-pdfs-<session>.sh
```

### ステップ5: PDFテキストを一括抽出

汎用スクリプト `prepare-bill-texts.ts` を実行：

```bash
pnpm --filter @mirai-gikai/seed exec tsx akitakata/prepare-bill-texts.ts \
  /tmp/akitakata-bills-<session>/bills-meta.json
```

**出力**: `/tmp/akitakata-bills-<session>/texts/gian1.txt`, `gian2.txt` ... （pdftotext 結果、6000文字で切り捨て）

### ステップ6: Claude（この会話）が bill_contents を生成

Claude がテキストファイルを Read して bill_contents JSON を生成し、
`/tmp/akitakata-bills-<session>/contents/gian1_normal.json`, `gian1_hard.json` ... に Write する。

**バッチ単位**: 1ターンで5議案程度まとめて処理可能
（1議案≒4000トークン × 5 = 2万トークン + 会話コンテキスト → 200K以内で余裕）

#### AIプロンプト（スキルに埋め込む）

**normal（市民向け）**:
```
以下は安芸高田市議会の議案PDFテキストです。
市民にわかりやすく解説するbill_contentsをJSON形式で作成してください。
出力はJSONのみ。

## 出力形式
{
  "title": "市民向けの短いタイトル（30文字以内）",
  "summary": "1〜2文の概要（何をする議案かを平易に）",
  "content": "# タイトル\n\n## どんな議案？\n...\n\n## 具体的に何が変わる？\n...\n\n## 市民への影響は？\n...\n\n## 施行日\n..."
}

## 議案名
{billName}

## 議案テキスト
{pdfText}
```

**hard（専門家向け）**:
```
以下は安芸高田市議会の議案PDFテキストです。
法令・行政の専門知識を持つ読者向けに詳細なbill_contentsをJSON形式で作成してください。
出力はJSONのみ。

## 出力形式
{
  "title": "専門的タイトル（40文字以内）",
  "summary": "法的・行政的観点からの概要（条文番号・根拠法令等を含む）",
  "content": "# タイトル\n\n## 改正の背景・根拠法令\n...\n\n## 改正内容（新旧対照）\n...\n\n## 施行日・経過措置\n...\n\n## 関連条例・法令\n..."
}

## 議案名
{billName}

## 議案テキスト
{pdfText}
```

### ステップ7: DBに一括投入

汎用スクリプト `ingest-bills.ts` を実行：

```bash
source .env.production && \
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
pnpm --filter @mirai-gikai/seed exec tsx akitakata/ingest-bills.ts \
  /tmp/akitakata-bills-<session>/
```

**処理内容**:
1. `bills-meta.json` を読み込み、bills テーブルに INSERT（重複チェックあり・upsert）
2. `contents/gian*_{normal,hard}.json` を読み込み、bill_contents テーブルに INSERT（重複スキップ）

---

## 新規スクリプト仕様

### `prepare-bill-texts.ts`（汎用）

**役割**: bills-meta.json の pdfFile 一覧を読み込み、各PDFからテキストを抽出してファイルに保存

**処理内容**:
1. `bills-meta.json` を読み込み
2. 各議案の PDF に対して `pdftotext "<path>" -` を実行
3. 先頭6000文字を `/tmp/akitakata-bills-<session>/texts/<pdfFile>.txt` に保存

**引数**: `<bills-meta.json のパス>`

### `ingest-bills.ts`（汎用）

**役割**: Claude が生成した JSON ファイル群と bills-meta.json からDBに投入する

**処理内容**:
1. `bills-meta.json` → bills テーブルに upsert（bill_number + council_session_id で重複チェック）
2. `contents/*.json` → bill_contents テーブルに INSERT（bill_id + difficulty_level で重複スキップ）
3. curlでSupabase REST APIを呼び出し

**引数**: `/tmp/akitakata-bills-<session>/` ディレクトリパス

---

## ディレクトリ構造

```
/tmp/akitakata-bills-<session>/
├── bills-meta.json            # Claude が生成（議案リスト・委員会）
├── pdfs/
│   ├── gian1.pdf
│   ├── gian2.pdf
│   └── ...
├── texts/                     # prepare-bill-texts.ts が生成
│   ├── gian1.pdf.txt
│   ├── gian2.pdf.txt
│   └── ...
└── contents/                  # Claude（この会話）が生成
    ├── gian1_normal.json
    ├── gian1_hard.json
    ├── gian2_normal.json
    └── ...
```

---

## 既存スクリプトの扱い

| ファイル | 対応 |
|---|---|
| `process-bills-r7-4.ts` | **残す**（参照用・ロジック転用元。新定例会分は作成不要になる） |
| `download-pdfs-XXX.sh` | **継続作成**（各定例会のPDFダウンロードスクリプト、変更なし） |
| `prepare-bill-texts.ts` | **新規作成** |
| `ingest-bills.ts` | **新規作成** |

---

## スキルファイル変更点（SKILL.md）

- ステップ4: `process-bills-XXX.ts の作成・実行` を削除
- ステップ3: `bills-meta.json の生成` を追加（Claude がWrite）
- ステップ5: `prepare-bill-texts.ts` の実行を追加
- ステップ6: **「ClaudeがReadで各テキストを読んでbill_contents JSONを生成・Write（5議案ずつ処理）」** を新設
- ステップ7: `ingest-bills.ts` の実行を追加
- AIプロンプト（normal/hard 両方）をスキル内に埋め込む
- トラブルシューティングのCLI関連セクションを削除

---

## コンテキスト使用量の目安

| 処理単位 | テキスト量 | 推定トークン |
|---|---|---|
| 1議案（normal+hard） | 6,000文字 × 1 | ≒ 8,000トークン |
| 5議案まとめて | 6,000文字 × 5 | ≒ 40,000トークン |
| 1定例会全件（20議案） | 6,000文字 × 20 | ≒ 160,000トークン |

1定例会を一気に処理しようとすると200Kの上限に近づくため、**5議案ずつ**処理するのが安全。

---

## 移行手順

1. `prepare-bill-texts.ts` を実装・テスト
2. `ingest-bills.ts` を実装・テスト（サンプルJSONで動作確認）
3. `SKILL.md` を更新（新フローに差し替え）
4. 次回定例会で本番運用

---

## 関連ファイル

```
.claude/skills/bill-registration-akitakata/SKILL.md   ← 更新対象
packages/seed/akitakata/
  process-bills-r7-4.ts          ← 参照用として残す
  download-pdfs-r7-4.sh          ← 参照用として残す
  prepare-bill-texts.ts          ← 新規作成
  ingest-bills.ts                ← 新規作成
```
