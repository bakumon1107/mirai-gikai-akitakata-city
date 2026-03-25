/**
 * 議案タイトルと内容からDALL-E用の画像生成プロンプトを構築する
 *
 * @param billName - 議案名
 * @param normalContent - 「ふつう」難易度の議案内容（Markdown）。
 *                        未入力の場合はタイトルのみでプロンプトを構築する。
 */
export function buildThumbnailPrompt(
  billName: string,
  normalContent?: string
): string {
  // コンテンツからMarkdown記法を除去し、先頭500文字に切り詰める
  const contentSummary = normalContent
    ? truncateContent(stripMarkdown(normalContent), 500)
    : "";

  const contextBlock = contentSummary
    ? `\n\nBill content summary (use this to understand what the bill is about):\n"${contentSummary}"`
    : "";

  return `Create a photorealistic, high-quality image that visually represents the concept of this Japanese municipal government bill: "${billName}".${contextBlock}

Requirements:
- No text, letters, words, or characters of any kind in the image
- Professional, calm tone suitable for a government/civic context
- Photorealistic style with soft, natural lighting
- Use muted, professional colors (blues, greens, warm neutrals)
- Abstract or conceptual representation of the bill's topic
- Suitable as a web thumbnail at various sizes
- Landscape orientation (16:9 aspect ratio)`;
}

/** Markdown記法（見出し、リンク、強調等）を除去してプレーンテキストにする */
export function stripMarkdown(text: string): string {
  return (
    text
      // 見出し
      .replace(/^#{1,6}\s+/gm, "")
      // リンク [text](url) → text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // 画像 ![alt](url) → ""
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "")
      // 強調 **text** / __text__ → text
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      // 斜体 *text* / _text_ → text
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // コードブロック
      .replace(/```[\s\S]*?```/g, "")
      // インラインコード
      .replace(/`([^`]*)`/g, "$1")
      // リスト記号
      .replace(/^[\s]*[-*+]\s+/gm, "")
      // 番号付きリスト
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // 水平線
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // 連続する空行を1つに
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/** テキストを指定文字数で切り詰める */
export function truncateContent(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
