import { Badge } from "@/components/ui/badge";
import { ColorMode } from "@/types";

interface ColorModeBadgeProps {
  colorMode: ColorMode;
}

export function ColorModeBadge({ colorMode }: ColorModeBadgeProps) {
  const variantMap: Record<ColorMode, "default" | "secondary" | "outline"> = {
    CMYK: "default",
    BLACK: "secondary",
    MULTICOLOR: "outline",
  };

  return (
    <Badge variant={variantMap[colorMode]}>
      {colorMode}
    </Badge>
  );
}