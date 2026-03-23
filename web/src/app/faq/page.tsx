import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { routes } from "@/lib/routes";
import {
  LegalPageLayout,
  LegalParagraph,
  LegalSectionTitle,
} from "@/components/layouts/legal-page-layout";
import { siteConfig } from "@/config/site.config";

export const metadata: Metadata = {
  title: `よくあるご質問 | ${siteConfig.siteName}`,
  description: `${siteConfig.siteName}に関するよくあるご質問`,
};

type FaqItem = {
  question: string;
  answer: React.ReactNode;
};

const faqs: FaqItem[] = [
  {
    question: `${siteConfig.siteName}とは何ですか？`,
    answer: (
      <>
        {siteConfig.siteDescription}
        。議案の情報収集や解説にAIを活用し、市民の皆さまが議会の動向を把握しやすくすることを目的としています。
      </>
    ),
  },
  {
    question: "チームみらいの公式サービスですか？",
    answer: (
      <>
        いいえ、{siteConfig.siteName}
        はチームみらいの公式サービスではありません。「チームみらい」が開発・公開した「みらい議会」をベースに、有志が独自に運営している非公式サービスです。
        <br />
        ご意見・不具合等は、チームみらい公式ではなく、開発者（
        <a
          href={siteConfig.operator.contactUrl}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          {siteConfig.operator.name}
        </a>
        ）にご連絡ください。
      </>
    ),
  },
  {
    question: "議案の情報はどこから取得していますか？",
    answer: (
      <>
        <a
          href={siteConfig.councilBillsDetailUrl}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          {siteConfig.councilName}公式サイト
        </a>
        に公開されている情報をもとに掲載しています。最新情報や正確な内容については公式サイトをご確認ください。
      </>
    ),
  },
  {
    question: "AIによる解説・回答は正確ですか？",
    answer:
      "AIが生成する解説・回答は参考情報であり、正確性・完全性・最新性を保証するものではありません。重要な判断の際は必ず公式情報をご確認ください。",
  },
  {
    question: "個人情報はどのように扱われますか？",
    answer: (
      <>
        詳細は
        <Link href={routes.privacy()} className="underline underline-offset-2">
          プライバシーポリシー
        </Link>
        をご確認ください。AIチャット・インタビュー機能への入力内容には個人情報を含めないようお願いします。
      </>
    ),
  },
  {
    question: "不具合や意見はどこに連絡すればいいですか？",
    answer: (
      <>
        開発者（
        <a
          href={siteConfig.operator.contactUrl}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          {siteConfig.operator.name}
        </a>
        ）までご連絡ください。なお、チームみらいの公式窓口への連絡はご遠慮ください。
      </>
    ),
  },
  {
    question: "AIアシスタントとの対話履歴はサーバー上に残りますか？",
    answer: (
      <>
        AIアシスタントとの対話内容（質問や回答など）をサーバー上に保管しています。これは、以下の目的のために行っています。
        <ul>
          <li>・サービス品質の向上（回答内容の改善・バグ修正など）</li>
          <li>・不正利用やシステム障害の検知・防止</li>
        </ul>
        また、将来的には、対話履歴をもとに以下のような機能を提供する可能性があります。
        <ul>
          <li>
            ・利用者ごとの対話継続性の確保（過去の質問内容を踏まえた応答）
          </li>
          <li>・パーソナライズされた体験（おすすめ議案の提示など）</li>
        </ul>
        保存されたデータは、厳重なセキュリティのもと管理され、第三者に提供されることはありません。
      </>
    ),
  },
  {
    question: "「注目の議案」はどのような基準で選ばれているのでしょうか？",
    answer: (
      <>
        議案の内容や報道の状況などを見ながら、注目度の高い議案を開発者で選定しています。
      </>
    ),
  },
  {
    question: "ふりがな（ルビ）はどのようにふっているのですか？",
    answer: (
      <>
        ふりがな（ルビ）は、一般財団法人ルビ財団の「ルビフルボタン」というサービスを使用して、自動で表示しています。
        固有名詞などふりがなが不正確な箇所については、今後手動で正しいふりがなに変更していく予定です。
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <LegalPageLayout
      title="よくあるご質問"
      description={`${siteConfig.siteName}に関するよくあるご質問をまとめています。`}
      className="pt-24 md:pt-12"
    >
      <Container className="space-y-10">
        {faqs.map((faq) => (
          <section key={faq.question} className="space-y-3">
            <LegalSectionTitle>{faq.question}</LegalSectionTitle>
            <LegalParagraph>{faq.answer}</LegalParagraph>
          </section>
        ))}
      </Container>
    </LegalPageLayout>
  );
}
