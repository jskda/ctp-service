import { Bell, BellOff } from "lucide-react";
import { PlateTypeThreshold } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface DeficitIndicatorProps {
  deficits: PlateTypeThreshold[];
}

export function DeficitIndicator({ deficits }: DeficitIndicatorProps) {
  const hasDeficit = deficits.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={hasDeficit ? "text-destructive" : ""}>
          {hasDeficit ? (
            <Bell className="h-5 w-5 animate-pulse" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          {hasDeficit ? "⚠️ Низкие остатки" : "✅ Все остатки в норме"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasDeficit ? (
          <div className="max-h-60 overflow-y-auto">
            {deficits.map((deficit) => (
              <DropdownMenuItem key={deficit.plateTypeId} className="flex flex-col items-start gap-1">
                <div className="font-medium">
                  {deficit.format} ({deficit.manufacturer})
                </div>
                <div className="text-sm text-muted-foreground">
                  Остаток: {deficit.currentStock} / Порог: {deficit.minStockThreshold}
                </div>
                <div className="text-xs text-destructive">
                  Дефицит: {deficit.minStockThreshold - deficit.currentStock}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <DropdownMenuItem>
            <div className="text-sm text-muted-foreground py-2">
              Нет материалов с низкими остатками
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}