import { DeficitIndicator } from "@/components/plates/DeficitIndicator";
import { PlateTypeThreshold } from "@/types";
import { Bell } from "lucide-react";

interface HeaderProps {
  deficits: PlateTypeThreshold[];
}

export function Header({ deficits }: HeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6" />
          <h1 className="text-xl font-bold">CTP Учёт</h1>
        </div>
        <DeficitIndicator deficits={deficits} />
      </div>
    </header>
  );
}