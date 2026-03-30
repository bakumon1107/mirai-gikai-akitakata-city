import type { BillStatusEnum } from "../../../shared/types";
import {
  calculateProgressWidth,
  getCurrentStep,
  getOrderedSteps,
} from "../../../shared/utils/bill-progress";

interface BillStatusProgressProps {
  status: BillStatusEnum;
  statusNote?: string | null;
}

interface StatusBadgeProps {
  message: string;
}

interface ProgressStepProps {
  label: string;
  stepNumber: number;
  currentStep: number;
  isActive: boolean;
  isPreparing: boolean;
}

// 基本ステップ定義（地方議会: 一院制）
const BASE_STEPS = [
  { label: "議案\n上程" },
  { label: "委員会\n審査" },
  { label: "本会議\n採決" },
  { label: "可決\n/否決" },
] as const;

// ステータスラベル
const STATUS_LABELS: Record<BillStatusEnum, string> = {
  preparing: "議案上程前",
  submitted: "上程済み",
  in_committee: "委員会審査中",
  plenary_session: "本会議採決中",
  approved: "可決",
  rejected: "否決",
  adopted: "採択",
  partially_adopted: "趣旨採択",
  reported: "専決処分報告",
};

// ステータスバッジコンポーネント
function StatusBadge({ message }: StatusBadgeProps) {
  if (!message) return null;

  return (
    <div className="w-full max-w-md relative">
      <div className="w-full text-center bg-mirai-gradient rounded-lg px-4 py-3.5">
        <span className="text-base font-medium text-black">{message}</span>
      </div>
      {/* 下向き三角形 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: "7.5px solid transparent",
          borderRight: "7.5px solid transparent",
          borderTop: "7.5px solid var(--color-mirai-progress-fill)",
        }}
      />
    </div>
  );
}

// プログレスステップコンポーネント
function ProgressStep({
  label,
  stepNumber,
  currentStep,
  isActive,
  isPreparing,
}: ProgressStepProps) {
  const isCurrentStep = isActive && stepNumber === currentStep;

  return (
    <div className="flex flex-col items-center">
      {/* ドット */}
      <div
        className={`w-3 h-3 rounded-full border transition-all duration-300 ${
          isActive ? "bg-primary border-primary" : "bg-gray-300 border-gray-300"
        }`}
      >
        {/* 現在のステップを強調 */}
        {isCurrentStep && (
          <div className="w-5 h-5 bg-primary rounded-full -mt-[5px] -ml-[5px]" />
        )}
      </div>

      {/* ラベル */}
      <div className="mt-2">
        <span
          className={`flex flex-col text-sm leading-6 whitespace-pre-line text-center ${
            isActive && !isPreparing ? "text-black" : "text-gray-300"
          } font-normal`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export function BillStatusProgress({
  status,
  statusNote,
}: BillStatusProgressProps) {
  const isPreparing = status === "preparing";
  const currentStep = getCurrentStep(status);
  const statusMessage = STATUS_LABELS[status] ?? "";

  const getStepState = (stepNumber: number): "active" | "inactive" => {
    if (isPreparing) return "inactive";
    return stepNumber <= currentStep ? "active" : "inactive";
  };

  const orderedSteps = getOrderedSteps(BASE_STEPS);
  const progressWidth = calculateProgressWidth(currentStep);

  return (
    <>
      <h2 className="text-[22px] font-bold mb-4">👉 審議のステータス</h2>
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col items-center gap-7">
          {/* ステータスメッセージバッジ */}
          <StatusBadge message={statusMessage} />
          {/* ステータス備考 */}
          {statusNote && (
            <p className="text-sm text-gray-600 text-center -mt-4">
              {statusNote}
            </p>
          )}

          {/* プログレスライン */}
          <div className="relative w-full max-w-md">
            {/* 背景ライン */}
            <div className="absolute top-[5.5px] left-0 w-full h-[1px] bg-gray-300" />

            {/* アクティブライン */}
            {!isPreparing && currentStep > 0 && (
              <div
                className="absolute top-[5px] left-0 h-0.5 bg-primary transition-all duration-300"
                style={{ width: `${Math.min(progressWidth, 100)}%` }}
              />
            )}

            {/* ステップドット */}
            <div className="relative flex justify-around">
              {orderedSteps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = getStepState(stepNumber) === "active";

                return (
                  <ProgressStep
                    key={stepNumber}
                    label={step.label}
                    stepNumber={stepNumber}
                    currentStep={currentStep}
                    isActive={isActive}
                    isPreparing={isPreparing}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
