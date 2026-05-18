import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PressConference } from "@/features/press-conferences/shared/types";
import { routes } from "@/lib/routes";

interface ArchivePressConferencesTabProps {
  pressConferences: PressConference[];
}

export function ArchivePressConferencesTab({
  pressConferences,
}: ArchivePressConferencesTabProps) {
  if (pressConferences.length === 0) {
    return (
      <p className="text-mirai-text-muted text-sm py-4">
        市長記者会見の記録はまだ掲載されていません。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-mirai-border">
        {pressConferences.map((pc) => {
          const formattedDate = new Date(pc.heldAt).toLocaleDateString(
            "ja-JP",
            { year: "numeric", month: "long", day: "numeric" }
          );
          return (
            <li key={pc.id}>
              <Link
                href={routes.pressConferenceDetail(pc.slug)}
                className="flex items-center justify-between py-4 px-2 hover:bg-mirai-surface-grouped rounded-lg transition-colors group"
              >
                <span className="font-bold text-mirai-text text-base">
                  {formattedDate} 定例記者会見
                </span>
                <ChevronRight className="h-5 w-5 text-mirai-text-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-center">
        <Button variant="outline" size="lg" asChild className="rounded-full">
          <Link href={routes.pressConferences()}>市長記者会見を一覧で表示</Link>
        </Button>
      </div>
    </div>
  );
}
