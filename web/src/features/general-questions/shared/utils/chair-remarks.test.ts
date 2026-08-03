import { describe, expect, it } from "vitest";
import {
  isSubstantiveChairRemark,
  stripProceduralPhrases,
} from "./chair-remarks";

describe("stripProceduralPhrases", () => {
  it("答弁の求め・終了の定型句を取り除く", () => {
    expect(
      stripProceduralPhrases("ただいまの質問に対し、答弁を求めます。")
    ).toBe("");
    expect(stripProceduralPhrases("以上で答弁を終わります。")).toBe("");
  });

  it("次の発言者の指名を取り除く", () => {
    expect(stripProceduralPhrases("答弁を終わります。小松議員。")).toBe("");
    expect(stripProceduralPhrases("8番、新田議員。")).toBe("");
    expect(stripProceduralPhrases("井上福祉保健部長。")).toBe("");
  });

  it("休憩・再開・散会の定型句を取り除く", () => {
    expect(
      stripProceduralPhrases(
        "以上で、山本議員の質問を終わります。ここで、13時まで休憩といたします。"
      )
    ).toBe("");
    expect(
      stripProceduralPhrases(
        "休憩を閉じて会議を再開いたします。続いて通告がありますので、発言を許します。"
      )
    ).toBe("");
  });

  it("会議録末尾の署名欄を取り除く", () => {
    expect(
      stripProceduralPhrases(
        "地方自治法第１２３条第２項の規定によりここに署名する。安芸高田市議会議長安芸高田市議会議員"
      )
    ).toBe("");
  });

  it("定型句以外はそのまま残す", () => {
    expect(
      stripProceduralPhrases(
        "山本議員に申し上げます。一般質問の通告とおりにやっていただきたいと思います。"
      )
    ).toBe(
      "山本議員に申し上げます。一般質問の通告とおりにやっていただきたいと思います。"
    );
  });
});

describe("isSubstantiveChairRemark", () => {
  it("議事進行の定型句だけの発言は実質的でないと判定する", () => {
    expect(
      isSubstantiveChairRemark("ただいまの質問に対し、答弁を求めます。")
    ).toBe(false);
    expect(isSubstantiveChairRemark("以上で答弁を終わります。小松議員。")).toBe(
      false
    );
    expect(isSubstantiveChairRemark("藤本市長。")).toBe(false);
  });

  it("議員への注意など中身のある発言は実質的と判定する", () => {
    expect(
      isSubstantiveChairRemark(
        "山本議員に申し上げます。一般質問の通告とおりにやっていただきたいと思います。簡潔にお願いいたします。"
      )
    ).toBe(true);
  });

  it("傍聴者への注意も実質的と判定する", () => {
    expect(
      isSubstantiveChairRemark(
        "答弁を終わります。一般質問の途中ではございますが、傍聴者の皆様に申し上げます。携帯電話の電源をお切りになるようお願い申し上げます。引き続き、新田議員。"
      )
    ).toBe(true);
  });

  it("会議時間の延長のお諮りも実質的と判定する", () => {
    expect(
      isSubstantiveChairRemark(
        "質問の途中ではございますが、お諮りいたします。本日の会議時間は、議事の都合により延長したいと思いますが、これに御異議ございませんか。（異議なし）"
      )
    ).toBe(true);
  });
});
