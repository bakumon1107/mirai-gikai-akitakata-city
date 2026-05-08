---
name: general-questions
description: 一般質問機能の設計・データ管理・UI決定事項のリファレンス
---

# 一般質問機能 リファレンス

## UI設計の決定事項

### セッション一覧ページ `/sessions/[slug]/questions`
**テーマ別市民向けビュー**を採用（2026-05-01 確定）。

- `SessionTopicsView` コンポーネント（Server Component）
- `buildTopicGroups()` でトピックを8カテゴリに自動分類
- 市の答弁を先に・大きく表示（課題より結果を前面に）
- 「質疑の詳細→」で個人ページへ遷移

### 個人詳細ページ `/questions/[id]`
**要約／原文の切り替えトグル**を採用（2026-05-08 確定）。

- `raw_text` と `topics` 両方ある場合 → `QuestionViewToggle`（Client Component）でトグル切り替え
  - デフォルト「要約」: `QuestionChatView`（トピックAIサマリーのチャット形式）
  - 「詳しく（原文）」: `RawTranscriptContent`（原文逐語録、トピックタイトルが区切りとして挿入される）
- どちらか一方のみの場合は従来通り単体表示
- トピックタイトルの挿入位置はターン数をトピック数で等分した比例配置（近似）

## カテゴリ分類（8カテゴリ）

| カテゴリ | アイコン | カラー | 代表キーワード |
|---|---|---|---|
| 子育て・教育 | Baby | sky | 保育, 学校, 教育, 不登校, 教員 |
| 健康・医療 | Stethoscope | teal | ワクチン, コロナ, 健康, HPV |
| 防災・安全 | Shield | orange | 防災, 耐震, 火災, 発令, 警報 |
| 高齢者・福祉 | Heart | rose | 高齢者, 介護, 老人, 孤立 |
| 交通・まちづくり | Building2 | violet | 交通, 道路, まちづくり, 再開発 |
| 環境・脱炭素 | Leaf | emerald | 環境, 太陽光, 温室効果, ごみ |
| スポーツ・文化 | Trophy | indigo | スポーツ, 博物館, 公民館, スタジアム |
| 地域・国際交流 | Globe | amber | 地域, 農業, 観光, 外国人, 動物 |

キーワード追加が必要な場合は `build-topic-groups.ts` の `CATEGORY_MAP` を編集する。

> ⚠️ **CATEGORY_MAP を変更する際の注意**: キーワードの追加・削除は既存の全トピックの分類に影響する。変更後は **全議員の全トピックが意図したカテゴリに分類されているか** 必ず確認すること。特にキーワードを削除する場合、そのキーワードに依存していた既存トピックが「その他」に落ちる可能性がある。変更前後で `buildTopicGroups(全データ)` の結果を比較するか、テーマ別ビューを目視確認すること。

## 関連ファイル

```
web/src/features/general-questions/
├── shared/
│   ├── types/index.ts                          # GeneralQuestion 型定義
│   └── utils/
│       ├── build-topic-groups.ts               # カテゴリ分類ロジック（純粋関数）
│       └── build-topic-groups.test.ts          # テスト
├── server/
│   ├── repositories/general-questions-repository.ts
│   ├── loaders/
│   │   ├── get-general-questions-by-session.ts
│   │   ├── get-general-question-by-id.ts
│   │   └── get-latest-session-with-questions.ts  # トップページバナー用
│   └── components/
│       ├── session-topics-view.tsx             # テーマ別一覧（採用デザイン）
│       ├── raw-transcript-view.tsx             # 原文表示（raw_textのみの場合）
│       └── general-question-list.tsx           # 旧リスト（未使用）
└── client/
    └── components/
        ├── question-chat-view.tsx              # チャット形式（採用デザイン）
        ├── question-view-toggle.tsx            # 要約/原文切り替えトグル（採用デザイン）
        └── general-question-topics.tsx         # 旧アコーディオン（未使用）
```

## データ管理

### シードデータの場所
```
packages/seed/akitakata/
  seed-general-questions.ts  # 安芸高田市版シードスクリプト（要更新）
```

### publish_status の管理
現状は **admin UIなし**。DBを直接更新する（2026-04-28 時点の設計書あり）。

```bash
# 本番DBで公開状態に変更（db-access スキルの接続情報を使用）
source .env.production
curl -s -X PATCH "$SUPABASE_URL/rest/v1/general_questions?council_session_id=eq.<session_id>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"publish_status": "published"}'
```

### トップページバナー
`GeneralQuestionsBanner` が `get-latest-session-with-questions.ts` で最新の公開済みセッションを動的取得し、`/sessions/[session_slug]/questions` へリンクする。

## トピックタイトル・サマリーの市民向け品質基準

`topics` のタイトル・Qサマリー・Aサマリーは **市民が読む前提** で記述する。

### タイトルの品質基準
- **原文（会議録）に登場する語は変えない**: 「住市総」「公衆衛生医師」「プッシュ型採用広報」など、元の会議録で使われている行政略語・専門用語はそのまま使うこと。誤った言い換えは事実誤認になり、専門語のままの方が安全
- **AI生成で追加した要約語は平易に**: あくまで会議録に存在しないAI生成の補足語・タイトル補完部分を平易にする
- **複合専門語の連続**: タイトルが著しく長くて難解な場合は、原文の語を保ちつつ短くすることを検討する

### タイトルとカテゴリ分類の整合（重要）
`build-topic-groups.ts` の `CATEGORY_MAP` はタイトルのキーワードで分類先を判定する。**タイトルにカテゴリキーワードが含まれないと「その他」に落ちる**。

- 例: 防災系の話題でも「プッシュ型情報発信の強化」というタイトルだと「その他」になる
- → 「**火災警報**のプッシュ型情報発信強化」のようにカテゴリキーワードを含めること

### Qサマリーの文体
- NG: 「〜を**質した**」「〜を**問いただした**」（議会報告調・対立的ニュアンス）
- OK: 「〜を確認した」「〜を求めた」「〜について質問した」

### 複数答弁者の書き方
- `answerer_role`: 「○○局長（氏名）・市長（氏名）」のように役職と氏名をセットで格納
- `answerer_name`: 空にする（UIで `role` と `name` を連結表示するため二重になる）

## AI生成コンテンツの更新ルール

`general_questions.topics` の JSON（要約・答弁者など）を更新する際は **必ずユーザーにレビューを提示してからPATCHを実行すること**。

確認観点：
1. 日本語の自然さ（語尾・助詞・文体）
2. 答弁者の役職と担当内容が一致しているか
3. 中国語漢字の混入がないか
4. 複数トピックをまたぐ場合、A議案の情報がB議案に混入していないか

（CLAUDE.md「AI生成コンテンツのDB更新ルール」も参照）

## 今後の課題（設計書参照）

- Admin UIによる publish_status 管理（設計書: `docs/fukuoka/20260428_1100_一般質問管理画面設計書.md`）
- 新定例会データのインポートフロー整備
- カテゴリ分類の精度向上（AI分類への移行検討）
