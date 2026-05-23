# FORK_GUIDELINES 適応設計書 — 安芸高田市版

作成日: 2026-04-21

## 背景

本家リポジトリ（team-mirai/mirai-gikai）に `FORK_GUIDELINES.md` が追加された。
AGPL-3.0 ライセンスのフォーク要件として、ブランディングの差別化・免責表示・ソースコード公開が義務付けられた。
本書は安芸高田市版への適応内容を定義する。

## 対応要件一覧

| # | 要件 | 必須/推奨 | 対応方針 |
|---|------|----------|---------|
| 1 | サービス名を `みらい議会＠安芸高田市` 形式にする | 必須 | `site.config.ts` + `manifest.json` 更新 |
| 2 | カラースキームを独自パレットに変更 | 必須 | `globals.css` の primary 色をソフトパープルに変更 |
| 3 | ロゴ・ヒーロー画像・PWAアイコンを独自のものに | 必須 | ロゴSVG・PWAアイコンSVGを新規作成 |
| 4 | 免責文言の表示（チームみらいの公式サービスではない旨） | 必須 | フッターに常時表示コンポーネントを追加 |
| 5 | AGPL-3.0：改変後のソースコードへのアクセス手段を提供 | 必須 | フッターにGitHubリポジトリリンクを追加 |

---

## 1. サービス名変更

### 変更前後

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| `siteConfig.siteName` | `みらい議会ー安芸高田市版` | `みらい議会＠安芸高田市` |
| `manifest.json` name / short_name | 同上 | 同上 |

### 変更ファイル

- `web/src/config/site.config.ts`
- `web/public/manifest.json`

---

## 2. カラースキーム変更（ティール → ソフトパープル）

### 設計コンセプト

現行のティール系（`#2aa693`）と**同程度の彩度・明度**を持つ**優しい紫**に変更する。
落ち着いたラベンダー系で統一し、温かみのある既存の背景色（`mirai-surface-warm` 等）と調和させる。

### カラーパレット定義

| トークン名 | 現在値 | 変更後 | 用途 |
|-----------|--------|--------|------|
| `--primary` | `#2aa693` | `#8272c0` | ボタン背景、主要インタラクション要素 |
| `--primary-accent` | `#0f8472` | `#6455a4` | テキストアクセント、ラベル、チャット質問色 |
| `--color-mirai-gradient-start` | `#64d8c6` | `#c4b5f4` | グラデーション開始色（明るいラベンダー） |
| `--color-mirai-gradient-end` | `#bcecd3` | `#ddd6fe` | グラデーション終了色（極薄ラベンダー） |
| `--color-stance-for-badge-start` | `#e2f6f3` | `#ede9fe` | 賛成バッジグラデーション開始 |
| `--color-stance-for-badge-end` | `#eef6e2` | `#f5f3ff` | 賛成バッジグラデーション終了 |
| `manifest.json` theme_color | `#2aa693` | `#8272c0` | PWAテーマカラー |
| `.bg-mirai-light-gradient` インライン色 | `#e2f6f3` / `#eef6e2` | `#ede9fe` / `#f5f3ff` | 軽グラデーション背景 |

### 変更ファイル

- `web/src/app/globals.css`（6箇所）
- `web/public/manifest.json`（theme_color）

---

## 3. ロゴ・アイコン変更

### 3-1. ロゴ SVG（`web/public/img/logo.svg`）

現在のロゴは Team Mirai の議会手帳風デザイン（黒枠ノート＋日本語テキスト）。
これを安芸高田市向けのシンプルなテキストロゴに置き換える。

**デザイン方針：**
- 「みらい議会」を大文字、「＠安芸高田市」をサブテキストで表示
- 新しい primary 色（`#8272c0`）を使用したアクセントバー付き
- シンプルで可読性の高いSVGテキストベースデザイン

### 3-2. PWAアイコン（`web/public/icons/pwa/`）

現在の PNG アイコンはチームみらいブランド。
SVG ベースのアイコンを新規作成し、manifest.json で参照を更新する。

**デザイン方針：**
- 丸背景（primary color `#8272c0`）に「み」の文字（白）
- `icon_akitakata.svg` として `/icons/pwa/` に配置
- manifest.json の icons リストを SVG 参照に更新

### 3-3. OGP 画像（`web/public/ogp.jpg`）

現状維持（Team Mirai ロゴは含まれていないため後日対応）。
ただし将来的には紫ベースの安芸高田市独自OGP画像に差し替える。

---

## 4. 免責文言の追加

### 要件

> 「これは政党チームみらいが運営しているものではありません」

フッターに **常時表示**（`showTeamMiraiSection` の値に依存しない）。

### 実装方針

`footer.tsx` の `<footer>` 内、ポリシーリンクの下に独立した免責セクションを追加する。

```tsx
// Footer内 FooterPolicies の直下に追加
function FooterDisclaimer() {
  return (
    <p className="text-[11px] text-slate-600 text-center mt-1">
      このサービスは政党チームみらいが運営しているものではありません
    </p>
  );
}
```

---

## 5. AGPL-3.0 ソースコード公開リンク

### 要件

ネットワーク利用者に対して、改変後のソースコードへのアクセス手段を提供する。

### 実装方針

フッターの `policyLinks`（`footer.config.ts`）に GitHub リポジトリリンクを追加。

```ts
{
  label: "ソースコード（GitHub）",
  href: "https://github.com/bakumon1107/mirai-gikai-akitakata-city",
  external: true,
}
```

※ リポジトリが公開済みであることを前提とする。URLは実際のリポジトリに合わせて更新すること。

---

## 実装ファイル一覧

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `web/src/app/globals.css` | 修正 | primary/accent/gradient 色を紫系に変更（6箇所） |
| `web/public/manifest.json` | 修正 | name/short_name・theme_color 更新 |
| `web/src/config/site.config.ts` | 修正 | siteName 更新 |
| `web/public/img/logo.svg` | 差し替え | テキストベース安芸高田市ロゴに変更 |
| `web/public/icons/pwa/icon_akitakata.svg` | 新規 | SVGアイコン作成 |
| `web/src/components/layouts/footer/footer.tsx` | 修正 | 免責文言コンポーネント追加 |
| `web/src/components/layouts/footer/footer.config.ts` | 修正 | ソースコードリンク追加 |

---

## 確認事項（実装前にユーザーへ確認）

1. **GitHubリポジトリURL**: AGPL対応のソースコードリンクに使用するリポジトリのURLを教えてください
2. **サービス名**: `みらい議会＠安芸高田市` で確定でよいか
3. **PWAアイコン**: SVGベース（`み`の文字）で進めてよいか、または別のデザインを希望するか
