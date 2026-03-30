import Image from "next/image";
import { siteConfig } from "@/config/site.config";
import { LinkButton } from "./link-button";

export function About() {
  return (
    <div className="py-10">
      <div className="flex flex-col gap-4">
        {/* ヘッダー */}
        <div className="flex flex-col gap-4">
          <h2>
            <Image
              src="/icons/about-typography.svg"
              alt="About"
              width={143}
              height={36}
              priority
            />
          </h2>
          <p className="text-sm font-bold text-primary-accent">
            {siteConfig.siteName}とは
          </p>
        </div>

        {/* コンテンツ */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className="text-2xl font-bold leading-[43.2px]">
              議会での議論を
              <br />
              できる限りわかりやすく
            </h3>
            <p className="text-[15px] leading-[28px] text-black">
              {siteConfig.siteName}は、{siteConfig.siteDescription}
              。皆さまの意見を政治に届けることを目指して、継続的にアップデートしていきます。
            </p>
          </div>

          {/* もっと詳しく知るボタン */}
          {siteConfig.externalLinks.aboutNote && (
            <LinkButton
              href={siteConfig.externalLinks.aboutNote}
              icon={{
                src: "/icons/note-icon.png",
                alt: "note",
                width: 25,
                height: 25,
              }}
            >
              {siteConfig.siteName}とは
            </LinkButton>
          )}

          {/* 非公式運営時: 帰属・免責表記 */}
          {!siteConfig.features.showTeamMiraiSection && (
            <div className="flex flex-col gap-4 pt-2 border-t border-gray-200">
              <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-[#404040]">
                <p>
                  このサイトは「チームみらい」開発の「みらい議会」をベースに作成しています。
                </p>

                <div className="flex flex-col gap-4">
                  <LinkButton
                    href="https://team-mir.ai/"
                    icon={{
                      src: "/img/logo.svg",
                      alt: "",
                      width: 23,
                      height: 22,
                    }}
                  >
                    「チームみらい」について
                  </LinkButton>

                  <LinkButton
                    href="https://gikai.team-mir.ai/"
                    icon={{
                      src: "/icons/interview-icon-3.svg",
                      alt: "",
                      width: 18,
                      height: 17,
                    }}
                  >
                    本家「みらい議会」（国会版）を見に行く
                  </LinkButton>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-[13px] leading-relaxed text-[#404040]">
                <p>
                  このサイトは「チームみらい」の公式ではない、非公式のサイトです。
                  <br />
                  ご意見や不具合等がございましたら党公式への連絡ではなく、
                  <br />
                  開発者の
                  <a
                    href={siteConfig.operator.contactUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:opacity-70 transition-opacity"
                  >
                    {siteConfig.operator.name}
                  </a>
                  にご連絡お願いします。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
