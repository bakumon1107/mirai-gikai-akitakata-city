/**
 * 議案タイトルからDALL-E 3用の画像生成プロンプトを構築する
 */
export function buildThumbnailPrompt(billName: string): string {
  return `Create a photorealistic, high-quality image that visually represents the concept of this Japanese municipal government bill: "${billName}".

Requirements:
- No text, letters, words, or characters of any kind in the image
- Professional, calm tone suitable for a government/civic context
- Photorealistic style with soft, natural lighting
- Use muted, professional colors (blues, greens, warm neutrals)
- Abstract or conceptual representation of the bill's topic
- Suitable as a web thumbnail at various sizes
- Landscape orientation (16:9 aspect ratio)`;
}
