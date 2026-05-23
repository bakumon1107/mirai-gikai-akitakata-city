import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import { SearchForm } from "@/features/search/client/components/search-form";
import { SearchResultTabs } from "@/features/search/client/components/search-result-tabs";
import { loadSearchResults } from "@/features/search/server/loaders/search-loader";

export const metadata: Metadata = {
  title: "検索",
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await loadSearchResults(query) : null;

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-mirai-text mb-6">検索</h1>
      <Suspense>
        <SearchForm />
      </Suspense>
      <div className="mt-8">
        <SearchResultTabs query={query} results={results} />
      </div>
    </Container>
  );
}
