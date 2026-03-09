import "server-only";

import { MessageSquareMore } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { PublicStatusSection } from "@/features/interview-report/client/components/public-status-section";
import { getInterviewReportById } from "@/features/interview-report/server/loaders/get-interview-report-by-id";
import { getInterviewChatLogLink } from "@/features/interview-config/shared/utils/interview-links";
import { getInterviewMessages } from "@/features/interview-session/server/loaders/get-interview-messages";
import { SpeechBubble } from "@/components/ui/speech-bubble";
import {
  calculateDuration,
  countCharacters,
} from "../../shared/utils/report-utils";
import { BackToBillButton } from "../../shared/components/back-to-bill-button";
import { ReportBreadcrumb } from "../../shared/components/report-breadcrumb";
import { IntervieweeInfo } from "../../shared/components/interviewee-info";
import { OpinionsList } from "../../shared/components/opinions-list";
import { ReportMetaInfo } from "../../shared/components/report-meta-info";

interface ReportCompletePageProps {
  reportId: string;
}

export async function ReportCompletePage({
  reportId,
}: ReportCompletePageProps) {
  // レポートIDから全ての情報を取得
  // 完了ページなので、所有者のみが閲覧できるように制限する
  const report = await getInterviewReportById(reportId, { onlyOwner: true });

  if (!report) {
    notFound();
  }

  const billId = report.bill_id;

  // 議案とメッセージを並列取得
  const [bill, messages] = await Promise.all([
    getBillById(billId),
    getInterviewMessages(report.interview_session_id),
  ]);

  if (!bill) {
    notFound();
  }

  const opinions = Array.isArray(report.opinions)
    ? (report.opinions as Array<{ title: string; content: string }>)
    : [];
  const duration = calculateDuration(
    report.session_started_at,
    report.session_completed_at
  );
  const characterCount = countCharacters(messages);

  return (
    <div className="min-h-screen bg-[#F7F4F0]">
      {/* 議案サムネイル画像 */}
      {bill.thumbnail_url && (
        <div className="relative w-full h-[320px]">
          <Image
            src={bill.thumbnail_url}
            alt={bill.bill_content?.title || bill.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* ヘッダーセクション */}
      <div className="bg-white rounded-b-[32px] px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          {/* 完了イラスト */}
          <Image
            src="/illustrations/interview-complete.svg"
            alt="完了"
            width={236}
            height={152}
          />

          {/* 完了メッセージ */}
          <h1 className="text-2xl font-bold text-center text-gray-800 leading-relaxed">
            提出が完了しました！
            <br />
            ご協力ありがとうございました
          </h1>

          {/* 議案名 */}
          <div className="bg-[#F2F2F7] rounded-xl px-4 py-2">
            <p className="text-sm text-gray-800">
              {bill.bill_content?.title || bill.name}
            </p>
          </div>

          {/* 活用メッセージ */}
          <p className="text-sm text-gray-800">
            いただいた声は政策検討に最大限活用します
          </p>
        </div>
      </div>

      {/* インタビューレポートセクション */}
      <div className="px-4 py-8">
        <div className="flex flex-col gap-9">
          {/* セクションタイトルと公開ステータス */}
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-black">
              インタビューレポート
            </h2>
            <PublicStatusSection
              sessionId={report.interview_session_id}
              initialIsPublic={report.is_public_by_user}
            />
          </div>

          {/* レポートカード */}
          <div className="flex flex-col gap-9">
            {/* 要約カード */}
            <div className="flex flex-col items-center gap-9">
              <SpeechBubble>
                <p className="text-lg font-bold text-gray-800 leading-relaxed relative z-10 text-center">
                  {report.summary}
                </p>
              </SpeechBubble>

              {/* スタンスと日時情報 */}
              <ReportMetaInfo
                stance={report.stance}
                role={report.role}
                sessionStartedAt={report.session_started_at}
                duration={duration}
                characterCount={characterCount}
              />
            </div>

            {/* インタビューを受けた人 */}
            <IntervieweeInfo
              roleDescription={report.role_description}
              headingLevel="h3"
            />

            {/* 主な意見 */}
            <OpinionsList
              opinions={opinions}
              title="💬主な意見"
              showBackground={true}
              footer={
                <Link
                  href={getInterviewChatLogLink(reportId)}
                  className="flex items-center justify-center gap-2.5 px-6 py-3 border border-gray-800 rounded-full"
                >
                  <MessageSquareMore className="w-6 h-6 text-gray-800" />
                  <span className="text-base font-bold text-gray-800">
                    すべての会話ログを読む
                  </span>
                </Link>
              }
            />

            {/* 議案の記事に戻るボタン */}
            <div className="flex flex-col gap-3">
              <BackToBillButton billId={billId} />
            </div>

            {/* パンくずリスト */}
            <ReportBreadcrumb billId={billId} />
          </div>
        </div>
      </div>
    </div>
  );
}
