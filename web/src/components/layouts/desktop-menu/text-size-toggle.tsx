"use client";

import { Switch } from "@/components/ui/switch";
import { useTextSizeToggle } from "@/lib/text-size/use-text-size-toggle";

/**
 * デスクトップメニュー: 文字サイズ切り替え (画面右上、ふりがな切り替えの下)
 */
export function DesktopMenuTextSizeToggle() {
  const { isLarge, handleToggle } = useTextSizeToggle();

  return (
    <div className="fixed top-[172px] right-6 z-50">
      <div
        className="bg-white flex items-center gap-6 font-bold text-black"
        style={{
          borderRadius: "50px",
          padding: "20px 24px 20px 36px",
          width: "332px",
        }}
      >
        <span
          className="flex-1"
          style={{
            fontSize: "20px",
          }}
        >
          文字を大きくする
        </span>
        <Switch
          checked={isLarge}
          onCheckedChange={handleToggle}
          aria-label="文字サイズの切り替え"
        />
      </div>
    </div>
  );
}
