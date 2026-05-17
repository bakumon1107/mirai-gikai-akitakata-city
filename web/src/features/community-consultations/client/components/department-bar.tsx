import type { DepartmentStat } from "../../shared/types";

interface DepartmentBarProps {
  stats: DepartmentStat[];
  onClickDepartment?: (dept: string) => void;
}

export function DepartmentBar({
  stats,
  onClickDepartment,
}: DepartmentBarProps) {
  const max = Math.max(...stats.map((s) => s.count));

  return (
    <div className="flex flex-col gap-2">
      {stats.map((stat) => (
        <button
          key={stat.name}
          type="button"
          onClick={() => onClickDepartment?.(stat.name)}
          className="flex items-center gap-3 group text-left hover:opacity-80 transition-opacity"
        >
          <span className="text-xs text-mirai-text-secondary w-28 shrink-0 text-right">
            {stat.name}
          </span>
          <div className="flex-1 bg-mirai-surface-grouped rounded-full h-5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(stat.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-mirai-text w-10 shrink-0">
            {stat.count}件
          </span>
        </button>
      ))}
    </div>
  );
}
