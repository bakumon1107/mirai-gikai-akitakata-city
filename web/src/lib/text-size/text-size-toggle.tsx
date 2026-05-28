"use client";

import { Switch } from "@/components/ui/switch";
import { useTextSizeToggle } from "./use-text-size-toggle";

interface TextSizeToggleProps {
  className?: string;
}

export function TextSizeToggle({ className }: TextSizeToggleProps) {
  const { isLarge, handleToggle } = useTextSizeToggle();

  return (
    <div className={`flex items-center justify-between space-x-4 ${className}`}>
      <div className="space-y-0.5">
        <div className="text-sm font-medium">文字を大きくする</div>
      </div>
      <Switch
        checked={isLarge}
        onCheckedChange={handleToggle}
        aria-label="文字サイズの切り替え"
      />
    </div>
  );
}
