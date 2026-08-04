import { Badge } from "@/components/ui/badge";
import type { DeliveryStatus } from "@/lib/dashboard/types";

const VARIANTS: Record<
  DeliveryStatus,
  "success" | "secondary" | "outline" | "warning"
> = {
  ACTIVE: "success",
  PAUSED: "secondary",
  ARCHIVED: "outline",
  IN_REVIEW: "warning",
};

const LABELS: Record<DeliveryStatus, string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  ARCHIVED: "Arquivado",
  IN_REVIEW: "Em revisão",
};

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
