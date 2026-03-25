"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateBillThumbnail } from "../../server/actions/generate-bill-thumbnail";
import { deleteThumbnail } from "../lib/thumbnail-storage";

interface GenerateThumbnailButtonProps {
  billId?: string;
  billName: string;
  currentThumbnailUrl?: string | null;
  currentShareThumbnailUrl?: string | null;
  onGenerated: (url: string) => void;
  disabled?: boolean;
}

export function GenerateThumbnailButton({
  billId,
  billName,
  currentThumbnailUrl,
  currentShareThumbnailUrl,
  onGenerated,
  disabled,
}: GenerateThumbnailButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!billName.trim()) {
      toast.error("議案名を入力してからAI画像生成を実行してください");
      return;
    }

    setIsGenerating(true);
    try {
      // 既存の画像を削除
      if (currentThumbnailUrl) {
        await deleteThumbnail(currentThumbnailUrl);
      }
      if (
        currentShareThumbnailUrl &&
        currentShareThumbnailUrl !== currentThumbnailUrl
      ) {
        await deleteThumbnail(currentShareThumbnailUrl);
      }

      const result = await generateBillThumbnail(billId ?? "new", billName);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      onGenerated(result.thumbnailUrl);
      toast.success("AI画像を生成しました");
    } catch {
      toast.error("画像生成中にエラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGenerate}
      disabled={disabled || isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          AI画像生成中...
        </>
      ) : (
        <>
          <ImagePlus className="mr-2 h-4 w-4" />
          AI画像生成
        </>
      )}
    </Button>
  );
}
