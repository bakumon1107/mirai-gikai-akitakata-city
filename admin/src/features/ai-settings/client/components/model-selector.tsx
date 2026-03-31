"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateAiModel } from "../../server/actions/update-ai-model";
import { AI_MODEL_GROUPS } from "../../shared/ai-model-options";

type ModelSelectorProps = {
  featureId: string;
  currentModel: string;
};

export function ModelSelector({ featureId, currentModel }: ModelSelectorProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    if (value === currentModel) return;

    startTransition(async () => {
      const result = await updateAiModel(featureId, value);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("モデルを更新しました");
      }
    });
  }

  return (
    <Select
      defaultValue={currentModel}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-[220px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {AI_MODEL_GROUPS.map((group) => (
          <SelectGroup key={group.provider}>
            <SelectLabel className="text-xs text-gray-500">
              {group.provider}
            </SelectLabel>
            {group.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
