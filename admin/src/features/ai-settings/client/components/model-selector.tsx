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
import type { ModelCategory } from "../../shared/ai-feature-models";
import type { AiModelGroup } from "../../shared/ai-model-options";
import {
  CLI_MODEL_GROUPS,
  IMAGE_MODEL_GROUPS,
  TEXT_MODEL_GROUPS,
} from "../../shared/ai-model-options";

const MODEL_GROUPS_BY_CATEGORY: Record<ModelCategory, AiModelGroup[]> = {
  text: TEXT_MODEL_GROUPS,
  cli: CLI_MODEL_GROUPS,
  image: IMAGE_MODEL_GROUPS,
};

type ModelSelectorProps = {
  featureId: string;
  currentModel: string;
  modelCategory: ModelCategory;
};

export function ModelSelector({
  featureId,
  currentModel,
  modelCategory,
}: ModelSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const groups = MODEL_GROUPS_BY_CATEGORY[modelCategory];

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
        {groups.map((group) => (
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
