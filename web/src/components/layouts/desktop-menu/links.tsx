import type { Route } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import { routes } from "@/lib/routes";

type FooterLinkItem = {
  label: string;
  href: string;
  external?: boolean;
};

const links: FooterLinkItem[] = [
  ...(siteConfig.features.showTeamMiraiSection
    ? ([
        {
          label: "チームみらいについて",
          href: siteConfig.externalLinks.teamAbout,
          external: true,
        },
      ] as FooterLinkItem[])
    : []),
  {
    label: "利用規約",
    href: routes.terms(),
    external: false,
  },
  {
    label: "プライバシーポリシー",
    href: routes.privacy(),
    external: false,
  },
  {
    label: "よくあるご質問",
    href: "/faq",
    external: false,
  },
];

/**
 * デスクトップメニュー: フッターリンク（サイドバー内）
 */
export function DesktopMenuLinks() {
  return (
    <div className="flex flex-col gap-1.5">
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href as Route}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noreferrer" : undefined}
          className="font-medium text-xs transition-opacity hover:opacity-70"
          style={{
            lineHeight: "1.48em",
          }}
        >
          {link.label}
        </Link>
      ))}
      <p
        className="font-medium text-xs"
        style={{
          lineHeight: "1.48em",
        }}
      >
        © 2025 {siteConfig.operator.name}
      </p>
    </div>
  );
}
