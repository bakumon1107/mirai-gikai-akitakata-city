# 記者会見スキル チャットベース化 設計書

作成: 2026-05-24

---

## 背景・現状分析

### 現在のフロー

```
YouTube動画（市長定例記者会見）
 ↓ 手動で字幕を確認・書き起こし
TypeScript DATA配列に手書き（seed-press-conferences.ts）
 ↓
tsx で実行 → DB (press_conferences / items / turns)
```

### 他ワークフローとの違い

| ワークフロー | CLI/API依存 | 現状の課題 |
|---|---|---|
| 議案登録 | あり（CLI） | CLI廃止対応が必要 |
| 一般質問 | あり（CLI） | CLI廃止対応が必要 |
| **記者会見** | **なし** | **手書きデータ作成の工数が大きい** |

記者会見は CLI/API 依存がないため「移行」ではなく「**新規自動化**」として設計する。

---

## 目的

YouTube動画URLを渡すだけで、Claude（この会話）がYouTube字幕を取得・構造化し、
DBへの登録までを行う。**手書き作業をゼロにする。**

---

## 新フロー

```
YouTube URL
 ↓ yt-dlp で字幕（VTT）を取得（Bash）
字幕テキスト（VTT → プレーンテキスト）
 ↓ Claude（この会話）が読んで構造化JSON生成
press-conference-input.json
 ↓ ingest-press-conferences.ts
DB (press_conferences + press_conference_items + press_conference_turns)
```

---

## スキル呼び出しパターン（新規作成）

```
/press-conference-akitakata <YouTube_URL>          # 新規登録
/press-conference-akitakata review <slug>          # 登録済みデータのレビュー・修正
/press-conference-akitakata publish <slug>         # status を published に変更
```

---

## 詳細フロー

### ステップ1: YouTube字幕を取得

```bash
# yt-dlp がない場合: pip install yt-dlp
yt-dlp --write-auto-sub --sub-lang ja --skip-download \
  --sub-format vtt -o /tmp/press-conf \
  "<YouTube_URL>"
# /tmp/press-conf.ja.vtt が生成される
```

**VTT → プレーンテキスト変換**:

```bash
# VTTタグ・タイムスタンプ・重複行を除去してテキスト化
python3 - << 'EOF'
import re, sys
text = open("/tmp/press-conf.ja.vtt").read()
# タイムスタンプ行・WEBVTT行を除去
text = re.sub(r'WEBVTT.*?\n', '', text)
text = re.sub(r'\d{2}:\d{2}:\d{2}\.\d{3} --> .*?\n', '', text)
text = re.sub(r'<[^>]+>', '', text)          # タグ除去
text = re.sub(r'\n{2,}', '\n', text)          # 連続改行を圧縮
# 重複行を除去（YouTube自動字幕は重複しやすい）
lines = text.split('\n')
deduped = [l for i,l in enumerate(lines) if i==0 or l != lines[i-1]]
print('\n'.join(deduped))
EOF > /tmp/press-conf-clean.txt
```

### ステップ2: Claude（この会話）が構造化JSON生成

Claude が `/tmp/press-conf-clean.txt` を Read し、以下のJSONを生成して
`/tmp/press-conference-input.json` に Write する。

#### 出力形式

```json
{
  "slug": "YYYY-MM-DD",
  "title": "令和X年X月 市長定例記者会見",
  "heldAt": "YYYY-MM-DD",
  "youtubeUrl": "https://www.youtube.com/watch?v=XXXX",
  "status": "draft",
  "items": [
    {
      "itemType": "announcement",
      "orderIndex": 0,
      "title": "案件タイトル（30文字以内）",
      "summary": "案件の要約（3〜5文、具体的な数値・日程を含む）",
      "turns": []
    },
    {
      "itemType": "qa",
      "orderIndex": 5,
      "title": "質疑のテーマ（30文字以内）",
      "summary": null,
      "turns": [
        {
          "speaker": "reporter",
          "speakerName": "中国新聞",
          "content": "記者の質問内容（原文に近い形で）",
          "orderIndex": 0
        },
        {
          "speaker": "mayor",
          "speakerName": null,
          "content": "市長の答弁内容（原文に近い形で）",
          "orderIndex": 1
        }
      ]
    }
  ]
}
```

#### AIプロンプト（スキルに埋め込む）

```
以下は安芸高田市の市長定例記者会見のYouTube自動字幕テキストです。
会見の内容を構造化JSONに変換してください。
出力はJSONのみ。

## 構造のルール
- itemType "announcement": 市長が発表した案件（冒頭の発表事項）
- itemType "qa": 記者との質疑応答（1つのテーマにつき1 item）
- turns: qa の各発言。speaker は "reporter" または "mayor"
- speakerName: 記者所属（「中国新聞」「NHK」等、読み取れない場合はnull）
- summary（announcement）: 具体的な数値・日程・対象を含む3〜5文の要約
- summary（qa）: null のまま（turns に内容を入れる）
- slug: 会見日を YYYY-MM-DD 形式で（字幕から推定できなければ別途確認）

## 注意
- 自動字幕のため誤字・固有名詞の誤認識がある場合は文脈から補正する
- 1つの質疑が複数ターン（記者→市長→記者→市長）になる場合も順番通り turns に含める
- 司会や事務局の発言は除外する

## 字幕テキスト
{字幕テキスト}
```

### ステップ3: DBに投入

汎用スクリプト `ingest-press-conferences.ts` を実行：

```bash
source .env.production && \
pnpm --filter @mirai-gikai/seed exec tsx akitakata/ingest-press-conferences.ts \
  /tmp/press-conference-input.json
```

- slug が既存の場合はスキップ（再実行安全）
- `status: "draft"` で登録（publishはレビュー後）

### ステップ4: レビュー・修正

```bash
source .env.production && curl -s \
  "$SUPABASE_URL/rest/v1/press_conferences?select=id,slug,title,status,press_conference_items(title,item_type,summary,press_conference_turns(speaker,content))&slug=eq.<SLUG>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -m json.tool
```

レビュー観点:
- 固有名詞（地名・人名・事業名）の誤記がないか
- 数値・日程が正確か（自動字幕は数字が誤認識されやすい）
- Q&A の区切りが正しいか（1テーマ = 1 item になっているか）
- announcement の summary が具体的か

### ステップ5: 公開

```bash
source .env.production && curl -sf -X PATCH \
  "$SUPABASE_URL/rest/v1/press_conferences?slug=eq.<SLUG>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}'
```

---

## 新規スクリプト仕様

### `ingest-press-conferences.ts`（汎用）

**役割**: JSONファイルを読み込んでDBに3テーブル連鎖でINSERT

**処理内容**:
1. JSONを読み込み
2. `press_conferences` テーブルに INSERT（slug で重複チェック・既存はスキップ）
3. `press_conference_items` テーブルに INSERT（press_conference_id を引き継ぎ）
4. `press_conference_turns` テーブルに INSERT（press_conference_item_id を引き継ぎ）

**引数**: `<press-conference-input.json のパス>`

---

## 既存スクリプトの扱い

| ファイル | 対応 |
|---|---|
| `seed-press-conferences.ts` | **廃止予定**（過去データはそのままDBに残る。新規追加は `ingest-press-conferences.ts` に統一） |
| `ingest-press-conferences.ts` | **新規作成** |

---

## コンテキスト使用量の目安

1回の記者会見（字幕テキスト）は概ね **1〜2万文字**（≒1万トークン前後）。
200Kトークンウィンドウで1会見を1ターンで処理できる。

---

## YouTube字幕の品質について

- 自動生成字幕のため固有名詞・数字に誤認識がある
- 手動字幕がある場合は `--sub-lang ja` で取得できる（品質が高い）
- 品質確認はレビュー（ステップ4）で対応

---

## 移行手順

1. `ingest-press-conferences.ts` を実装・テスト
2. `SKILL.md` を新規作成（`/press-conference-akitakata`）
3. 次回会見から本番運用
4. 旧 `seed-press-conferences.ts` の DATA 配列への手書き追加を停止

---

## 関連ファイル

```
.claude/skills/press-conference-akitakata/SKILL.md   ← 新規作成
packages/seed/akitakata/
  seed-press-conferences.ts          ← 廃止予定（参照用に残す）
  ingest-press-conferences.ts        ← 新規作成
```

## DB テーブル構造（参考）

```
press_conferences
  id, slug, title, held_at, youtube_url, status

press_conference_items
  id, press_conference_id, item_type, order_index, title, summary

press_conference_turns
  id, press_conference_item_id, speaker, speaker_name, content, order_index
```
