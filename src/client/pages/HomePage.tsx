// src/client/pages/HomePage.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Layers, Users, Settings, AlertTriangle, FileText, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDeficit } from '@/hooks/useDeficit';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function HomePage() {
  const { data: deficits } = useDeficit();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CTP-Service</h1>
        <p className="text-muted-foreground mt-2">
          Учётно-организационная система CTP-производства согласно спецификации
        </p>
      </div>

      {/* Статус дефицита согласно разделу 9 */}
      {deficits && deficits.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Дефицит материалов:</strong> {deficits.length} тип(ов) пластин ниже минимального порога
          </AlertDescription>
        </Alert>
      )}

      {/* Ключевые принципы системы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Принципы системы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <span><strong>Заказоориентированность</strong> — заказ первичен, клиент не активный агент</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <span><strong>Система действий</strong> — нет избыточного CRUD, только допустимые действия</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <span><strong>Контрольные пометки</strong> — MULTICOLOR: "Overprint control", BLACK: условные пометки</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <span><strong>Снапшоты</strong> — клиентские настройки фиксируются на момент создания заказа</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Основные модули */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/orders">
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Заказы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Управление заказами: NEW → PROCESS → DONE
                <br />
                <span className="text-xs">Автоматические контрольные пометки</span>
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/plates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Пластины
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Учёт движения и остатков
                <br />
                <span className="text-xs">Поступление, использование, брак, потери</span>
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/clients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Клиенты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Справочник клиентов
                <br />
                <span className="text-xs">Технологические настройки, снапшоты</span>
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Действия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Матрица допустимых действий
              <br />
              <span className="text-xs">Согласно спецификации, раздел 11</span>
            </p>
          </CardContent>
        </Card>

        <Link to="/settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Настройки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Системные настройки
                <br />
                <span className="text-xs">Пороги остатков, логирование</span>
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Информация о системе согласно спецификации */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Важная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md">
              <div className="font-medium text-yellow-800">MULTICOLOR заказы</div>
              <div className="text-yellow-700">
                Автоматически добавляется обязательная контрольная пометка <strong>"Overprint control"</strong>
              </div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
              <div className="font-medium text-blue-800">Клиентские настройки</div>
              <div className="text-blue-700">
                Фиксируются в снапшоте на момент создания заказа. Изменения не влияют на существующие заказы.
              </div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-md">
              <div className="font-medium text-gray-800">Чего система НЕ делает</div>
              <div className="text-gray-700">
                Не управляет оборудованием, не выполняет RIP, не хранит RIP-файлы, не является ERP/CRM
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}