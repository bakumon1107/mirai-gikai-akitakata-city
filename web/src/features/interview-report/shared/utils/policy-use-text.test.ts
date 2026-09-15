import { describe, expect, it } from "vitest";
import { buildPrivateSubmissionNotice } from "./policy-use-text";

describe("buildPrivateSubmissionNotice", () => {
  it("政党名が設定されている場合は政党名を差し込む", () => {
    expect(buildPrivateSubmissionNotice("チームみらい")).toBe(
      "非公開で提出した場合でも、ご意見はチームみらいの政策検討に活用させていただきます。"
    );
  });

  it("政党名が空の場合は政党名を含む句を省いた文言を返す", () => {
    expect(buildPrivateSubmissionNotice("")).toBe(
      "非公開で提出した場合でも、ご意見は政策検討に活用させていただきます。"
    );
  });

  it("政党名が空白のみの場合も政党名なしとして扱う", () => {
    expect(buildPrivateSubmissionNotice("　 ")).toBe(
      "非公開で提出した場合でも、ご意見は政策検討に活用させていただきます。"
    );
  });
});
