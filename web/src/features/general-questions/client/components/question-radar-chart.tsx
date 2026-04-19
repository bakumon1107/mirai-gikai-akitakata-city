"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { RadarScores } from "../../shared/types";

const AXES = [
  "論点の具体性",
  "深掘り力",
  "提案力",
  "市民代弁度",
  "準備・調査力",
] as const;

interface QuestionRadarChartProps {
  scores: RadarScores;
}

export function QuestionRadarChart({ scores }: QuestionRadarChartProps) {
  const data = AXES.map((axis) => ({
    subject: axis,
    score: scores[axis] ?? 0,
  }));

  return (
    <div className="border border-mirai-border-muted rounded-2xl p-5 flex flex-col gap-3">
      <p className="text-xs font-medium text-muted-foreground">
        質問内容の分析
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
        >
          <PolarGrid stroke="#bebcbc" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 12, fill: "#1f2937" }}
          />
          <Radar
            dataKey="score"
            stroke="#0f8472"
            fill="#0f8472"
            fillOpacity={0.25}
            dot={{ r: 3, fill: "#0f8472" }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-5 gap-1 text-center">
        {data.map(({ subject, score }) => (
          <div key={subject} className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground leading-tight">
              {subject}
            </span>
            <span className="text-sm font-bold text-primary-accent">
              {score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
