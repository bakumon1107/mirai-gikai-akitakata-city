/**
 * サイト設定ファイル
 * Fork して別の地方議会向けに使用する場合はこのファイルを変更してください。
 * @see docs/kawasaki/20260304_1000_別地域向けfork手順.md
 */
export const siteConfig = {
  siteName: "みらい議会＠安芸高田市",
  /** 「〜です」で終わる一文（末尾の句点なし）。AIチャットのプロンプトにも差し込まれる */
  siteDescription:
    "安芸高田市議会で今どんな議案が検討されているか、わかりやすく伝えるプラットフォームです",
  cityName: "安芸高田市",
  councilName: "安芸高田市議会",
  keywords: [
    "みらい議会ー安芸高田市版",
    "議案",
    "安芸高田市",
    "市議会",
    "地方政治",
    "政策",
    "解説",
  ],
  councilBaseUrl: "https://www.akitakata.jp/",
  /** 議案・議決結果の一覧ページ */
  councilBillsDetailUrl:
    "https://www.akitakata.jp/ja/parliament/giketu/e507/u153-copy/",
  twitterHashtag: "みらい議会安芸高田市版", // # なし
  externalLinks: {
    /** 問題報告フォーム（空の場合は「問題を報告する」導線を表示しない） */
    report: "" as string,
    /** サイト紹介記事（空の場合は紹介リンクを表示しない） */
    aboutNote: "" as string,
    /** 以下は features.showTeamMiraiSection が true のときのみ使用する */
    donation: "https://team-mir.ai/support/donation",
    teamAbout: "https://team-mir.ai/about",
  },
  /**
   * ページを管理する政党名（空文字列の場合は政党名を省略した汎用表現を使用）
   * 例: "チームみらい"
   */
  managingParty: "" as string,
  /**
   * サービス運営者情報
   * 利用規約や問い合わせ先に使用します。
   */
  operator: {
    name: "バクモン" as string,
    contactUrl: "https://x.com/bakumon0907" as string,
    /** 利用規約の準拠法・管轄裁判所（第一審の専属的合意管轄） */
    jurisdiction: "広島地方裁判所" as string,
  },
  /**
   * AI機能の有効/無効設定
   * 本番環境のコスト管理のため、機能ごとにオン/オフを切り替えられます。
   */
  features: {
    /** AIチャット機能（議案への質問・テキスト選択からの質問）*/
    aiChat: false,
    /** AIインタビュー機能（議案当事者へのヒアリング）*/
    aiInterview: false,
    /**
     * チームみらいセクションの表示（トップページ・フッター・デスクトップメニュー）
     * 非公式運営など、党の公式サービスとして出さない場合は false にする。
     */
    showTeamMiraiSection: false as boolean,
  },
} as const;
