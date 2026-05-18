/**
 * web アプリの内部ルート定義
 *
 * app/ ディレクトリの page.tsx と 1:1 対応する。
 * Link href や router.push には必ずこのファイルの関数を使うこと。
 * 新しいページを追加したらここにもルートを追加し、テストを通すこと。
 */

export const routes = {
  // ── 静的ルート ──────────────────────────────────────
  home: () => "/" as const,
  terms: () => "/terms" as const,
  privacy: () => "/privacy" as const,

  // ── 議案 ──────────────────────────────────────────
  billDetail: (billId: string) => `/bills/${billId}` as const,
  billOpinions: (billId: string) => `/bills/${billId}/opinions` as const,

  // ── インタビュー ──────────────────────────────────
  interviewLP: (billId: string) => `/bills/${billId}/interview` as const,
  interviewDisclosure: (billId: string) =>
    `/bills/${billId}/interview/disclosure` as const,
  interviewChat: (billId: string) => `/bills/${billId}/interview/chat` as const,

  // ── プレビュー（token 付き） ──────────────────────
  previewBillDetail: (billId: string, token: string) =>
    `/preview/bills/${billId}?token=${encodeURIComponent(token)}` as const,
  previewInterviewLP: (billId: string, token: string) =>
    `/preview/bills/${billId}/interview?token=${encodeURIComponent(token)}` as const,
  previewInterviewDisclosure: (billId: string, token: string) =>
    `/preview/bills/${billId}/interview/disclosure?token=${encodeURIComponent(token)}` as const,
  previewInterviewChat: (billId: string, token: string) =>
    `/preview/bills/${billId}/interview/chat?token=${encodeURIComponent(token)}` as const,

  // ── レポート ──────────────────────────────────────
  publicReport: (reportId: string) => `/report/${reportId}` as const,
  reportComplete: (reportId: string) => `/report/${reportId}/complete` as const,
  reportChatLog: (reportId: string) => `/report/${reportId}/chat-log` as const,

  // ── 定例会セッション ────────────────────────────────
  sessions: () => "/sessions" as const,
  sessionBills: (slug: string) => `/sessions/${slug}/bills` as const,
  sessionQuestions: (slug: string) => `/sessions/${slug}/questions` as const,

  // ── 一般質問 ──────────────────────────────────────
  questions: () => "/questions" as const,
  questionDetail: (id: string) => `/questions/${id}` as const,

  // ── 市長記者会見 ──────────────────────────────────
  pressConferences: () => "/press-conferences" as const,
  pressConferenceDetail: (slug: string) =>
    `/press-conferences/${slug}` as const,

  // ── 地域懇談会 ────────────────────────────────────
  communityConsultationDetail: (year: string) =>
    `/community-consultations/${year}` as const,
  communityConsultationLatest: () => "/community-consultations/latest" as const,

  // ── その他 ────────────────────────────────────────
  faq: () => "/faq" as const,
} as const;
