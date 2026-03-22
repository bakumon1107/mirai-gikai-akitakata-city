import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { getAllCouncilSessions } from "@/features/council-sessions/server/loaders/get-all-council-sessions";
import { HeaderClient } from "./header-client";

export async function Header() {
  const [difficultyLevel, sessions] = await Promise.all([
    getDifficultyLevel(),
    getAllCouncilSessions(),
  ]);
  return <HeaderClient difficultyLevel={difficultyLevel} sessions={sessions} />;
}
