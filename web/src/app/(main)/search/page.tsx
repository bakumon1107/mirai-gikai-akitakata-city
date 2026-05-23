import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { searchAll } from "@/features/search/server/repositories/search-repository";
import { SearchPageClient } from "@/features/search/client/components/search-page-client";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q
      ? `"${q}" の検索結果 | ${siteConfig.siteName}`
      : `キーワード検索 | ${siteConfig.siteName}`,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const keyword = q?.trim() ?? "";

  const results = keyword.length >= 2 ? await searchAll(keyword) : null;

  return (
    <Container className="py-8">
      <SearchPageClient initialQuery={keyword} results={results} />
    </Container>
  );
}
