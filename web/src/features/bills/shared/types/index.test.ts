import { describe, expect, it } from "vitest";

import { getBillStatusLabel } from "./index";

describe("getBillStatusLabel", () => {
  it("returns '準備中' for preparing", () => {
    expect(getBillStatusLabel("preparing")).toBe("準備中");
  });

  it("returns '上程済み' for submitted", () => {
    expect(getBillStatusLabel("submitted")).toBe("上程済み");
  });

  it("returns '委員会審査中' for in_committee", () => {
    expect(getBillStatusLabel("in_committee")).toBe("委員会審査中");
  });

  it("returns '本会議採決中' for plenary_session", () => {
    expect(getBillStatusLabel("plenary_session")).toBe("本会議採決中");
  });

  it("returns '可決' for approved", () => {
    expect(getBillStatusLabel("approved")).toBe("可決");
  });

  it("returns '否決' for rejected", () => {
    expect(getBillStatusLabel("rejected")).toBe("否決");
  });

  it("returns the status string as-is for unknown status", () => {
    // biome-ignore lint/suspicious/noExplicitAny: テスト用に未知のステータスを渡す
    expect(getBillStatusLabel("unknown_status" as any)).toBe("unknown_status");
  });
});
