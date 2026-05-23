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

`WebFetch` で対象URLを取得し、議案番号・議案名・PDF URLを全件抽出する。

```
https://www.akitakata.jp/ja/parliament/giketu/izen/a163/
```

### 2. DBの現状確認

```bash
source .env.production && curl -s "$SUPABASE_URL/rest/v1/bills?select=id,bill_number,name&council_session_id=eq.<SESSION_ID>&order=bill_number.asc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -m json.tool
```

### 3. PDFダウンロードスクリプト作成・実行

`packages/seed/akitakata/download-pdfs-<session>.sh` を作成。

- 保存先: `/tmp/akitakata-pdfs-<session>/gian<number>.pdf`
- 発議は `gianh<number>.pdf`
- 参考: `download-pdfs-r7-4.sh`

```bash
bash packages/seed/akitakata/download-pdfs-<session>.sh
```

### 4. seedスクリプト作成

`packages/seed/akitakata/process-bills-<session>.ts` を作成。`process-bills-r7-4.ts` を参考にする。

#### bill_number の命名規則
- 通常議案: 議案番号そのまま（例: "64", "65"）
- 発議: "h" + 番号（例: "h5"）

#### 委員会の割り当て目安
- 給与・組織・火災予防・議員報酬 → 総務文教
- 福祉・産業・財産区・施設・下水道・火入れ → 産業厚生
- 補正予算・本予算 → 予算決算

### 5. 実行（必ずこのコマンドパターンを使う）

```bash
source .env.production && \
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
pnpm --filter @mirai-gikai/seed exec tsx akitakata/process-bills-<session>.ts
```

**ポイント:**
- `.env.production` の変数名は `SUPABASE_URL` だがスクリプトは `NEXT_PUBLIC_SUPABASE_URL` を参照するため再マップ必須
- `tsx` はグローバルに入っていないので `pnpm --filter @mirai-gikai/seed exec` 経由で実行
- パスは seed パッケージルートからの相対パス（`packages/seed/akitakata/...` ではなく `akitakata/...`）

## PDF変換ツール

PDFテキスト抽出には `pdftotext` を使用（`poppler-utils` パッケージ）。

```bash
pdftotext "/tmp/akitakata-pdfs-<session>/gian64.pdf" -
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
