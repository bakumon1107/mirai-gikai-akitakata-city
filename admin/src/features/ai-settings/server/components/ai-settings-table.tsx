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
import { getModelLabel } from "../../shared/ai-model-options";
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

function ConfigTypeBadge({
  configType,
  label,
}: {
  configType: string;
  label: string;
}) {
  const variants: Record<string, string> = {
    db: "bg-purple-100 text-purple-800",
    constant: "bg-gray-100 text-gray-800",
    hardcoded: "bg-gray-100 text-gray-800",
    cli: "bg-yellow-100 text-yellow-800",
  };
  const className = variants[configType] ?? "bg-gray-100 text-gray-800";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
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
          <TableHead className="w-[100px]">AIサービス</TableHead>
          <TableHead className="w-[240px]">モデル</TableHead>
          <TableHead className="w-[160px]">設定方式</TableHead>
          <TableHead>説明</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aiFeatureConfigs.map((config) => {
          const isConfigurable = CONFIGURABLE_FEATURE_IDS.includes(config.id);
          const dbSetting = settingsMap.get(config.id);
          const currentModel = dbSetting?.model ?? config.model;

          return (
            <TableRow key={config.id}>
              <TableCell className="font-medium">
                {config.featureName}
              </TableCell>
              <TableCell>
                <ProviderBadge provider={config.provider} />
              </TableCell>
              <TableCell>
                {isConfigurable ? (
                  <ModelSelector
                    featureId={config.id}
                    currentModel={currentModel}
                  />
                ) : (
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                    {getModelLabel(currentModel)}
                  </code>
                )}
              </TableCell>
              <TableCell>
                <ConfigTypeBadge
                  configType={isConfigurable ? "db" : config.configType}
                  label={isConfigurable ? "DB設定" : config.configTypeLabel}
                />
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
