# みらい議会ー川崎版

// 後でここにリンク貼ります

## 注意事項
- このプロジェクトは「チームみらい」が開発・運営している「みらい議会」をForkして開発したものとなります。  
- **非公式**ですので、ここでの不具合や気になる点についての問い合わせは  
  党公式ではなく[GondoTakashi](https://x.com/TakashiGondo)にご連絡ください。

## 他地方議会向けForkガイド
- 他の市議会・県議会等のバージョンを作成したい場合は、  
  以下のドキュメントを参考にすると早いと思います  
  [fork手順](docs/kawasaki/20260304_1000_別地域向けfork手順.md)

---

# みらい議会

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/team-mirai-volunteer/mirai-gikai)

## セットアップ

```bash
# Supabaseの起動
npx supabase start

# 環境変数の設定（必要に応じて.envの内容を変更してください）
cp .env.example .env

# パッケージインストール
pnpm install

# SupabaseのDB初期化, 開発用シードデータのセットアップ
pnpm db:reset

# サーバー起動
pnpm dev
```

## マイグレーション

```bash
# マイグレーションファイル生成
npx supabase migration new マイグレーション名

# マイグレーション実行 & 型ファイル更新
pnpm db:migrate
```

## Adminユーザーの作成

1. Supabase Studio上で Authentication > Add User からユーザーを作成
2. Supabase Studio上で以下のSQLを実行

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"roles": ["admin"]}'::jsonb
WHERE email = '<1で作成したユーザーのemail>';
```

> [!NOTE]
> 開発環境では、seedデータによって、`email: admin@example.com, password: admin123456` のAdminユーザーが作成されます。
