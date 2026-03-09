---
Admin 画面のログインユーザーについて

仕組みの概要

Admin 画面は Supabase Authentication でユーザー管理をしています。
ログインできるかどうかは2つの条件があります：

1. Supabase の auth.users にユーザーが存在する
2. そのユーザーの app_metadata に "roles": ["admin"] が設定されている

checkAdminPermission という関数でこの admin ロールを確認しており、ユーザーが存在するだけではログインできません。

---
ローカル環境でのユーザー登録

方法1: pnpm db:reset（最も簡単）

pnpm db:reset

supabase/seed.sql が自動実行され、admin@example.com / admin123456 が admin ロール付きで作られます。

方法2: Supabase Studio から手動追加

1. http://127.0.0.1:54423 を開く
2. 左メニュー「Authentication」→「Users」→「Add user」
3. メールアドレス・パスワードを入力してユーザーを作成
4. 作成したユーザーをクリック → 「Edit user」
5. app_metadata に以下を入力して保存：

{"provider": "email", "providers": ["email"], "roles": ["admin"]}

この roles: ["admin"] の設定が必須です。 これがないと「管理者権限がありません」エラーになります。

---
本番環境（Supabase Cloud）でのユーザー登録

1. Supabase Dashboard (https://supabase.com) にログイン
2. プロジェクト → 「Authentication」→「Users」→「Invite user」（またはメール招待）
3. ユーザー作成後、一覧からユーザーをクリック
4. 「Edit user」で app_metadata に {"roles": ["admin"]} を追加して保存

本番では admin@example.com / admin123456 のデフォルト認証情報は必ず変更してください（Supabase Dashboard
から直接パスワード変更できます）。

---
現在の設計上の制限

Admin 画面には自己登録（Sign Up）機能がありません。ユーザーの追加・削除は常に Supabase のダッシュボードまたは CLI
から行う運用です。これは意図的な設計で、管理者を限定するためのものです。