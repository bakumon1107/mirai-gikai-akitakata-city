import { describe, expect, it } from "vitest";
import { resolveContactName } from "./contact-name";

describe("resolveContactName", () => {
  it("政党名が設定されている場合は政党名を返す", () => {
    expect(resolveContactName("チームみらい", "バクモン")).toBe("チームみらい");
  });

  it("政党名が空の場合は運営者名を返す", () => {
    expect(resolveContactName("", "バクモン")).toBe("バクモン");
  });

  it("政党名・運営者名がいずれも空の場合は汎用表現を返す", () => {
    expect(resolveContactName("", "")).toBe("運営者");
  });

  it("空白のみの値は未設定として扱う", () => {
    expect(resolveContactName("　 ", "バクモン")).toBe("バクモン");
    expect(resolveContactName("　 ", " ")).toBe("運営者");
  });
});
