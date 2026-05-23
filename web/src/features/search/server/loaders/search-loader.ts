import "server-only";
import {
  searchBills,
  searchGeneralQuestions,
  searchPressConferences,
} from "../repositories/search-repository";
import type { SearchResults } from "../../shared/types/search-types";

export async function loadSearchResults(query: string): Promise<SearchResults> {
  if (!query.trim()) {
    return { bills: [], questions: [], pressConferences: [] };
  }

  const [bills, questions, pressConferences] = await Promise.all([
    searchBills(query),
    searchGeneralQuestions(query),
    searchPressConferences(query),
  ]);

  return { bills, questions, pressConferences };
}
