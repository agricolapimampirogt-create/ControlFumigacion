import { statusLabels, statusTone } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { StageStatus } from "@/types";

export function StatusBadge({ status }: { status: StageStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}
