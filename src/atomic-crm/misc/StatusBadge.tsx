import { useRecordContext } from "ra-core";
import { Badge } from "@/components/ui/badge";

type BadgeVariant = "default" | "destructive" | "secondary" | "outline";

export type StatusMap = Record<string, BadgeVariant>;

interface StatusBadgeProps {
  /** Record field to read from (uses useRecordContext). Ignored if `value` is provided. */
  source?: string;
  /** Direct value. Takes precedence over `source`. */
  value?: string;
  /** Map of value → Badge variant */
  map: StatusMap;
  /** Override displayed text. Defaults to the resolved value. */
  label?: string;
  /** Variant when value is not in the map. Defaults to "outline". */
  fallbackVariant?: BadgeVariant;
  className?: string;
}

export const StatusBadge = ({
  source,
  value: valueProp,
  map,
  label,
  fallbackVariant = "outline",
  className,
}: StatusBadgeProps) => {
  const record = useRecordContext();
  const resolved = valueProp ?? (source && record ? String(record[source] ?? "") : "");
  if (!resolved) return null;

  return (
    <Badge variant={map[resolved] ?? fallbackVariant} className={className}>
      {label ?? resolved}
    </Badge>
  );
};
