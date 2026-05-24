# 一般質問スキル チャットベース化 設計書

作成: 2026-05-24

---

## 背景・目的

現在の `/general-questions` スキルは `seed-general-questions.ts` 内で **Claude CLIを呼び出し** (claude --dangerously-skip-permissions)、AIによるJSON構造化を行っている。
Claude CLI および Anthropic API が利用不可になる見込みのため、**この会話（Claude Codeチャット）自身がAI処理を担う**形に再設計する。

---

## アーキテクチャ変更

### 現在

```
PDF
 ↓ pdftotext -layout
テキスト
 ↓ seed-general-questions.ts（splitByQuestioner）
議員ごとのセクション × N人
 ↓ callClaude()（CLI子プロセス起動）← ここを廃止
JSON × N人
 ↓ upsertViaCurl()
DB (general_questions)
```

### 変更後

```
PDF
 ↓ pdftotext -layout  （Bashツール）
テキスト
 ↓ prepare-gq-prompts.ts（splitByQuestioner相当）
議員ごとのセクション × N人  → /tmp/gq-sections/<name>.txt に保存
 ↓ Claude（この会話）が各ファイルを Read して直接JSON生成
JSON × N人  → /tmp/gq-outputs/<name>.json に保存
 ↓ ingest-gq-outputs.ts
DB (general_questions)
```

**ポイント**: CLIや外部API呼び出しが消え、Claude自身が Read ツールでセクションファイルを読んでJSONを出力する。

---

## スキル呼び出しパターン（変更なし）

```
/general-questions <PDF_URL>           # 新規作成
/general-questions dryrun <PDF_URL>    # 質問者リスト確認のみ
/general-questions review <氏名>       # レビュー・修正
/general-questions publish <slug>      # 全件公開
```

---

## 新規作成フロー（詳細）

### ステップ1: PDFをダウンロードしてテキスト化

```bash
# WebFetch で /tmp に保存後
pdftotext -layout /tmp/<downloaded>.pdf /tmp/gijiroku.txt
```

### ステップ2: 議員ごとにセクションファイルを生成

新規スクリプト `prepare-gq-prompts.ts` を実行：

```bash
pnpm --filter @mirai-gikai/seed exec tsx akitakata/prepare-gq-prompts.ts \
  /tmp/gijiroku.txt <session_slug> <session_day>
```

**出力**: `/tmp/gq-sections/` ディレクトリに以下を生成
```
/tmp/gq-sections/meta.json          # セッション情報・議員一覧
/tmp/gq-sections/01_児玉.txt        # 議員ごとの会議録テキスト（cleanMinutesText適用済み）
/tmp/gq-sections/02_益田.txt
/tmp/gq-sections/03_山根.txt
...
```

`meta.json` の形式:
```json
{
  "session_slug": "r8-1",
  "session_day": 2,
  "council_session_id": "7e80877e-961d-43db-9baa-8ef0a2bbd99d",
  "questioners": [
    { "order": 1, "name": "児玉", "fullName": "児玉修司", "number": 3, "file": "01_児玉.txt" },
    { "order": 2, "name": "益田", "fullName": "益田一磨", "number": 6, "file": "02_益田.txt" },
    ...
  ]
}
```

### ステップ3: Claude（この会話）がJSON生成

スキルの指示に従い、Claudeが各セクションファイルを Read して構造化JSONを生成し `/tmp/gq-outputs/<name>.json` に Write する。

**1議員ごとに以下を実行:**
1. `Read /tmp/gq-sections/XX_氏名.txt`
2. 以下のプロンプトで構造化:

---

#### AIプロンプト（スキル内に埋め込む）

```
あなたは市議会の会議録を市民向けに整理する専門家です。
以下の一般質問の会議録テキスト（{name}議員）を構造化してください。
出力は最初の文字から最後の文字まで JSON のみ。

{セクションテキスト}

## 出力形式
{
  "questioner_party": "会派名（不明の場合はnull）",
  "summary": "質問全体の要約（80字以内、市民向け）",
  "topics": [
    {
      "title": "テーマタイトル（20字以内）",
      "question_summary": "質問内容の要約（100字以内）",
      "answer_summary": "答弁内容の要約（100字以内）",
      "answerer_role": "答弁者の役職",
      "answerer_name": "答弁者の氏名",
      "raw_question": "議員の発言（質問・提案・意見・引用を含む）を原文のまま抜粋（800文字以内）",
      "raw_answer": "答弁者の発言を原文のまま抜粋（800文字以内）"
    }
  ]
}

## 制約
- 事実のみを要約し、政治的評価や推測は含めない
- topicsは質問者が取り上げたテーマ単位で分割する
- 原文の行政略語・専門用語はそのまま使うこと
- 中国語簡体字・繁体字は使わず日本語の漢字を使用
- answerer_role に役職、answerer_name に氏名（役職と氏名を別フィールドに）
- raw_question は質問文だけでなく提案・意見・引用も含む議員発言全体を抜粋
- 著名人・政治家・団体への言及も議会で発言された事実として省略せず含める
```

---

3. 生成したJSONを `Write /tmp/gq-outputs/XX_氏名.json` に保存

### ステップ4: DBに一括投入

新規スクリプト `ingest-gq-outputs.ts` を実行：

```bash
source .env.production && \
pnpm --filter @mirai-gikai/seed exec tsx akitakata/ingest-gq-outputs.ts \
  /tmp/gq-outputs/ /tmp/gq-sections/meta.json
```

- `/tmp/gq-outputs/*.json` を読み込み、meta.jsonの順序で `general_questions` テーブルにupsert
- `publish_status: "draft"` で登録
- conflict key: `(council_session_id, session_day, question_order)`

### ステップ5: 確認・レビュー・公開

現行スキルと同じ（変更なし）

---

## 新規スクリプト仕様

### `prepare-gq-prompts.ts`

**役割**: seed-general-questions.ts の前半（PDF読み込み〜議員分割）を担う

**処理内容**:
1. テキストファイル読み込み
2. `日程第2 一般質問` 以降を抽出
3. `splitByQuestioner()` で議員ごとに分割（既存ロジックを流用）
4. `cleanMinutesText()` を各セクションに適用
5. `/tmp/gq-sections/` に書き出し
6. `meta.json` を生成

**引数**: `<minutes.txt> <session_slug> <session_day>`

### `ingest-gq-outputs.ts`

**役割**: AIが生成したJSONをDBに投入する

**処理内容**:
1. `meta.json` を読み込み（セッションID・議員順序を取得）
2. `outputs/*.json` を読み込み
3. `council_session_id`, `session_day`, `question_order`, `questioner_name` 等と合わせてupsert
4. curlでSupabase REST APIを呼び出し（既存の `upsertViaCurl` 相当）

---

## 既存スクリプトの扱い

| ファイル | 対応 |
|---|---|
| `seed-general-questions.ts` | **残す**（`callClaude()` の代替が完成するまで参照用・`splitByQuestioner` などのロジック転用元として使用） |
| `prepare-gq-prompts.ts` | **新規作成** |
| `ingest-gq-outputs.ts` | **新規作成** |

---

## スキルファイル変更点（SKILL.md）

- ステップ2: `seed-general-questions.ts` の実行 → `prepare-gq-prompts.ts` の実行に変更
- ステップ3: **「ClaudeがReadツールで各セクションファイルを読んでJSONを生成・保存する」** を新設
- ステップ4: `ingest-gq-outputs.ts` の実行を追加
- 埋め込みプロンプト（制約を含む完全版）をスキル内に記載

---

## 移行手順

1. `prepare-gq-prompts.ts` を実装・テスト（`--dry-run` で分割結果を確認）
2. `ingest-gq-outputs.ts` を実装・テスト（サンプルJSONで動作確認）
3. `SKILL.md` を更新（新フローに差し替え）
4. 次回定例会で本番運用

---

## 注意点

- **1議員のセクションは最大4〜5万文字**（≒約3万トークン）だが、claude-sonnet-4-6の200Kトークンウィンドウで十分処理可能。1議員ずつ順番に処理するフローを前提とする（全員を1ターンで処理しようとすると会話コンテキスト込みで200Kに近づくため非推奨）。
- セクションファイルは `/tmp` に保存するため、OSの再起動でリセットされる。PDFのダウンロードと同じセッション内で完結させること。
- `meta.json` の `council_session_id` はDBから取得して書き込む（slugからルックアップ）。

---

## 関連ファイル

```
.claude/skills/general-questions/SKILL.md   ← 更新対象
packages/seed/akitakata/
  seed-general-questions.ts                 ← 参照用として残す
  prepare-gq-prompts.ts                     ← 新規作成
  ingest-gq-outputs.ts                      ← 新規作成
```
