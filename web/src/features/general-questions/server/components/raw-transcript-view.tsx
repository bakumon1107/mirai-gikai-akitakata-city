import "server-only";

type SpeakerTurn = {
  speaker: string;
  text: string;
};

function parseSpeakerTurns(rawText: string): SpeakerTurn[] {
  const turns: SpeakerTurn[] = [];
  const segments = rawText.split("◯").filter((s) => s.trim().length > 0);

  for (const seg of segments) {
    const newlineIdx = seg.search(/[\s　]/);
    if (newlineIdx === -1) {
      turns.push({ speaker: seg.trim(), text: "" });
      continue;
    }
    const speaker = seg.slice(0, newlineIdx).trim();
    const text = seg.slice(newlineIdx).trim();
    if (speaker.includes("議長")) continue;
    turns.push({ speaker, text });
  }
  return turns;
}

function isQuestioner(speaker: string): boolean {
  return /^\d+番/.test(speaker);
}

export function RawTranscriptView({ rawText }: { rawText: string }) {
  const turns = parseSpeakerTurns(rawText);

  return (
    <div className="flex flex-col gap-4">
      {turns.map((turn, i) => {
        const isQ = isQuestioner(turn.speaker);
        return (
          <div
            key={`${i}-${turn.speaker}`}
            className={isQ ? "flex justify-end" : "flex"}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                isQ
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border text-mirai-text rounded-bl-sm"
              }`}
            >
              <p
                className={`mb-1 text-xs font-medium ${
                  isQ
                    ? "text-primary-foreground/70"
                    : "text-mirai-text-secondary"
                }`}
              >
                {turn.speaker}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {turn.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
