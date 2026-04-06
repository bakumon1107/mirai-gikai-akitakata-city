const REQUIREMENTS = `Requirements:
- First, identify the core subject from the bill title (e.g. "警察職員" → policing, "保育士" → childcare). Then depict that subject through its characteristic tools, equipment, spaces, or environments — the viewer should immediately recognize what field the bill is about
- DO NOT depict people or human figures. Instead, convey the subject through objects and settings alone (e.g. a nursery classroom with small colorful chairs, picture books, and wooden toys on a table; a police station desk with a cap, badge, and radio; a fire station with helmets and hoses)
- No text, letters, numbers, or written characters in the image
- Photorealistic style resembling a stock photo — avoid flat illustration, isometric, or 3D-render looks
- Natural lighting with soft shadows — no HDR or overly dramatic effects
- Muted, professional color palette — no oversaturation
- Calm, professional tone suitable for a civic/government context
- Landscape 16:9`;

/**
 * 議案タイトルと内容からDALL-E用の画像生成プロンプトを構築する
 *
 * @param billName - 議案名
 * @param billContext - 議案の補足情報（内容テキストまたは要約）
 * @param maxPromptLength - プロンプト全体の最大文字数（DALL-E 2: 1000, DALL-E 3: 4000）
 */
export function buildThumbnailPrompt(
  billName: string,
  billContext?: string,
  maxPromptLength = 4000
): string {
  const header = `Create a photorealistic image for this Japanese government bill: "${billName}". First, extract the core subject from the title — ignore procedural words like "条例の一部を改正する" and focus on the key profession, field, or entity (e.g. 警察職員=policing, 保育士=childcare, 消防=firefighting). Then create an image that conveys that subject through its characteristic objects, tools, equipment, and environments — without showing any people.`;

  // ヘッダー + 改行 + Requirements の固定部分の長さを算出
  const fixedLength = header.length + 2 + REQUIREMENTS.length;

  // 残り文字数からコンテキストブロックに使える文字数を算出
  // 装飾文字 + truncate時の "..." 分を差し引く
  const contextOverhead = '\n\nBill context:\n""'.length + 3;
  const availableForContext = maxPromptLength - fixedLength - contextOverhead;

  let contextBlock = "";
  if (billContext && availableForContext > 50) {
    const cleaned = stripMarkdown(billContext);
    const trimmed = truncateContent(cleaned, availableForContext);
    if (trimmed) {
      contextBlock = `\n\nBill context:\n"${trimmed}"`;
    }
  }

  return `${header}${contextBlock}\n\n${REQUIREMENTS}`;
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
