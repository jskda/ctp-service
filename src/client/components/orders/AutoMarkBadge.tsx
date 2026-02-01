import { Badge } from "@/components/ui/badge";

interface AutoMarkBadgeProps {
  mark: string;
}

export function AutoMarkBadge({ mark }: AutoMarkBadgeProps) {
  return (
    <Badge variant="destructive" className="text-sm font-bold">
      ⚠️ {mark}
    </Badge>
  );
}