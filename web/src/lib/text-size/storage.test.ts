// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getTextSizeLargeFromStorage,
  setTextSizeLargeToStorage,
} from "./storage";

describe("text-size storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("未設定時は false を返す", () => {
    expect(getTextSizeLargeFromStorage()).toBe(false);
  });

  it("true を保存して取得できる", () => {
    setTextSizeLargeToStorage(true);
    expect(getTextSizeLargeFromStorage()).toBe(true);
  });

  it("false を保存して取得できる", () => {
    setTextSizeLargeToStorage(true);
    setTextSizeLargeToStorage(false);
    expect(getTextSizeLargeFromStorage()).toBe(false);
  });

  it("'true' 以外の値が入っている場合は false を返す", () => {
    localStorage.setItem("text-size-large", "yes");
    expect(getTextSizeLargeFromStorage()).toBe(false);
  });
});
