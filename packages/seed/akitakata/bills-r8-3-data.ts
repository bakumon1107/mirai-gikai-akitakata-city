/**
 * 安芸高田市 令和8年第3回定例会（令和8年9月定例会）の議案メタデータ。
 *
 * 出典: https://www.akitakata.jp/ja/parliament/giketu/e507/x897/
 * 会期: 令和8年9月7日（開会）〜9月29日（委員長報告・採決）
 *       https://www.akitakata.jp/ja/parliament/nittei/v151/
 *
 * generate-bill-contents-r8-3.ts（AI解説のローカル生成）と
 * ingest-bills-r8-3.ts（DB投入）の両方から参照する。
 */

export const SESSION_SLUG = "r8-3";
export const SESSION_NAME = "令和8年 第3回定例会";
export const SESSION_START = "2026-09-07";
export const SESSION_END = "2026-09-29";
export const SESSION_URL =
  "https://www.akitakata.jp/ja/parliament/giketu/e507/x897/";

export const COM_SOUMU = "bf7b0596-a28f-4074-af9e-10b7c09e7dae"; // 総務文教常任委員会
export const COM_SANGYO = "0b0384f5-387a-4fbb-88fe-526151f29aaf"; // 産業厚生常任委員会
export const COM_YOSAN = "5fea66aa-c920-4705-9e76-bad67f1a30bd"; // 予算決算常任委員会

/** download-pdfs-r8-3.ts の保存先 */
export const PDF_DIR = "/tmp/akitakata-pdfs-r8-3";
/** generate-bill-contents-r8-3.ts が書き出し、ingest-bills-r8-3.ts が読む */
export const OUTPUT_DIR = "/tmp/bill-contents-r8-3";

const MEDIA_BASE = "https://www.akitakata.jp/akitakata-media/filer_public";

/** 議案の提出日（＝公開日）。追加議案のみ個別指定する */
export const DEFAULT_PUBLISHED_AT = "2026-09-07";

export type BillMeta = {
  billNumber: string;
  name: string;
  committeeId: string;
  /** PDF_DIR 配下のファイル名（拡張子なし）。PDF未公開なら null */
  pdfKey: string | null;
  /**
   * 市議会サイト上の議案原文PDFのURL。未公開なら null。
   * DBの `pdf_url` にもダウンロード元にもこの1箇所が使われる。
   */
  pdfUrl: string | null;
  /** ＜説明資料＞PDFのURL。無ければ省略。`<pdfKey>-setsu.pdf` として保存される */
  setsuUrl?: string;
  publishedAt?: string;
};

/** 説明資料PDFの保存キー */
export function setsuKey(pdfKey: string): string {
  return `${pdfKey}-setsu`;
}

export const BILLS: BillMeta[] = [
  // ── 議案 ──────────────────────────────────────────
  {
    billNumber: "48",
    name: "安芸高田市職員の特殊勤務手当に関する条例の一部を改正する条例",
    committeeId: COM_SOUMU,
    pdfKey: "gian48",
    pdfUrl: `${MEDIA_BASE}/fe/2c/fe2c2934-ce4b-4650-afe3-e053f3270b1b/gian-dai-48gou-_aki-takadashi-shokuin-no-tokushu-kinmu-teate-ni-kansu-ru-jourei-no-ichibu-wo-kaisei-suru-jourei.pdf`,
    setsuUrl: `${MEDIA_BASE}/4b/a5/4ba587a3-53a1-4d33-930d-79be58d7439a/gian-dai-48gou-_gian-setsumeishiryou-aki-takadashi-shokuin-no-tokushu-kinmu-teate-ni-kansu-ru-jourei-no-ichibu-wo-kaisei-suru-jourei.pdf`,
  },
  {
    billNumber: "49",
    name: "安芸高田市長等の損害賠償責任の一部免責に関する条例の一部を改正する条例",
    committeeId: COM_SOUMU,
    pdfKey: "gian49",
    pdfUrl: `${MEDIA_BASE}/24/b3/24b37a44-e595-4e44-8770-811bf6aae421/gian-dai-49gou-_aki-takadashi-chou-nado-no-songaibaishou-sekinin-no-ichibu-menseki-ni-kansu-ru-jourei-no-ichibu-wo-kaisei-suru-jourei.pdf`,
  },
  {
    billNumber: "50",
    name: "安芸高田市印鑑の登録及び証明に関する条例の一部を改正する条例",
    committeeId: COM_SOUMU,
    pdfKey: "gian50",
    pdfUrl: `${MEDIA_BASE}/33/82/33821701-dc79-4340-88b4-9eb86f673bbc/gian-dai-50gou-aki-takadashi-inkan-no-touroku-oyobi-shoumei-ni-kansu-ru-jourei-no-ichibu-wo-kaisei-suru-jourei.pdf`,
    setsuUrl: `${MEDIA_BASE}/4f/37/4f37067d-0ff1-4700-8f95-e57b863cc3e3/gian-dai-50gou-_gian-setsumeishiryou-hyoushi-aki-takadashi-inkan-no-touroku-oyobi-shoumei-ni-kansu-ru-jourei-no-ichibu-wo-kaisei-suru-jourei.pdf`,
  },
  {
    billNumber: "51",
    name: "安芸高田市手数料条例の一部を改正する条例",
    committeeId: COM_SOUMU,
    pdfKey: "gian51",
    pdfUrl: `${MEDIA_BASE}/ed/94/ed94fec8-f8ea-4139-bab0-697be9da184b/gian-dai-51gou-_aki-takadashi-tesuuryou-jourei-no-ichibu-wo-kaisei-suru-jourei.pdf`,
    setsuUrl: `${MEDIA_BASE}/7d/4b/7d4bf31b-b83d-4baa-ad1d-7060b5906179/gian-dai-51gou-_gian-setsumeishiryou-aki-takadashi-tesuuryou-jourei-wo-ichibu-kaisei-suru-jourei.pdf`,
  },
  {
    billNumber: "52",
    name: "令和8年度安芸高田市一般会計補正予算（第3号）",
    committeeId: COM_YOSAN,
    pdfKey: "gian52",
    pdfUrl: `${MEDIA_BASE}/9a/8f/9a8f02a3-3372-40c4-9077-65ffee9c48ba/gian-dai-52gou-_rei-wa-8nendo-aki-takadashi-ippankaikei-hoseiyosan-dai-3gou.pdf`,
    setsuUrl: `${MEDIA_BASE}/3b/68/3b686c36-66a8-409b-b4d4-86fe55300eb6/gian-dai-52gou-_gian-setsumeishiryou-rei-wa-8nendo-aki-takadashi-ippankaikei-hoseiyosan-dai-3gou.pdf`,
  },
  {
    billNumber: "53",
    name: "令和8年度安芸高田市国民健康保険特別会計補正予算（第2号）",
    committeeId: COM_YOSAN,
    pdfKey: "gian53",
    pdfUrl: `${MEDIA_BASE}/bc/d7/bcd70110-d5e9-4b37-b1a4-7639ff8288d5/gian-dai-53gou-_rei-wa-8nendo-aki-takadashi-kokuminkenkouhoken-tokubetsukaikei-hoseiyosan-dai-2gou.pdf`,
  },
  {
    billNumber: "54",
    name: "令和8年度安芸高田市後期高齢者医療特別会計補正予算（第1号）",
    committeeId: COM_YOSAN,
    pdfKey: "gian54",
    pdfUrl: `${MEDIA_BASE}/d4/31/d431b247-b231-44c4-9606-06af068baf00/gian-dai-54gou-_rei-wa-8nendo-aki-takadashi-kouki-koureisha-iryou-tokubetsukaikei-hoseiyosan-dai-1gou.pdf`,
  },
  {
    billNumber: "55",
    name: "令和8年度安芸高田市介護保険特別会計補正予算（第2号）",
    committeeId: COM_YOSAN,
    pdfKey: "gian55",
    pdfUrl: `${MEDIA_BASE}/34/ff/34ff7833-5798-4949-9a1c-b89d9bf6b8dc/gian-dai-55gou-_rei-wa-8nendo-aki-takadashi-kaigo-hoken-tokubetsukaikei-hoseiyosan-dai-2gou.pdf`,
  },
  {
    billNumber: "56",
    name: "令和8年度安芸高田市下水道補正予算書（第1号）",
    committeeId: COM_YOSAN,
    pdfKey: "gian56",
    pdfUrl: `${MEDIA_BASE}/51/3a/513ae210-781f-49a3-b988-748ba3570a79/gian-dai-56gou-_rei-wa-8nendo-aki-takadashi-gesuidou-hoseiyosan-kaki-dai-1gou.pdf`,
  },
  {
    billNumber: "57",
    name: "安芸高田市企業立地奨励条例の全部を改正する条例",
    committeeId: COM_SANGYO,
    pdfKey: "gian57",
    pdfUrl: `${MEDIA_BASE}/c3/3a/c33a7748-56d5-4175-a9ae-6abf01d3866b/gian-dai-57gou-_aki-takadashi-kigyou-ritchi-shourei-jourei-no-zenbu-wo-kaisei-suru-jourei.pdf`,
    setsuUrl: `${MEDIA_BASE}/9a/cc/9accb9c1-ad87-493f-9ba5-075d7948adfb/gian-dai-57gou-_setsumeishiryou-aki-takadashi-kigyou-ritchi-shourei-jourei-no-zenbu-wo-kaisei-suru-jourei.pdf`,
    publishedAt: "2026-09-11", // 追加議案
  },

  // ── 認定（令和7年度決算） ────────────────────────────
  // 決算審査は日程表どおり予算決算常任委員会が所管する
  {
    billNumber: "nin1",
    name: "令和7年度安芸高田市一般会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin1",
    pdfUrl: `${MEDIA_BASE}/db/46/db4631e5-7940-4837-8f7b-cacc3eab9548/1_nintei-dai-1gou-_rei-wa-7_nendo-aki-takadashi-ippankaikei-kessan-no-nintei-nitsuite.pdf`,
    // 認定第1〜5号共通の説明資料「普通会計財政状況」。決算の要点はこちらに集約されている
    setsuUrl: `${MEDIA_BASE}/92/77/9277392b-5f94-4198-826c-b83b1cdc05d1/nintei-dai-15gou-_gian-setsumeishiryou-01_r7futsuu-kaikei-zaisei-joukyou.pdf`,
  },
  {
    billNumber: "nin2",
    name: "令和7年度安芸高田市国民健康保険特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin2",
    pdfUrl: `${MEDIA_BASE}/ac/17/ac173352-5139-444d-9bfa-a0c7eed0f41f/2_nintei-dai-2gou-_rei-wa-7_nendo-aki-takadashi-kokuminkenkouhoken-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin3",
    name: "令和7年度安芸高田市後期高齢者医療特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin3",
    pdfUrl: `${MEDIA_BASE}/f7/0b/f70b723f-1b54-4b54-aa44-4f3a584905b2/3_nintei-dai-3gou-_rei-wa-7_nendo-aki-takadashi-kouki-koureisha-iryou-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin4",
    name: "令和7年度安芸高田市介護保険特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin4",
    pdfUrl: `${MEDIA_BASE}/1a/61/1a614058-17d5-4feb-9c5e-d3a50fa99a82/4_nintei-dai-4gou-_rei-wa-7_nendo-aki-takadashi-kaigo-hoken-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin5",
    name: "令和7年度安芸高田市コミュニティ・プラント整備事業特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin5",
    pdfUrl: `${MEDIA_BASE}/52/e6/52e69d98-ffa7-462c-b1db-65a54a27ffc5/5_nintei-dai-5gou-_rei-wa-7_nendo-aki-takadashi-komyuniteipuranto-seibi-jigyou-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin6",
    name: "令和7年度安芸高田市吉田財産区特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin6",
    pdfUrl: `${MEDIA_BASE}/b0/0a/b00ae655-302e-4925-baab-0fc875770ea2/7_nintei-dai-6gou-_rei-wa-7_nendo-aki-takadashi-yoshida-zaisan-ku-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin7",
    name: "令和7年度安芸高田市中馬財産区特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin7",
    pdfUrl: `${MEDIA_BASE}/ed/cf/edcf3649-2980-4f5c-999f-3f37f84479ec/8_nintei-dai-7gou-_rei-wa-7_nendo-aki-takadashi-nakauma-zaisan-ku-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin8",
    name: "令和7年度安芸高田市横田財産区特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin8",
    pdfUrl: `${MEDIA_BASE}/ab/e2/abe2260f-555b-4573-8ba8-b651fcb3cb25/9_nintei-dai-8gou-_rei-wa-7_nendo-aki-takadashi-yokota-zaisan-ku-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin9",
    name: "令和7年度安芸高田市本郷財産区特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin9",
    pdfUrl: `${MEDIA_BASE}/6b/5f/6b5f78bf-a0e0-4a80-a309-5b3b8353f352/10_nintei-dai-9gou-_rei-wa-7_nendo-aki-takadashi-hongou-zaisan-ku-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin10",
    name: "令和7年度安芸高田市北財産区特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin10",
    pdfUrl: `${MEDIA_BASE}/eb/9b/eb9b415a-7476-4319-abce-f931df13d4c0/11_nintei-dai-10gou-_rei-wa-7_nendo-aki-takadashi-kita-zaisan-ku-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin11",
    name: "令和7年度安芸高田市来原財産区特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin11",
    pdfUrl: `${MEDIA_BASE}/62/4e/624eff63-5219-47e2-ba80-f72c851059cb/12_nintei-dai-11gou-_rei-wa-7_nendo-aki-takadashi-rai-hara-zaisan-ku-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin12",
    name: "令和7年度安芸高田市船佐財産区特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin12",
    pdfUrl: `${MEDIA_BASE}/96/b8/96b820dc-537e-4992-b597-807f9fda9d57/13_nintei-dai-12gou-_rei-wa-7_nendo-aki-takadashi-fune-sa-zaisan-ku-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin13",
    name: "令和7年度安芸高田市川根財産区特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin13",
    pdfUrl: `${MEDIA_BASE}/c9/67/c967caa1-a8a8-452c-85ec-7496df674d97/14_nintei-dai-13gou-_rei-wa-7_nendo-aki-takadashi-kawane-zaisan-ku-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin14",
    name: "令和7年度安芸高田市坂財産区特別会計決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin14",
    pdfUrl: `${MEDIA_BASE}/49/bc/49bc5906-7bbf-43a2-8c14-d8936276f3fa/15_nintei-dai-14gou-_rei-wa-7_nendo-aki-takadashi-saka-zaisan-ku-tokubetsukaikei-kessan-no-nintei-nitsuite.pdf`,
  },
  {
    billNumber: "nin15",
    name: "令和7年度安芸高田市下水道事業会計利益の処分及び決算の認定について",
    committeeId: COM_YOSAN,
    pdfKey: "giannin15",
    pdfUrl: `${MEDIA_BASE}/3d/00/3d00c601-67ae-4958-832a-f9d3217aea6c/16_nintei-dai-15gou-_rei-wa-7_nendo-aki-takadashi-gesuidou-jigyoukai-kei-rieki-no-shobun-oyobi-kessan-no-nintei-nitsuite.pdf`,
  },

  // ── 諮問（議案原文PDF未公開） ─────────────────────────
  {
    billNumber: "shi4",
    name: "人権擁護委員の推薦につき意見を求めることについて",
    committeeId: COM_SOUMU,
    pdfKey: null,
    pdfUrl: null,
  },
];

/**
 * 特定の議案に紐づかない参考資料。
 * 決算審査の背景資料としてダウンロードするだけで、AI解説の入力には使っていない
 * （認定第1号の `setsuUrl` に指定した「普通会計財政状況」が要点を含むため）。
 */
export const REFERENCE_PDFS: { key: string; url: string; label: string }[] = [
  {
    key: "nintei-kenzenka",
    label: "認定第1〜15号 健全化判断比率等報告書",
    url: `${MEDIA_BASE}/fc/d7/fcd74178-17c7-49b9-a81a-76e50e695c13/nintei-dai-15gou-_gian-setsumeishiryou-02_r7kenzen-ka-handan-hiritsu-nado-houkokusho.pdf`,
  },
  {
    key: "nintei-seika",
    label: "認定第1〜15号 主要施策の成果に関する説明書",
    url: `${MEDIA_BASE}/ca/d8/cad8dc68-ed9b-4c2e-b31e-435f4804e853/nintei-dai-15gou-_shuuseigo-gian-setsumeishiryou-03-1_r7shuyou-shisaku-no-seika-ni-kansu-ru-setsumeisho.pdf`,
  },
  {
    key: "nintei-shokan",
    label: "認定第1〜15号 所管別主要施策一覧表",
    url: `${MEDIA_BASE}/a2/02/a2023b70-6344-42a4-abbe-8a2e673987c2/nintei-dai-15gou-_shuuseigo-gian-setsumeishiryou-03-2_shokan-betsu-shuyou-shisaku-ichiranhyou-r7.pdf`,
  },
  {
    key: "nintei-zaisan",
    label: "令和7年度 財産に関する調書",
    url: `${MEDIA_BASE}/87/62/8762e7aa-0db5-44f2-9e6b-b150667324bb/6_rei-wa-7nendo-zaisan-ni-kansu-ru-chousho.pdf`,
  },
];
