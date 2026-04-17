import { useDeveloperStatus } from '@/hooks/useDeveloper';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DeveloperStatusWidget() {
  const { data, isLoading } = useDeveloperStatus();
  const status = data?.data;

  if (isLoading) return null;
  if (!status) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Нет активной партии проявителя
        </CardContent>
      </Card>
    );
  }

  const isWarning =
    status.rasterDeviation?.status === 'warning' ||
    (status.usagePercent !== null && status.usagePercent > 80);

  return (
    <Card className={cn(isWarning && 'border-yellow-500')}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5" />
            <span className="font-medium">Проявитель</span>
          </div>
          {isWarning && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
        </div>

        {status.maxAreaSqm ? (
          <>
            <div className="text-sm text-muted-foreground mb-1">
              Использовано площади: {status.totalArea} / {status.maxAreaSqm} м²
            </div>
            <Progress value={status.usagePercent || 0} className="h-2" />
            <div className="text-xs text-muted-foreground mt-2">
              Заменён: {new Date(status.startedAt).toLocaleDateString()}
            </div>
            {status.usagePercent !== null && status.usagePercent > 80 && (
              <div className="text-xs text-yellow-600 mt-1">
                Приближается замена ({status.usagePercent}%)
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Объём: {status.volumeLiters} л
              {status.concentrateName && `, ${status.concentrateName}`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Заменён: {new Date(status.startedAt).toLocaleDateString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Площадь не задана — контроль по отклонениям растра
            </div>
          </>
        )}

        {status.rasterDeviation && (
          <div className="text-xs mt-2">
            Отклонение 75%: {status.rasterDeviation.avg75.toFixed(1)}% /
            80%: {status.rasterDeviation.avg80.toFixed(1)}%
            {status.rasterDeviation.status === 'warning' && (
              <span className="text-yellow-600 ml-1">⚠️</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}