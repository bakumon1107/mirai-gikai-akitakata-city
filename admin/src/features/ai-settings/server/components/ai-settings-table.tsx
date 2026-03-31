import "server-only";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ModelSelector } from "../../client/components/model-selector";
import {
  CONFIGURABLE_FEATURE_IDS,
  aiFeatureConfigs,
} from "../../shared/ai-feature-models";
import {
  getModelLabel,
  getProviderFromModel,
} from "../../shared/ai-model-options";
import type { AiSettingRow } from "../repositories/ai-settings-repository";

function ProviderBadge({ provider }: { provider: string }) {
  const variants: Record<string, string> = {
    OpenAI: "bg-green-100 text-green-800",
    Google: "bg-blue-100 text-blue-800",
    Anthropic: "bg-orange-100 text-orange-800",
  };
  const className = variants[provider] ?? "bg-gray-100 text-gray-800";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {provider}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const labels: Record<string, string> = {
    text: "テキスト生成",
    cli: "Web検索",
    image: "画像生成",
  };
  const variants: Record<string, string> = {
    text: "bg-purple-100 text-purple-800",
    cli: "bg-yellow-100 text-yellow-800",
    image: "bg-pink-100 text-pink-800",
  };
  const className = variants[category] ?? "bg-gray-100 text-gray-800";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {labels[category] ?? category}
    </span>
  );
}

type AiSettingsTableProps = {
  settingsMap: Map<string, AiSettingRow>;
};

export function AiSettingsTable({ settingsMap }: AiSettingsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">機能名</TableHead>
          <TableHead className="w-[100px]">カテゴリ</TableHead>
          <TableHead className="w-[100px]">AIサービス</TableHead>
          <TableHead className="w-[240px]">モデル</TableHead>
          <TableHead>説明</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aiFeatureConfigs.map((config) => {
          const isConfigurable = CONFIGURABLE_FEATURE_IDS.includes(config.id);
          const dbSetting = settingsMap.get(config.id);
          const currentModel = dbSetting?.model ?? config.model;
          const currentProvider = getProviderFromModel(currentModel);

          return (
            <TableRow key={config.id}>
              <TableCell className="font-medium">
                {config.featureName}
              </TableCell>
              <TableCell>
                <CategoryBadge category={config.modelCategory} />
              </TableCell>
              <TableCell>
                <ProviderBadge provider={currentProvider} />
              </TableCell>
              <TableCell>
                {isConfigurable ? (
                  <ModelSelector
                    featureId={config.id}
                    currentModel={currentModel}
                    modelCategory={config.modelCategory}
                  />
                ) : (
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                    {getModelLabel(currentModel)}
                  </code>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {config.description}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
