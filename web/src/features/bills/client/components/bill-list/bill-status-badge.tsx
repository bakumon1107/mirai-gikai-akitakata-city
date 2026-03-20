import { Badge } from "@/components/ui/badge";
import type { BillStatusEnum } from "../../../shared/types";

interface BillStatusBadgeProps {
  status: BillStatusEnum;
  className?: string;
}

function getCardStatusLabel(status: BillStatusEnum): string {
  switch (status) {
    case "submitted":
      return "上程済み";
    case "in_committee":
      return "委員会審査中";
    case "plenary_session":
      return "本会議採決中";
    case "approved":
      return "可決";
    case "rejected":
      return "否決";
    case "reported":
      return "専決処分報告";
    default:
      return "議案上程前";
  }
}

export function BillStatusBadge({ status, className }: BillStatusBadgeProps) {
  const getStatusVariant = (s: BillStatusEnum) => {
    switch (s) {
      case "submitted":
      case "in_committee":
      case "plenary_session":
        return "light";
      case "approved":
      case "reported":
        return "default";
      case "rejected":
        return "dark";
      default:
        return "muted";
    }
  };

  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      {getCardStatusLabel(status)}
    </Badge>
  );
}
