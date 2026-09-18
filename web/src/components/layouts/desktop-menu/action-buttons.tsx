import { LinkButton } from "@/components/top/link-button";
import { siteConfig } from "@/config/site.config";

/**
 * デスクトップメニュー: アクションボタン（サイドバー内）
 */
export function DesktopMenuActionButtons() {
  const showAboutNote = Boolean(siteConfig.externalLinks.aboutNote);
  // 寄附は政党運営時のみ表示（非公式運営では党への導線を出さない）
  const showDonation = siteConfig.features.showTeamMiraiSection;

  // 表示するボタンが無い場合は、余白だけが残らないよう要素ごと描画しない
  if (!showAboutNote && !showDonation) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {showAboutNote && (
        <LinkButton
          href={siteConfig.externalLinks.aboutNote}
          icon={{
            src: "/icons/note-icon.png",
            alt: "note",
            width: 20,
            height: 20,
          }}
        >
          {siteConfig.siteName}とは
        </LinkButton>
      )}

      {showDonation && (
        <LinkButton
          href={siteConfig.externalLinks.donation}
          icon={{
            src: "/icons/heart-icon.svg",
            alt: "寄附",
            width: 20,
            height: 20,
          }}
        >
          寄附で応援する
        </LinkButton>
      )}
    </div>
  );
}
