import "server-only";

type SpeakerTurn = {
  speaker: string;
  text: string;
};

function parseSpeakerTurns(rawText: string): SpeakerTurn[] {
  const turns: SpeakerTurn[] = [];
  const segments = rawText.split("◯").filter((s) => s.trim().length > 0);

  for (const seg of segments) {
    // 話者名と発言は 2文字以上の空白で区切られる。
    // 名前自体は "新 田 議 員" のようにCJK文字間に単一スペースを含む。
    const match = seg.match(/^(.+?)\s{2,}([\s\S]*)$/);
    if (!match) continue;

    const speaker = match[1].trim();
    const text = match[2]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");

    if (!speaker || /議\s*長/.test(speaker)) continue;
    turns.push({ speaker, text });
  }
  return turns;
}

function isQuestioner(speaker: string): boolean {
  // "新 田 議 員" のように "議員" を含む話者が質問者
  return /議\s*員/.test(speaker);
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
