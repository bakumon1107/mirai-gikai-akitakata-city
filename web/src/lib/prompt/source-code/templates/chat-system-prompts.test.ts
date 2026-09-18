import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site.config";
import { buildBillChatSystemHardPrompt } from "./bill-chat-system-hard";
import { buildBillChatSystemNormalPrompt } from "./bill-chat-system-normal";
import { buildTopChatSystemPrompt } from "./top-chat-system";

/**
 * 本家（政党）の紹介・政策方針に由来し、非公式運営のサイトでは
 * AIアシスタントに与えてはいけない文言
 *
 * 「チームみらい」単体は禁止しない。ベースとなった OSS の開発元として
 * SITE_OVERVIEW の帰属表記に意図的に残しているため。
 */
const PARTY_PROMOTION_TEXTS = [
  "チームみらいの概要",
  "安野貴博",
  "遅い政治を速くする",
  "チームみらいの立場",
  "チームみらいの議員",
  "チームみらいの議席",
  "チームみらい以外の政党",
];

const prompts = Object.entries({
  "top-chat-system": buildTopChatSystemPrompt("[]"),
  "bill-chat-system-normal": buildBillChatSystemNormalPrompt(
    "a",
    "b",
    "c",
    "d"
  ),
  "bill-chat-system-hard": buildBillChatSystemHardPrompt("a", "b", "c", "d"),
});

describe("チャット用システムプロンプト", () => {
  it.each(
    prompts
  )("%s は自サイト名で名乗り、対象議会を含む", (_name, prompt) => {
    expect(prompt).toContain(`あなたは「${siteConfig.siteName}」上で動作する`);
    expect(prompt).toContain(siteConfig.councilName);
    expect(prompt).toContain("非公式サービス");
  });

  it.each(
    prompts
  )("%s は特定政党の紹介・政策方針を含まない", (_name, prompt) => {
    for (const text of PARTY_PROMOTION_TEXTS) {
      expect(prompt).not.toContain(text);
    }
  });

  it.each(
    prompts
  )("%s は政党・会派・議員への支持を促さないルールを含む", (_name, prompt) => {
    expect(prompt).toContain("政治的に中立な立場を保つ");
    expect(prompt).toContain(
      "特定の政党・会派・議員への支持や投票を促す発言はしない"
    );
  });
});
