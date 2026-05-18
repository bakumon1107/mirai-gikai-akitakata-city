#!/usr/bin/env python3
"""
parse-consultation-pdf.py

地域懇談会PDFのテキストを部署別意見リストに構造化してJSONで出力する。

使い方:
  pdftotext <pdf> <txt>    (-layout フラグなし)
  python3 parse-consultation-pdf.py <txt> > opinions.json
"""

import sys
import re
import json

DEPARTMENTS = [
    "危機管理監関係",
    "総務部関係",
    "企画部関係",
    "市民部関係",
    "福祉保健部関係",
    "産業部関係",
    "建設部関係",
    "教育委員会関係",
    "行政委員会関係",
    "市全体に対しての意見",
    "議会関係",
    "国・県関係",
]

DEPT_LABEL = {
    "危機管理監関係": "危機管理監関係",
    "総務部関係": "総務部関係",
    "企画部関係": "企画部関係",
    "市民部関係": "市民部関係",
    "福祉保健部関係": "福祉保健部関係",
    "産業部関係": "産業部関係",
    "建設部関係": "建設部関係",
    "教育委員会関係": "教育委員会関係",
    "行政委員会関係": "行政委員会関係",
    "市全体に対しての意見": "市全体に対して",
    "議会関係": "議会関係",
    "国・県関係": "国・県関係",
}

DEPT_PATTERN = re.compile(
    r"^\s*(" + "|".join(re.escape(d) for d in DEPARTMENTS) + r")\s*$"
)

# 意見番号行を検出する正規表現
OPINION_NUM_ONLY = re.compile(r"^\s*(\d{1,3})\s*$")
OPINION_NUM_WITH_TEXT = re.compile(r"^\s*(\d{1,3})\s+(\S.*)$")

# ページヘッダー（ページ番号と一緒に除去する対象）
HEADER_LINE = re.compile(
    r"令和7年地域懇談会住民意見|令和7年地域懇談会報告書|安芸高田市議会"
)

# 目次のページ参照行 (P. 1, P.22 等)
PAGE_REF = re.compile(r"^P\.\s*\d+$")


def parse_opinions(text: str) -> list[dict]:
    """テキストを解析して意見リストを返す。"""
    raw_lines = text.splitlines()
    opinions = []
    current_dept = None
    current_num = None
    current_lines: list[str] = []
    pending_lines: list[str] = []  # number出現前に蓄積したテキスト
    in_content = False
    saw_page_refs = False

    def flush_opinion():
        nonlocal current_num, current_lines
        if current_dept and current_num is not None:
            body = "\n".join(current_lines).strip()
            if body:
                opinions.append({
                    "department": DEPT_LABEL.get(current_dept, current_dept),
                    "opinion_number": int(current_num),
                    "text": body,
                    "is_cross_department": False,
                })
        current_num = None
        current_lines = []

    i = 0
    while i < len(raw_lines):
        line = raw_lines[i]
        stripped = line.strip()

        # 目次のページ参照行 (P. 1, P. 3 …)
        if PAGE_REF.match(stripped):
            saw_page_refs = True
            i += 1
            continue

        # 単独数字行: ページ番号か意見番号かをルックアヘッドで判定
        if OPINION_NUM_ONLY.match(stripped):
            j = i + 1
            while j < len(raw_lines) and not raw_lines[j].strip():
                j += 1
            if j < len(raw_lines) and HEADER_LINE.search(raw_lines[j].strip()):
                # ページ番号 → 数字行とヘッダー行をスキップ
                i = j + 1
                continue
            # 意見番号として処理（下で行う）

        # ページヘッダー行（単独、ページ番号の後ではない）
        if HEADER_LINE.search(stripped) and stripped:
            i += 1
            continue

        # 空行
        if not stripped:
            if current_num is not None and current_lines:
                current_lines.append("")
            i += 1
            continue

        # 部署ヘッダー検出
        dept_match = DEPT_PATTERN.match(line)
        if dept_match:
            # 目次のP.参照を見た後 = 本文セクション
            if saw_page_refs:
                flush_opinion()
                current_dept = dept_match.group(1)
                current_num = None
                current_lines = []
                pending_lines = []
                in_content = True
            i += 1
            continue

        if not in_content:
            i += 1
            continue

        # 意見番号のみ（意見番号と確定した単独数字行）
        num_only = OPINION_NUM_ONLY.match(line)
        if num_only:
            flush_opinion()
            current_num = int(num_only.group(1))
            # 番号より前に蓄積されたテキストを先頭に付ける
            current_lines = [l for l in pending_lines]
            pending_lines = []
            i += 1
            continue

        # 意見番号＋テキスト
        num_with_text = OPINION_NUM_WITH_TEXT.match(line)
        if num_with_text:
            flush_opinion()
            current_num = int(num_with_text.group(1))
            current_lines = [l for l in pending_lines] + [num_with_text.group(2).strip()]
            pending_lines = []
            i += 1
            continue

        # 通常テキスト行
        if current_num is not None:
            current_lines.append(stripped)
        else:
            pending_lines.append(stripped)

        i += 1

    flush_opinion()
    return opinions


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 parse-consultation-pdf.py <text_file>", file=sys.stderr)
        sys.exit(1)

    with open(sys.argv[1], encoding="utf-8") as f:
        text = f.read()

    opinions = parse_opinions(text)

    dept_counts: dict[str, int] = {}
    for op in opinions:
        dept_counts[op["department"]] = dept_counts.get(op["department"], 0) + 1

    print(json.dumps(opinions, ensure_ascii=False, indent=2))

    print(f"\n--- 合計 {len(opinions)} 件 ---", file=sys.stderr)
    for dept, count in sorted(dept_counts.items(), key=lambda x: -x[1]):
        print(f"  {dept}: {count}件", file=sys.stderr)


if __name__ == "__main__":
    main()
