import { AiSettingsTable } from "@/features/ai-settings/server/components/ai-settings-table";
import { loadAiSettings } from "@/features/ai-settings/server/loaders/load-ai-settings";

export default async function AiSettingsPage() {
  const settingsMap = await loadAiSettings();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">AI管理</h1>
      <p className="text-sm text-gray-600 mb-8">
        各機能で使用中のAIサービス・モデルの一覧です。切替可能な機能はセレクトボックスからモデルを変更できます。
      </p>

      <section className="rounded-lg border bg-white p-6">
        <AiSettingsTable settingsMap={settingsMap} />
      </section>
    </div>
  );
}
