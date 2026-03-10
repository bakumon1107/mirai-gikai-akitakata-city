import { siteConfig } from "@/config/site.config";

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterPolicyLink = {
  label: string;
  href: string;
  external?: boolean;
};

export const primaryLinks: FooterLink[] = [
  {
    label: "TOP",
    href: "/",
  },
  ...(siteConfig.externalLinks.aboutNote
    ? [
        {
          label: `${siteConfig.siteName}とは`,
          href: siteConfig.externalLinks.aboutNote,
          external: true,
        },
      ]
    : []),
  ...(siteConfig.features.showTeamMiraiSection
    ? ([
        {
          label: "チームみらいについて",
          href: siteConfig.externalLinks.teamAbout,
          external: true,
        },
        {
          label: "寄附で応援する",
          href: siteConfig.externalLinks.donation,
          external: true,
        },
      ] as FooterLink[])
    : []),
];

export const policyLinks: FooterPolicyLink[] = [
  {
    label: "よくあるご質問",
    href: "/faq",
  },
  {
    label: "利用規約",
    href: "/terms",
  },
  {
    label: "プライバシーポリシー",
    href: "/privacy",
  },
];
