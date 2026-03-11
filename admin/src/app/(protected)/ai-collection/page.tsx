import { AiCollectionPage } from "@/features/ai-collection/client/components/ai-collection-page";
import { getExistingBillNames } from "@/features/ai-collection/server/loaders/get-existing-bill-names";
import { getRuns } from "@/features/ai-collection/server/loaders/get-runs";

export default async function AiCollectionRoute() {
  if (process.env.VERCEL) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="mb-4 text-2xl font-bold">AI情報収集</h1>
        <p className="text-mirai-text-muted">
          この機能はローカル環境でのみ利用できます。
          ローカルで情報収集・確認後、本番DBに反映してください。
        </p>
      </div>
    );
  }

  const [runs, existingBillNames] = await Promise.all([
    getRuns(),
    getExistingBillNames(),
  ]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-2xl font-bold">AI情報収集</h1>
      <AiCollectionPage
        initialRuns={runs}
        existingBillNames={existingBillNames}
      />
    </div>
  );
}
