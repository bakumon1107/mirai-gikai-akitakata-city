"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

type Session = {
  id: string;
  name: string;
};

type SessionFilterProps = {
  sessions: Session[];
  currentSessionId?: string;
};

export function SessionFilter({
  sessions,
  currentSessionId,
}: SessionFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelect(sessionId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (sessionId) {
      params.set("session", sessionId);
    } else {
      params.delete("session");
    }
    router.push(`${pathname}?${params.toString()}` as Route);
  }

  if (sessions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500 shrink-0">定例会:</span>
      <Button
        variant={!currentSessionId ? "default" : "outline"}
        size="sm"
        onClick={() => handleSelect(null)}
      >
        すべて
      </Button>
      {sessions.map((session) => (
        <Button
          key={session.id}
          variant={currentSessionId === session.id ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(session.id)}
        >
          {session.name}
        </Button>
      ))}
    </div>
  );
}
